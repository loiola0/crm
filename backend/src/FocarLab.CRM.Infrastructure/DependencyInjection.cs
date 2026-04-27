using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Infrastructure.Configuration;
using FocarLab.CRM.Infrastructure.Persistence;
using FocarLab.CRM.Infrastructure.Seeding;
using FocarLab.CRM.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FocarLab.CRM.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var databaseUrl = configuration["DATABASE_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=focarlab_crm;Username=postgres;Password=postgres";

        services.Configure<JwtOptions>(options =>
        {
            options.Secret = configuration["JWT_SECRET"] ?? "development-only-secret-change-me";
            options.Issuer = configuration["JWT_ISSUER"] ?? "FocarLab.CRM";
            options.Audience = configuration["JWT_AUDIENCE"] ?? "FocarLab.CRM.Client";
            options.ExpiryHours = int.TryParse(configuration["JWT_EXPIRY_HOURS"], out var expiryHours) ? expiryHours : 8;
        });

        services.Configure<OpenAiOptions>(options =>
        {
            options.ApiKey = configuration["OPENAI_API_KEY"] ?? string.Empty;
            options.BaseUrl = configuration["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1/";
            options.Model = configuration["OPENAI_MODEL"] ?? "gpt-4.1-mini";
        });

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(ConnectionStringResolver.Resolve(databaseUrl)).UseSnakeCaseNamingConvention());

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddHttpClient<IOpenAiService, OpenAiService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
        });
        services.AddScoped<DatabaseSeeder>();

        return services;
    }
}
