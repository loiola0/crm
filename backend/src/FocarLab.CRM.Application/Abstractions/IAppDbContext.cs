using FocarLab.CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<ActivityLog> Activities { get; }
    DbSet<AiInteractionLog> AiInteractionLogs { get; }
    DbSet<AppUser> Users { get; }
    DbSet<ClassSession> ClassSessions { get; }
    DbSet<ConversationMessage> ConversationMessages { get; }
    DbSet<Course> Courses { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<Lead> Leads { get; }
    DbSet<LeadNote> LeadNotes { get; }
    DbSet<LeadScoringRule> LeadScoringRules { get; }
    DbSet<LeadTag> LeadTags { get; }
    DbSet<PromptTemplate> PromptTemplates { get; }
    DbSet<WebhookLog> WebhookLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
