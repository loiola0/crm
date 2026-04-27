using System.ComponentModel.DataAnnotations;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Application.Contracts;

public sealed record CreateCourseRequest(
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(4000)] string Description,
    decimal Price,
    bool IsActive);

public sealed record CreateClassSessionRequest(
    [Required, MaxLength(120)] string Title,
    string? Instructor,
    int Capacity,
    DateTimeOffset StartDateUtc,
    DateTimeOffset EndDateUtc);

public sealed record CreateEnrollmentRequest(
    [Required] Guid LeadId,
    [Required] Guid CourseId,
    Guid? ClassSessionId,
    EnrollmentStatus Status,
    decimal AmountPaid,
    DateTimeOffset? EnrolledAtUtc);

public sealed record ClassSessionResponse(Guid Id, string Title, string? Instructor, int Capacity, DateTimeOffset StartDateUtc, DateTimeOffset EndDateUtc);
public sealed record CourseResponse(Guid Id, string Name, string Description, decimal Price, bool IsActive, int EnrollmentCount, IReadOnlyCollection<ClassSessionResponse> Classes);
public sealed record EnrollmentResponse(Guid Id, Guid LeadId, string LeadName, Guid CourseId, string CourseName, Guid? ClassSessionId, string? ClassTitle, EnrollmentStatus Status, decimal AmountPaid, DateTimeOffset? EnrolledAtUtc);
