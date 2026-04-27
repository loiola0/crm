using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Domain.Entities;

namespace FocarLab.CRM.Application.Abstractions;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}

public interface IJwtTokenService
{
    string CreateToken(AppUser user);
}

public interface IOpenAiService
{
    Task<OpenAiReplyResult> GenerateSalesReplyAsync(OpenAiReplyRequest request, CancellationToken cancellationToken = default);
}
