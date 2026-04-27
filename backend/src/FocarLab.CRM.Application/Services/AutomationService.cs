using System.Text.Json;
using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using FocarLab.CRM.Domain.Entities;
using FocarLab.CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Services;

public interface IAutomationService
{
    Task<AiPreviewResponse> GenerateAiPreviewAsync(AiPreviewRequest request, CancellationToken cancellationToken = default);
    Task<WebhookProcessResponse> ProcessN8nWebhookAsync(string payloadJson, string signature, CancellationToken cancellationToken = default);
    Task<WebhookProcessResponse> ProcessWhatsAppWebhookAsync(string payloadJson, string signature, CancellationToken cancellationToken = default);
}

public sealed class AutomationService(IAppDbContext dbContext, IOpenAiService openAiService, IDateTimeProvider dateTimeProvider) : IAutomationService
{
    public async Task<AiPreviewResponse> GenerateAiPreviewAsync(AiPreviewRequest request, CancellationToken cancellationToken = default)
    {
        var lead = await dbContext.Leads
            .AsNoTracking()
            .Include(x => x.Tags)
            .Include(x => x.Messages.OrderByDescending(message => message.SentAtUtc))
            .FirstOrDefaultAsync(x => x.Id == request.LeadId, cancellationToken)
            ?? throw new NotFoundException("Lead not found.");

        var promptTemplate = request.PromptTemplateId.HasValue
            ? await dbContext.PromptTemplates.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.PromptTemplateId.Value, cancellationToken)
            : await dbContext.PromptTemplates.AsNoTracking().FirstOrDefaultAsync(x => x.IsDefault, cancellationToken);

        if (promptTemplate is null)
        {
            throw new AppValidationException("No prompt template is configured.");
        }

        var leadSnapshot = new Dictionary<string, string?>
        {
            ["leadName"] = lead.FullName,
            ["courseInterest"] = lead.CourseInterest,
            ["company"] = lead.Company,
            ["status"] = lead.Status.ToString(),
            ["source"] = lead.Source.ToString(),
            ["tags"] = string.Join(", ", lead.Tags.Select(x => x.Name)),
            ["message"] = request.Message.Trim(),
            ["lastMessage"] = lead.Messages.FirstOrDefault()?.Content
        };

        var userPrompt = promptTemplate.UserPromptTemplate;
        foreach (var (key, value) in leadSnapshot)
        {
            userPrompt = userPrompt.Replace($"{{{key}}}", value ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        }

        var aiRequest = new OpenAiReplyRequest(promptTemplate.Name, promptTemplate.SystemPrompt, userPrompt, lead.Id);

        try
        {
            var result = await openAiService.GenerateSalesReplyAsync(aiRequest, cancellationToken);

            dbContext.AiInteractionLogs.Add(new AiInteractionLog
            {
                LeadId = lead.Id,
                PromptTemplateName = promptTemplate.Name,
                Input = userPrompt,
                Output = result.Reply,
                Model = result.Model,
                TokensUsed = result.TokensUsed,
                Success = true
            });

            await dbContext.SaveChangesAsync(cancellationToken);

            return new AiPreviewResponse(
                promptTemplate.Name,
                result.Reply,
                BuildQualificationSummary(lead),
                BuildRecommendedNextStep(lead));
        }
        catch (Exception exception)
        {
            dbContext.AiInteractionLogs.Add(new AiInteractionLog
            {
                LeadId = lead.Id,
                PromptTemplateName = promptTemplate.Name,
                Input = userPrompt,
                Output = string.Empty,
                Success = false,
                ErrorMessage = exception.Message
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            throw;
        }
    }

    public async Task<WebhookProcessResponse> ProcessN8nWebhookAsync(string payloadJson, string signature, CancellationToken cancellationToken = default)
    {
        var payload = JsonDocument.Parse(payloadJson);
        var root = payload.RootElement;
        var eventType = root.TryGetProperty("eventType", out var eventTypeElement)
            ? eventTypeElement.GetString() ?? "unknown"
            : "unknown";

        try
        {
            switch (eventType)
            {
                case "lead.created":
                    await ProcessLeadCreatedAsync(root, cancellationToken);
                    break;
                case "lead.status.updated":
                    await ProcessLeadStatusUpdatedAsync(root, cancellationToken);
                    break;
                case "lead.note.added":
                    await ProcessLeadNoteAddedAsync(root, cancellationToken);
                    break;
            }

            await LogWebhookAsync("n8n", eventType, payloadJson, signature, true, 200, null, cancellationToken);
            return new WebhookProcessResponse("n8n", eventType, true, "Webhook processed successfully.");
        }
        catch (Exception exception)
        {
            await LogWebhookAsync("n8n", eventType, payloadJson, signature, false, 400, exception.Message, cancellationToken);
            throw;
        }
    }

    public async Task<WebhookProcessResponse> ProcessWhatsAppWebhookAsync(string payloadJson, string signature, CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = JsonDocument.Parse(payloadJson);
            var root = payload.RootElement;

            var contactPhone = root.GetProperty("contact").GetProperty("wa_id").GetString();
            var contactName = root.GetProperty("contact").GetProperty("name").GetString();
            var message = root.GetProperty("message").GetProperty("text").GetString() ?? string.Empty;
            var externalMessageId = root.GetProperty("message").GetProperty("id").GetString();

            if (string.IsNullOrWhiteSpace(contactPhone))
            {
                throw new AppValidationException("WhatsApp payload does not include a contact phone.");
            }

            var lead = await dbContext.Leads
                .Include(x => x.Messages)
                .Include(x => x.Tags)
                .Include(x => x.Notes)
                .FirstOrDefaultAsync(x => x.Phone == contactPhone, cancellationToken);

            if (lead is null)
            {
                lead = new Lead
                {
                    FullName = string.IsNullOrWhiteSpace(contactName) ? contactPhone : contactName,
                    Phone = contactPhone,
                    Source = LeadSource.WhatsApp,
                    Status = LeadStatus.New
                };

                dbContext.Leads.Add(lead);
            }

            lead.Messages.Add(new ConversationMessage
            {
                Channel = "whatsapp",
                Direction = MessageDirection.Inbound,
                Content = message,
                ExternalMessageId = externalMessageId,
                SentAtUtc = dateTimeProvider.UtcNow
            });

            lead.Score = await CalculateLightweightScoreAsync(lead, cancellationToken);

            await dbContext.Activities.AddAsync(new ActivityLog
            {
                LeadId = lead.Id,
                Type = "whatsapp.message.received",
                Description = $"Inbound WhatsApp message received from {lead.FullName}.",
                HappenedAtUtc = dateTimeProvider.UtcNow
            }, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
            await LogWebhookAsync("whatsapp", "message.received", payloadJson, signature, true, 200, null, cancellationToken);

            return new WebhookProcessResponse("whatsapp", "message.received", true, "WhatsApp message stored.");
        }
        catch (Exception exception)
        {
            await LogWebhookAsync("whatsapp", "message.received", payloadJson, signature, false, 400, exception.Message, cancellationToken);
            throw;
        }
    }

    private async Task ProcessLeadCreatedAsync(JsonElement root, CancellationToken cancellationToken)
    {
        var data = root.GetProperty("data");
        var phone = data.GetProperty("phone").GetString() ?? string.Empty;
        var existingLead = await dbContext.Leads.FirstOrDefaultAsync(x => x.Phone == phone, cancellationToken);
        if (existingLead is not null)
        {
            return;
        }

        var lead = new Lead
        {
            FullName = data.GetProperty("fullName").GetString() ?? "Unnamed Lead",
            Email = data.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null,
            Phone = phone,
            Company = data.TryGetProperty("company", out var companyElement) ? companyElement.GetString() : null,
            CourseInterest = data.TryGetProperty("courseInterest", out var courseElement) ? courseElement.GetString() : null,
            PotentialRevenue = data.TryGetProperty("potentialRevenue", out var revenueElement) ? revenueElement.GetDecimal() : 0,
            Source = ParseLeadSource(data.TryGetProperty("source", out var sourceElement) ? sourceElement.GetString() : null),
            ExternalId = data.TryGetProperty("externalId", out var externalIdElement) ? externalIdElement.GetString() : null
        };

        dbContext.Leads.Add(lead);
        await dbContext.Activities.AddAsync(new ActivityLog
        {
            LeadId = lead.Id,
            Type = "webhook.lead.created",
            Description = $"Lead {lead.FullName} created from n8n webhook.",
            HappenedAtUtc = dateTimeProvider.UtcNow
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ProcessLeadStatusUpdatedAsync(JsonElement root, CancellationToken cancellationToken)
    {
        var data = root.GetProperty("data");
        var leadId = data.GetProperty("leadId").GetGuid();
        var status = Enum.Parse<LeadStatus>(data.GetProperty("status").GetString() ?? LeadStatus.New.ToString(), true);

        var lead = await dbContext.Leads.FirstOrDefaultAsync(x => x.Id == leadId, cancellationToken)
            ?? throw new NotFoundException("Lead not found for status update.");

        lead.Status = status;
        await dbContext.Activities.AddAsync(new ActivityLog
        {
            LeadId = lead.Id,
            Type = "webhook.lead.status.updated",
            Description = $"Lead {lead.FullName} status updated to {status} by n8n webhook.",
            HappenedAtUtc = dateTimeProvider.UtcNow
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ProcessLeadNoteAddedAsync(JsonElement root, CancellationToken cancellationToken)
    {
        var data = root.GetProperty("data");
        var leadId = data.GetProperty("leadId").GetGuid();
        var content = data.GetProperty("content").GetString() ?? string.Empty;

        var leadExists = await dbContext.Leads.AnyAsync(x => x.Id == leadId, cancellationToken);
        if (!leadExists)
        {
            throw new NotFoundException("Lead not found for note creation.");
        }

        dbContext.LeadNotes.Add(new LeadNote
        {
            LeadId = leadId,
            CreatedByUserId = Guid.Empty,
            Content = content
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task LogWebhookAsync(string provider, string eventType, string payloadJson, string signature, bool success, int statusCode, string? errorMessage, CancellationToken cancellationToken)
    {
        dbContext.WebhookLogs.Add(new WebhookLog
        {
            Provider = provider,
            EventType = eventType,
            PayloadJson = payloadJson,
            Signature = signature,
            Success = success,
            StatusCode = statusCode,
            ErrorMessage = errorMessage
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<int> CalculateLightweightScoreAsync(Lead lead, CancellationToken cancellationToken)
    {
        var rules = await dbContext.LeadScoringRules.AsNoTracking().Where(x => x.IsEnabled).ToListAsync(cancellationToken);
        var engagement = (lead.Messages.Count * 3) + (lead.Notes.Count * 2);
        var score = lead.ManualScoreAdjustment;

        foreach (var rule in rules)
        {
            if (rule.RuleType == ScoringRuleType.MessageCountAtLeast && lead.Messages.Count >= rule.Threshold)
            {
                score += rule.Points;
            }

            if (rule.RuleType == ScoringRuleType.EngagementAtLeast && engagement >= rule.Threshold)
            {
                score += rule.Points;
            }
        }

        return score;
    }

    private static LeadSource ParseLeadSource(string? source)
    {
        return Enum.TryParse<LeadSource>(source, true, out var value) ? value : LeadSource.Other;
    }

    private static string BuildQualificationSummary(Lead lead)
    {
        var summary = lead.Status switch
        {
            LeadStatus.Converted => "The lead is already converted and should receive onboarding-focused messaging.",
            LeadStatus.Qualified => "The lead is qualified and ready for offer-driven follow-up.",
            LeadStatus.Contacted => "The lead has active conversation history and should receive a targeted next-step message.",
            _ => "The lead is still early in the funnel and should receive discovery-oriented qualification questions."
        };

        return $"{summary} Current score: {lead.Score}.";
    }

    private static string BuildRecommendedNextStep(Lead lead)
    {
        return lead.Status switch
        {
            LeadStatus.New => "Ask two short qualification questions and offer a quick call.",
            LeadStatus.Contacted => "Address the last objection and propose a specific class or offer.",
            LeadStatus.Qualified => "Send urgency-driven CTA with class availability and payment link.",
            LeadStatus.Converted => "Move the conversation toward onboarding and student success.",
            _ => "Archive or re-engage later with a softer value-based sequence."
        };
    }
}
