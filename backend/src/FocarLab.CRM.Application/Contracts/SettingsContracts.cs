using System.ComponentModel.DataAnnotations;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Application.Contracts;

public sealed record LeadScoringRuleRequest(
    Guid? Id,
    [Required, MaxLength(120)] string Name,
    ScoringRuleType RuleType,
    string? ConditionValue,
    int Threshold,
    int Points,
    bool IsEnabled);

public sealed record PromptTemplateRequest(
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(1000)] string Description,
    [Required, MaxLength(8000)] string SystemPrompt,
    [Required, MaxLength(8000)] string UserPromptTemplate,
    bool IsDefault);

public sealed record RecentWebhookLogResponse(Guid Id, string Provider, string EventType, bool Success, int? StatusCode, string? ErrorMessage, DateTimeOffset CreatedAtUtc);
public sealed record RecentAiLogResponse(Guid Id, string PromptTemplateName, bool Success, string? Model, int TokensUsed, DateTimeOffset CreatedAtUtc);

public sealed record LeadScoringRuleResponse(Guid Id, string Name, ScoringRuleType RuleType, string? ConditionValue, int Threshold, int Points, bool IsEnabled);
public sealed record PromptTemplateResponse(Guid Id, string Name, string Description, string SystemPrompt, string UserPromptTemplate, bool IsDefault);

public sealed record SettingsOverviewResponse(
    bool OpenAiConfigured,
    bool WebhookSecretConfigured,
    IReadOnlyCollection<LeadScoringRuleResponse> ScoringRules,
    IReadOnlyCollection<PromptTemplateResponse> PromptTemplates,
    IReadOnlyCollection<RecentWebhookLogResponse> RecentWebhookLogs,
    IReadOnlyCollection<RecentAiLogResponse> RecentAiLogs);
