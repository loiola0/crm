using System.ComponentModel.DataAnnotations;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Application.Contracts;

public sealed record LeadQueryRequest(
    string? Search,
    LeadStatus? Status,
    LeadSource? Source,
    int Page = 1,
    int PageSize = 20);

public sealed record CreateLeadRequest(
    [Required, MaxLength(120)] string FullName,
    [EmailAddress] string? Email,
    [Required, MaxLength(30)] string Phone,
    string? Company,
    string? CourseInterest,
    LeadSource Source,
    decimal PotentialRevenue,
    decimal? ClosedRevenue,
    int ManualScoreAdjustment,
    Guid? OwnerUserId,
    IReadOnlyCollection<string>? Tags,
    string? InitialNote);

public sealed record UpdateLeadRequest(
    [Required, MaxLength(120)] string FullName,
    [EmailAddress] string? Email,
    [Required, MaxLength(30)] string Phone,
    string? Company,
    string? CourseInterest,
    LeadStatus Status,
    LeadSource Source,
    decimal PotentialRevenue,
    decimal? ClosedRevenue,
    int ManualScoreAdjustment,
    Guid? OwnerUserId,
    IReadOnlyCollection<string>? Tags);

public sealed record UpdateLeadStatusRequest([Required] LeadStatus Status);

public sealed record AddLeadNoteRequest(
    [Required, MinLength(2), MaxLength(2000)] string Content,
    bool IsPinned);

public sealed record AddConversationMessageRequest(
    [Required, MaxLength(50)] string Channel,
    [Required] MessageDirection Direction,
    [Required, MinLength(1), MaxLength(4000)] string Content,
    string? ExternalMessageId,
    DateTimeOffset? SentAtUtc);

public sealed record LeadNoteResponse(Guid Id, string Content, bool IsPinned, Guid CreatedByUserId, DateTimeOffset CreatedAtUtc);
public sealed record ConversationMessageResponse(Guid Id, string Channel, MessageDirection Direction, string Content, string? ExternalMessageId, DateTimeOffset SentAtUtc);
public sealed record EnrollmentSummaryResponse(Guid Id, Guid CourseId, string CourseName, Guid? ClassSessionId, string? ClassTitle, EnrollmentStatus Status, decimal AmountPaid);

public sealed record LeadListItemResponse(
    Guid Id,
    string FullName,
    string? Email,
    string Phone,
    string? Company,
    string? CourseInterest,
    LeadStatus Status,
    LeadSource Source,
    int Score,
    decimal PotentialRevenue,
    decimal? ClosedRevenue,
    string? OwnerName,
    IReadOnlyCollection<string> Tags,
    DateTimeOffset UpdatedAtUtc);

public sealed record LeadDetailResponse(
    Guid Id,
    string FullName,
    string? Email,
    string Phone,
    string? Company,
    string? CourseInterest,
    string? ExternalId,
    LeadStatus Status,
    LeadSource Source,
    int Score,
    int ManualScoreAdjustment,
    int EngagementScore,
    decimal PotentialRevenue,
    decimal? ClosedRevenue,
    Guid? OwnerUserId,
    string? OwnerName,
    IReadOnlyCollection<string> Tags,
    IReadOnlyCollection<LeadNoteResponse> Notes,
    IReadOnlyCollection<ConversationMessageResponse> Messages,
    IReadOnlyCollection<EnrollmentSummaryResponse> Enrollments,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
