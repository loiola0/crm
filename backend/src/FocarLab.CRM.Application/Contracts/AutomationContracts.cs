using System.ComponentModel.DataAnnotations;

namespace FocarLab.CRM.Application.Contracts;

public sealed record AiPreviewRequest(
    [Required] Guid LeadId,
    [Required, MinLength(1), MaxLength(4000)] string Message,
    Guid? PromptTemplateId);

public sealed record AiPreviewResponse(
    string PromptTemplateName,
    string Reply,
    string QualificationSummary,
    string RecommendedNextStep);

public sealed record OpenAiReplyRequest(
    string PromptTemplateName,
    string SystemPrompt,
    string UserPrompt,
    Guid? LeadId);

public sealed record OpenAiReplyResult(
    string Reply,
    string Model,
    int TokensUsed);

public sealed record WebhookProcessResponse(
    string Provider,
    string EventType,
    bool Success,
    string Message);
