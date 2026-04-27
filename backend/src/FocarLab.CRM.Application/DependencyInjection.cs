using FocarLab.CRM.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FocarLab.CRM.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAutomationService, AutomationService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IEducationService, EducationService>();
        services.AddScoped<ILeadService, LeadService>();
        services.AddScoped<ISettingsService, SettingsService>();

        return services;
    }
}
