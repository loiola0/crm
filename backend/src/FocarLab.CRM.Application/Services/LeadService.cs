using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Common;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using FocarLab.CRM.Domain.Entities;
using FocarLab.CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Services;

public interface ILeadService
{
    Task<PagedResult<LeadListItemResponse>> GetAsync(LeadQueryRequest request, CancellationToken cancellationToken = default);
    Task<LeadDetailResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LeadDetailResponse> CreateAsync(CreateLeadRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<LeadDetailResponse> UpdateAsync(Guid id, UpdateLeadRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<LeadDetailResponse> UpdateStatusAsync(Guid id, UpdateLeadStatusRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<LeadNoteResponse> AddNoteAsync(Guid id, AddLeadNoteRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<ConversationMessageResponse> AddMessageAsync(Guid id, AddConversationMessageRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<int> RecalculateScoreAsync(Guid id, Guid actorUserId, CancellationToken cancellationToken = default);
}

public sealed class LeadService(IAppDbContext dbContext, IDateTimeProvider dateTimeProvider) : ILeadService
{
    public async Task<PagedResult<LeadListItemResponse>> GetAsync(LeadQueryRequest request, CancellationToken cancellationToken = default)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 100);

        var query = dbContext.Leads
            .AsNoTracking()
            .Include(x => x.Tags)
            .Include(x => x.OwnerUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.FullName.ToLower().Contains(search) ||
                (x.Email != null && x.Email.ToLower().Contains(search)) ||
                x.Phone.ToLower().Contains(search) ||
                (x.Company != null && x.Company.ToLower().Contains(search)));
        }

        if (request.Status.HasValue)
        {
            query = query.Where(x => x.Status == request.Status);
        }

        if (request.Source.HasValue)
        {
            query = query.Where(x => x.Source == request.Source);
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new LeadListItemResponse(
                x.Id,
                x.FullName,
                x.Email,
                x.Phone,
                x.Company,
                x.CourseInterest,
                x.Status,
                x.Source,
                x.Score,
                x.PotentialRevenue,
                x.ClosedRevenue,
                x.OwnerUser != null ? x.OwnerUser.FullName : null,
                x.Tags.Select(tag => tag.Name).OrderBy(name => name).ToArray(),
                x.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        return new PagedResult<LeadListItemResponse>(items, page, pageSize, totalItems, totalPages);
    }

    public async Task<LeadDetailResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        return MapLead(lead);
    }

    public async Task<LeadDetailResponse> CreateAsync(CreateLeadRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = new Lead
        {
            FullName = request.FullName.Trim(),
            Email = NormalizeEmail(request.Email),
            Phone = request.Phone.Trim(),
            Company = request.Company?.Trim(),
            CourseInterest = request.CourseInterest?.Trim(),
            Source = request.Source,
            PotentialRevenue = request.PotentialRevenue,
            ClosedRevenue = request.ClosedRevenue,
            ManualScoreAdjustment = request.ManualScoreAdjustment,
            OwnerUserId = request.OwnerUserId
        };

        ApplyTags(lead, request.Tags);

        if (!string.IsNullOrWhiteSpace(request.InitialNote))
        {
            lead.Notes.Add(new LeadNote
            {
                CreatedByUserId = actorUserId,
                Content = request.InitialNote.Trim()
            });
        }

        dbContext.Leads.Add(lead);
        lead.Score = await CalculateScoreAsync(lead, cancellationToken);
        await RecordActivityAsync(actorUserId, lead.Id, "lead.created", $"Lead {lead.FullName} was created.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(lead.Id, cancellationToken);
    }

    public async Task<LeadDetailResponse> UpdateAsync(Guid id, UpdateLeadRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        lead.FullName = request.FullName.Trim();
        lead.Email = NormalizeEmail(request.Email);
        lead.Phone = request.Phone.Trim();
        lead.Company = request.Company?.Trim();
        lead.CourseInterest = request.CourseInterest?.Trim();
        lead.Status = request.Status;
        lead.Source = request.Source;
        lead.PotentialRevenue = request.PotentialRevenue;
        lead.ClosedRevenue = request.ClosedRevenue;
        lead.ManualScoreAdjustment = request.ManualScoreAdjustment;
        lead.OwnerUserId = request.OwnerUserId;

        ApplyTags(lead, request.Tags);
        lead.Score = await CalculateScoreAsync(lead, cancellationToken);

        await RecordActivityAsync(actorUserId, lead.Id, "lead.updated", $"Lead {lead.FullName} was updated.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapLead(lead);
    }

    public async Task DeleteAsync(Guid id, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        dbContext.Leads.Remove(lead);
        await RecordActivityAsync(actorUserId, id, "lead.deleted", $"Lead {lead.FullName} was deleted.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<LeadDetailResponse> UpdateStatusAsync(Guid id, UpdateLeadStatusRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        lead.Status = request.Status;
        lead.Score = await CalculateScoreAsync(lead, cancellationToken);

        await RecordActivityAsync(actorUserId, id, "lead.status.updated", $"Lead {lead.FullName} moved to {request.Status}.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapLead(lead);
    }

    public async Task<LeadNoteResponse> AddNoteAsync(Guid id, AddLeadNoteRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        var note = new LeadNote
        {
            LeadId = lead.Id,
            CreatedByUserId = actorUserId,
            Content = request.Content.Trim(),
            IsPinned = request.IsPinned
        };

        lead.Notes.Add(note);
        lead.Score = await CalculateScoreAsync(lead, cancellationToken);
        await RecordActivityAsync(actorUserId, id, "lead.note.added", $"A note was added to {lead.FullName}.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new LeadNoteResponse(note.Id, note.Content, note.IsPinned, note.CreatedByUserId, note.CreatedAtUtc);
    }

    public async Task<ConversationMessageResponse> AddMessageAsync(Guid id, AddConversationMessageRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        var message = new ConversationMessage
        {
            LeadId = lead.Id,
            Channel = request.Channel.Trim().ToLowerInvariant(),
            Direction = request.Direction,
            Content = request.Content.Trim(),
            ExternalMessageId = request.ExternalMessageId?.Trim(),
            SentAtUtc = request.SentAtUtc ?? dateTimeProvider.UtcNow
        };

        lead.Messages.Add(message);
        lead.Score = await CalculateScoreAsync(lead, cancellationToken);
        await RecordActivityAsync(actorUserId, id, "lead.message.added", $"A {message.Direction} {message.Channel} message was logged for {lead.FullName}.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ConversationMessageResponse(message.Id, message.Channel, message.Direction, message.Content, message.ExternalMessageId, message.SentAtUtc);
    }

    public async Task<int> RecalculateScoreAsync(Guid id, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await LoadLeadAsync(id, cancellationToken);
        lead.Score = await CalculateScoreAsync(lead, cancellationToken);
        await RecordActivityAsync(actorUserId, id, "lead.score.recalculated", $"Lead {lead.FullName} score was recalculated to {lead.Score}.", cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return lead.Score;
    }

    private async Task<Lead> LoadLeadAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Leads
            .Include(x => x.Tags)
            .Include(x => x.Notes.OrderByDescending(note => note.CreatedAtUtc))
            .Include(x => x.Messages.OrderByDescending(message => message.SentAtUtc))
            .Include(x => x.OwnerUser)
            .Include(x => x.Enrollments)
                .ThenInclude(enrollment => enrollment.Course)
            .Include(x => x.Enrollments)
                .ThenInclude(enrollment => enrollment.ClassSession)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new NotFoundException("Lead not found.");
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
    }

    private static void ApplyTags(Lead lead, IReadOnlyCollection<string>? tagNames)
    {
        lead.Tags.Clear();

        var tags = (tagNames ?? Array.Empty<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase);

        foreach (var tag in tags)
        {
            lead.Tags.Add(new LeadTag { Name = tag });
        }
    }

    private async Task<int> CalculateScoreAsync(Lead lead, CancellationToken cancellationToken)
    {
        var rules = await dbContext.LeadScoringRules
            .AsNoTracking()
            .Where(x => x.IsEnabled)
            .ToListAsync(cancellationToken);

        var messageCount = lead.Messages.Count;
        var engagementScore = GetEngagementScore(lead);
        var normalizedTags = lead.Tags.Select(x => x.Name.ToLowerInvariant()).ToArray();

        var autoScore = 0;
        foreach (var rule in rules)
        {
            switch (rule.RuleType)
            {
                case ScoringRuleType.TagContains when !string.IsNullOrWhiteSpace(rule.ConditionValue):
                    if (normalizedTags.Any(tag => tag.Contains(rule.ConditionValue.Trim().ToLowerInvariant(), StringComparison.Ordinal)))
                    {
                        autoScore += rule.Points;
                    }
                    break;
                case ScoringRuleType.MessageCountAtLeast:
                    if (messageCount >= rule.Threshold)
                    {
                        autoScore += rule.Points;
                    }
                    break;
                case ScoringRuleType.EngagementAtLeast:
                    if (engagementScore >= rule.Threshold)
                    {
                        autoScore += rule.Points;
                    }
                    break;
            }
        }

        return autoScore + lead.ManualScoreAdjustment;
    }

    private static int GetEngagementScore(Lead lead)
    {
        var statusBonus = lead.Status switch
        {
            LeadStatus.Qualified => 8,
            LeadStatus.Converted => 12,
            _ => 0
        };

        return (lead.Messages.Count * 3) + (lead.Notes.Count * 2) + statusBonus;
    }

    private async Task RecordActivityAsync(Guid actorUserId, Guid? leadId, string type, string description, CancellationToken cancellationToken)
    {
        await dbContext.Activities.AddAsync(new ActivityLog
        {
            LeadId = leadId,
            UserId = actorUserId,
            Type = type,
            Description = description,
            HappenedAtUtc = dateTimeProvider.UtcNow
        }, cancellationToken);
    }

    private static LeadDetailResponse MapLead(Lead lead)
    {
        return new LeadDetailResponse(
            lead.Id,
            lead.FullName,
            lead.Email,
            lead.Phone,
            lead.Company,
            lead.CourseInterest,
            lead.ExternalId,
            lead.Status,
            lead.Source,
            lead.Score,
            lead.ManualScoreAdjustment,
            GetEngagementScore(lead),
            lead.PotentialRevenue,
            lead.ClosedRevenue,
            lead.OwnerUserId,
            lead.OwnerUser?.FullName,
            lead.Tags.Select(tag => tag.Name).OrderBy(x => x).ToArray(),
            lead.Notes
                .OrderByDescending(x => x.IsPinned)
                .ThenByDescending(x => x.CreatedAtUtc)
                .Select(x => new LeadNoteResponse(x.Id, x.Content, x.IsPinned, x.CreatedByUserId, x.CreatedAtUtc))
                .ToArray(),
            lead.Messages
                .OrderByDescending(x => x.SentAtUtc)
                .Select(x => new ConversationMessageResponse(x.Id, x.Channel, x.Direction, x.Content, x.ExternalMessageId, x.SentAtUtc))
                .ToArray(),
            lead.Enrollments
                .OrderByDescending(x => x.CreatedAtUtc)
                .Select(x => new EnrollmentSummaryResponse(
                    x.Id,
                    x.CourseId,
                    x.Course.Name,
                    x.ClassSessionId,
                    x.ClassSession != null ? x.ClassSession.Title : null,
                    x.Status,
                    x.AmountPaid))
                .ToArray(),
            lead.CreatedAtUtc,
            lead.UpdatedAtUtc);
    }
}
