using FocarLab.CRM.Domain.Common;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Domain.Entities;

public sealed class Course : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ClassSession> Classes { get; set; } = new List<ClassSession>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}

public sealed class ClassSession : BaseEntity
{
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Instructor { get; set; }
    public int Capacity { get; set; }
    public DateTimeOffset StartDateUtc { get; set; }
    public DateTimeOffset EndDateUtc { get; set; }

    public Course Course { get; set; } = null!;
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}

public sealed class Enrollment : BaseEntity
{
    public Guid LeadId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassSessionId { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
    public decimal AmountPaid { get; set; }
    public DateTimeOffset? EnrolledAtUtc { get; set; }

    public Lead Lead { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public ClassSession? ClassSession { get; set; }
}
