using FocarLab.CRM.Domain.Common;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Domain.Entities;

public sealed class ActivityLog : BaseEntity
{
    public Guid? LeadId { get; set; }
    public Guid? UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public DateTimeOffset HappenedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public Lead? Lead { get; set; }
    public AppUser? User { get; set; }
}

public sealed class WebhookLog : BaseEntity
{
    public string Provider { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
    public string? Signature { get; set; }
    public bool Success { get; set; }
    public int? StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class AiInteractionLog : BaseEntity
{
    public Guid? LeadId { get; set; }
    public string PromptTemplateName { get; set; } = string.Empty;
    public string Input { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
    public string? Model { get; set; }
    public int TokensUsed { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

public sealed class LeadScoringRule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ScoringRuleType RuleType { get; set; } = ScoringRuleType.MessageCountAtLeast;
    public string? ConditionValue { get; set; }
    public int Threshold { get; set; }
    public int Points { get; set; }
    public bool IsEnabled { get; set; } = true;
}

public sealed class PromptTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SystemPrompt { get; set; } = string.Empty;
    public string UserPromptTemplate { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
