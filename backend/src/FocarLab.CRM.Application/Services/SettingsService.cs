using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using FocarLab.CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Services;

public interface ISettingsService
{
    Task<SettingsOverviewResponse> GetOverviewAsync(bool openAiConfigured, bool webhookConfigured, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<LeadScoringRuleResponse>> SaveScoringRulesAsync(IReadOnlyCollection<LeadScoringRuleRequest> request, CancellationToken cancellationToken = default);
    Task<PromptTemplateResponse> CreatePromptTemplateAsync(PromptTemplateRequest request, CancellationToken cancellationToken = default);
    Task<PromptTemplateResponse> UpdatePromptTemplateAsync(Guid id, PromptTemplateRequest request, CancellationToken cancellationToken = default);
}

public sealed class SettingsService(IAppDbContext dbContext) : ISettingsService
{
    public async Task<SettingsOverviewResponse> GetOverviewAsync(bool openAiConfigured, bool webhookConfigured, CancellationToken cancellationToken = default)
    {
        var rules = await dbContext.LeadScoringRules
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new LeadScoringRuleResponse(x.Id, x.Name, x.RuleType, x.ConditionValue, x.Threshold, x.Points, x.IsEnabled))
            .ToListAsync(cancellationToken);

        var prompts = await dbContext.PromptTemplates
            .AsNoTracking()
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.Name)
            .Select(x => new PromptTemplateResponse(x.Id, x.Name, x.Description, x.SystemPrompt, x.UserPromptTemplate, x.IsDefault))
            .ToListAsync(cancellationToken);

        var webhookLogs = await dbContext.WebhookLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(12)
            .Select(x => new RecentWebhookLogResponse(x.Id, x.Provider, x.EventType, x.Success, x.StatusCode, x.ErrorMessage, x.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        var aiLogs = await dbContext.AiInteractionLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(12)
            .Select(x => new RecentAiLogResponse(x.Id, x.PromptTemplateName, x.Success, x.Model, x.TokensUsed, x.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new SettingsOverviewResponse(openAiConfigured, webhookConfigured, rules, prompts, webhookLogs, aiLogs);
    }

    public async Task<IReadOnlyCollection<LeadScoringRuleResponse>> SaveScoringRulesAsync(IReadOnlyCollection<LeadScoringRuleRequest> request, CancellationToken cancellationToken = default)
    {
        var existingRules = await dbContext.LeadScoringRules.ToListAsync(cancellationToken);
        var inputIds = request.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();

        foreach (var rule in existingRules.Where(x => !inputIds.Contains(x.Id)))
        {
            dbContext.LeadScoringRules.Remove(rule);
        }

        foreach (var dto in request)
        {
            LeadScoringRule rule;
            if (dto.Id.HasValue)
            {
                rule = existingRules.FirstOrDefault(x => x.Id == dto.Id.Value)
                    ?? throw new NotFoundException($"Scoring rule {dto.Id.Value} was not found.");
            }
            else
            {
                rule = new LeadScoringRule();
                dbContext.LeadScoringRules.Add(rule);
            }

            rule.Name = dto.Name.Trim();
            rule.RuleType = dto.RuleType;
            rule.ConditionValue = dto.ConditionValue?.Trim();
            rule.Threshold = dto.Threshold;
            rule.Points = dto.Points;
            rule.IsEnabled = dto.IsEnabled;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.LeadScoringRules
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new LeadScoringRuleResponse(x.Id, x.Name, x.RuleType, x.ConditionValue, x.Threshold, x.Points, x.IsEnabled))
            .ToListAsync(cancellationToken);
    }

    public async Task<PromptTemplateResponse> CreatePromptTemplateAsync(PromptTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var entity = new PromptTemplate();
        await ApplyPromptTemplateAsync(entity, request, cancellationToken);
        dbContext.PromptTemplates.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new PromptTemplateResponse(entity.Id, entity.Name, entity.Description, entity.SystemPrompt, entity.UserPromptTemplate, entity.IsDefault);
    }

    public async Task<PromptTemplateResponse> UpdatePromptTemplateAsync(Guid id, PromptTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new NotFoundException("Prompt template not found.");

        await ApplyPromptTemplateAsync(entity, request, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new PromptTemplateResponse(entity.Id, entity.Name, entity.Description, entity.SystemPrompt, entity.UserPromptTemplate, entity.IsDefault);
    }

    private async Task ApplyPromptTemplateAsync(PromptTemplate entity, PromptTemplateRequest request, CancellationToken cancellationToken)
    {
        entity.Name = request.Name.Trim();
        entity.Description = request.Description.Trim();
        entity.SystemPrompt = request.SystemPrompt.Trim();
        entity.UserPromptTemplate = request.UserPromptTemplate.Trim();
        entity.IsDefault = request.IsDefault;

        if (!entity.IsDefault)
        {
            return;
        }

        var others = await dbContext.PromptTemplates.Where(x => x.Id != entity.Id && x.IsDefault).ToListAsync(cancellationToken);
        foreach (var other in others)
        {
            other.IsDefault = false;
        }
    }
}
