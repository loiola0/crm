using FocarLab.CRM.Domain.Common;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Domain.Entities;

public sealed class Lead : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? CourseInterest { get; set; }
    public string? ExternalId { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public LeadSource Source { get; set; } = LeadSource.Manual;
    public int Score { get; set; }
    public int ManualScoreAdjustment { get; set; }
    public decimal PotentialRevenue { get; set; }
    public decimal? ClosedRevenue { get; set; }
    public Guid? OwnerUserId { get; set; }

    public AppUser? OwnerUser { get; set; }
    public ICollection<LeadTag> Tags { get; set; } = new List<LeadTag>();
    public ICollection<LeadNote> Notes { get; set; } = new List<LeadNote>();
    public ICollection<ConversationMessage> Messages { get; set; } = new List<ConversationMessage>();
    public ICollection<ActivityLog> Activities { get; set; } = new List<ActivityLog>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}

public sealed class LeadTag : BaseEntity
{
    public Guid LeadId { get; set; }
    public string Name { get; set; } = string.Empty;

    public Lead Lead { get; set; } = null!;
}

public sealed class LeadNote : BaseEntity
{
    public Guid LeadId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPinned { get; set; }

    public Lead Lead { get; set; } = null!;
}

public sealed class ConversationMessage : BaseEntity
{
    public Guid LeadId { get; set; }
    public string Channel { get; set; } = "whatsapp";
    public MessageDirection Direction { get; set; } = MessageDirection.Inbound;
    public string Content { get; set; } = string.Empty;
    public string? ExternalMessageId { get; set; }
    public DateTimeOffset SentAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public Lead Lead { get; set; } = null!;
}
