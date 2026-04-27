namespace FocarLab.CRM.Infrastructure.Configuration;

public sealed class JwtOptions
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "FocarLab.CRM";
    public string Audience { get; set; } = "FocarLab.CRM.Client";
    public int ExpiryHours { get; set; } = 8;
}

public sealed class OpenAiOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";
    public string Model { get; set; } = "gpt-4.1-mini";
}
