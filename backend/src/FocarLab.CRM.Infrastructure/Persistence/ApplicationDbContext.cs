using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Domain.Common;
using FocarLab.CRM.Domain.Entities;
using FocarLab.CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<ActivityLog> Activities => Set<ActivityLog>();
    public DbSet<AiInteractionLog> AiInteractionLogs => Set<AiInteractionLog>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<ClassSession> ClassSessions => Set<ClassSession>();
    public DbSet<ConversationMessage> ConversationMessages => Set<ConversationMessage>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadNote> LeadNotes => Set<LeadNote>();
    public DbSet<LeadScoringRule> LeadScoringRules => Set<LeadScoringRule>();
    public DbSet<LeadTag> LeadTags => Set<LeadTag>();
    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();
    public DbSet<WebhookLog> WebhookLogs => Set<WebhookLog>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>()
            .Where(entry => entry.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            entry.Entity.UpdatedAtUtc = DateTimeOffset.UtcNow;

            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = DateTimeOffset.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(160).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Role).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<Lead>(entity =>
        {
            entity.ToTable("leads");
            entity.HasIndex(x => x.Phone);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.Source);
            entity.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(160);
            entity.Property(x => x.Phone).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Company).HasMaxLength(160);
            entity.Property(x => x.CourseInterest).HasMaxLength(160);
            entity.Property(x => x.ExternalId).HasMaxLength(120);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.Source).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.PotentialRevenue).HasPrecision(18, 2);
            entity.Property(x => x.ClosedRevenue).HasPrecision(18, 2);
            entity.HasOne(x => x.OwnerUser)
                .WithMany(x => x.OwnedLeads)
                .HasForeignKey(x => x.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LeadTag>(entity =>
        {
            entity.ToTable("lead_tags");
            entity.HasIndex(x => new { x.LeadId, x.Name }).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(80).IsRequired();
            entity.HasOne(x => x.Lead)
                .WithMany(x => x.Tags)
                .HasForeignKey(x => x.LeadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LeadNote>(entity =>
        {
            entity.ToTable("lead_notes");
            entity.Property(x => x.Content).HasMaxLength(2000).IsRequired();
            entity.HasOne(x => x.Lead)
                .WithMany(x => x.Notes)
                .HasForeignKey(x => x.LeadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ConversationMessage>(entity =>
        {
            entity.ToTable("conversation_messages");
            entity.Property(x => x.Channel).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Direction).HasConversion<string>().HasMaxLength(20);
            entity.Property(x => x.Content).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.ExternalMessageId).HasMaxLength(120);
            entity.HasOne(x => x.Lead)
                .WithMany(x => x.Messages)
                .HasForeignKey(x => x.LeadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("activity_logs");
            entity.HasIndex(x => x.HappenedAtUtc);
            entity.HasIndex(x => x.LeadId);
            entity.Property(x => x.Type).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.HasOne(x => x.Lead)
                .WithMany(x => x.Activities)
                .HasForeignKey(x => x.LeadId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.User)
                .WithMany(x => x.Activities)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.ToTable("courses");
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Price).HasPrecision(18, 2);
        });

        modelBuilder.Entity<ClassSession>(entity =>
        {
            entity.ToTable("class_sessions");
            entity.Property(x => x.Title).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Instructor).HasMaxLength(120);
            entity.HasOne(x => x.Course)
                .WithMany(x => x.Classes)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.ToTable("enrollments");
            entity.HasIndex(x => new { x.LeadId, x.CourseId, x.ClassSessionId });
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.AmountPaid).HasPrecision(18, 2);
            entity.HasOne(x => x.Lead)
                .WithMany(x => x.Enrollments)
                .HasForeignKey(x => x.LeadId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Course)
                .WithMany(x => x.Enrollments)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ClassSession)
                .WithMany(x => x.Enrollments)
                .HasForeignKey(x => x.ClassSessionId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LeadScoringRule>(entity =>
        {
            entity.ToTable("lead_scoring_rules");
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.RuleType).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.ConditionValue).HasMaxLength(120);
        });

        modelBuilder.Entity<PromptTemplate>(entity =>
        {
            entity.ToTable("prompt_templates");
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.SystemPrompt).HasMaxLength(8000).IsRequired();
            entity.Property(x => x.UserPromptTemplate).HasMaxLength(8000).IsRequired();
        });

        modelBuilder.Entity<WebhookLog>(entity =>
        {
            entity.ToTable("webhook_logs");
            entity.Property(x => x.Provider).HasMaxLength(50).IsRequired();
            entity.Property(x => x.EventType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Signature).HasMaxLength(200);
        });

        modelBuilder.Entity<AiInteractionLog>(entity =>
        {
            entity.ToTable("ai_interaction_logs");
            entity.Property(x => x.PromptTemplateName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Model).HasMaxLength(120);
            entity.Property(x => x.ErrorMessage).HasMaxLength(500);
        });
    }
}
