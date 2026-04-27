using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Domain.Entities;
using FocarLab.CRM.Domain.Enums;
using FocarLab.CRM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FocarLab.CRM.Infrastructure.Seeding;

public sealed class DatabaseSeeder(
    ApplicationDbContext dbContext,
    IPasswordHasher passwordHasher,
    IConfiguration configuration,
    IDateTimeProvider dateTimeProvider,
    ILogger<DatabaseSeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);

        if (!await dbContext.Users.AnyAsync(cancellationToken))
        {
            var masterEmail = (configuration["MASTER_USER_EMAIL"] ?? "master@focarlab.local").Trim().ToLowerInvariant();
            var masterPassword = configuration["MASTER_USER_PASSWORD"] ?? "ChangeMe123!";

            dbContext.Users.Add(new AppUser
            {
                FullName = "Focar Lab Master",
                Email = masterEmail,
                PasswordHash = passwordHasher.HashPassword(masterPassword),
                Role = UserRole.Master,
                IsActive = true
            });

            logger.LogInformation("Seeded master user {Email}.", masterEmail);
        }

        if (!await dbContext.LeadScoringRules.AnyAsync(cancellationToken))
        {
            dbContext.LeadScoringRules.AddRange(
                new LeadScoringRule
                {
                    Name = "VIP tag boost",
                    RuleType = ScoringRuleType.TagContains,
                    ConditionValue = "vip",
                    Points = 20
                },
                new LeadScoringRule
                {
                    Name = "3+ messages",
                    RuleType = ScoringRuleType.MessageCountAtLeast,
                    Threshold = 3,
                    Points = 10
                },
                new LeadScoringRule
                {
                    Name = "High engagement",
                    RuleType = ScoringRuleType.EngagementAtLeast,
                    Threshold = 12,
                    Points = 15
                });
        }

        if (!await dbContext.PromptTemplates.AnyAsync(cancellationToken))
        {
            dbContext.PromptTemplates.Add(new PromptTemplate
            {
                Name = "Sales qualifier",
                Description = "Default prompt for warm, concise WhatsApp sales follow-up.",
                IsDefault = true,
                SystemPrompt = "You are a senior education sales assistant for Focar Lab. Be warm, concise, and conversion-focused. Ask clarifying questions, handle objections naturally, and always guide the lead to the next concrete action.",
                UserPromptTemplate = """
Lead name: {leadName}
Lead source: {source}
Lead status: {status}
Course interest: {courseInterest}
Company: {company}
Tags: {tags}
Last CRM message: {lastMessage}
Incoming message: {message}

Write the next WhatsApp reply in Brazilian Portuguese. Keep it under 120 words, friendly, and action-oriented.
"""
            });
        }

        if (!await dbContext.Activities.AnyAsync(cancellationToken))
        {
            dbContext.Activities.Add(new ActivityLog
            {
                Type = "system.seeded",
                Description = "Initial CRM seed completed.",
                HappenedAtUtc = dateTimeProvider.UtcNow
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
