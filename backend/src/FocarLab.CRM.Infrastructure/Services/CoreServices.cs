using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using FocarLab.CRM.Domain.Entities;
using FocarLab.CRM.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FocarLab.CRM.Infrastructure.Services;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

public sealed class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string passwordHash) => BCrypt.Net.BCrypt.Verify(password, passwordHash);
}

public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    public string CreateToken(AppUser user)
    {
        var jwtOptions = options.Value;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(jwtOptions.ExpiryHours);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed class OpenAiService(HttpClient httpClient, IOptions<OpenAiOptions> options) : IOpenAiService
{
    public async Task<OpenAiReplyResult> GenerateSalesReplyAsync(OpenAiReplyRequest request, CancellationToken cancellationToken = default)
    {
        var openAiOptions = options.Value;
        if (string.IsNullOrWhiteSpace(openAiOptions.ApiKey))
        {
            throw new AppValidationException("OPENAI_API_KEY is not configured.");
        }

        httpClient.BaseAddress ??= new Uri(openAiOptions.BaseUrl);
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", openAiOptions.ApiKey);

        var payload = new
        {
            model = openAiOptions.Model,
            instructions = request.SystemPrompt,
            input = request.UserPrompt,
            temperature = 0.3
        };

        using var response = await httpClient.PostAsJsonAsync("responses", payload, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new AppValidationException($"OpenAI request failed: {response.StatusCode} {content}");
        }

        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;

        var reply = root.TryGetProperty("output_text", out var outputText)
            ? outputText.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(reply) && root.TryGetProperty("output", out var outputArray))
        {
            reply = string.Join(
                "\n",
                outputArray.EnumerateArray()
                    .SelectMany(item => item.TryGetProperty("content", out var contentArray)
                        ? contentArray.EnumerateArray()
                        : Enumerable.Empty<JsonElement>())
                    .Where(item => item.TryGetProperty("text", out _))
                    .Select(item => item.GetProperty("text").GetString())
                    .Where(text => !string.IsNullOrWhiteSpace(text)));
        }

        return new OpenAiReplyResult(
            reply ?? "No response content returned.",
            root.TryGetProperty("model", out var modelElement) ? modelElement.GetString() ?? openAiOptions.Model : openAiOptions.Model,
            root.TryGetProperty("usage", out var usageElement) && usageElement.TryGetProperty("total_tokens", out var tokenElement) ? tokenElement.GetInt32() : 0);
    }
}
