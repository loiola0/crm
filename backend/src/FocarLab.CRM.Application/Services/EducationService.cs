using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using FocarLab.CRM.Domain.Entities;
using FocarLab.CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Services;

public interface IEducationService
{
    Task<IReadOnlyCollection<CourseResponse>> GetCoursesAsync(CancellationToken cancellationToken = default);
    Task<CourseResponse> CreateCourseAsync(CreateCourseRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<ClassSessionResponse> CreateClassSessionAsync(Guid courseId, CreateClassSessionRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<EnrollmentResponse>> GetEnrollmentsAsync(CancellationToken cancellationToken = default);
    Task<EnrollmentResponse> CreateEnrollmentAsync(CreateEnrollmentRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
}

public sealed class EducationService(IAppDbContext dbContext, IDateTimeProvider dateTimeProvider) : IEducationService
{
    public async Task<IReadOnlyCollection<CourseResponse>> GetCoursesAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Courses
            .AsNoTracking()
            .Include(x => x.Classes.OrderBy(classItem => classItem.StartDateUtc))
            .Include(x => x.Enrollments)
            .OrderBy(x => x.Name)
            .Select(x => new CourseResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Price,
                x.IsActive,
                x.Enrollments.Count,
                x.Classes.Select(classItem => new ClassSessionResponse(
                    classItem.Id,
                    classItem.Title,
                    classItem.Instructor,
                    classItem.Capacity,
                    classItem.StartDateUtc,
                    classItem.EndDateUtc)).ToArray()))
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseResponse> CreateCourseAsync(CreateCourseRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var course = new Course
        {
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Price = request.Price,
            IsActive = request.IsActive
        };

        dbContext.Courses.Add(course);
        await dbContext.Activities.AddAsync(new ActivityLog
        {
            UserId = actorUserId,
            Type = "course.created",
            Description = $"Course {course.Name} was created.",
            HappenedAtUtc = dateTimeProvider.UtcNow
        }, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new CourseResponse(course.Id, course.Name, course.Description, course.Price, course.IsActive, 0, Array.Empty<ClassSessionResponse>());
    }

    public async Task<ClassSessionResponse> CreateClassSessionAsync(Guid courseId, CreateClassSessionRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        if (request.EndDateUtc <= request.StartDateUtc)
        {
            throw new AppValidationException("Class end date must be greater than start date.");
        }

        var course = await dbContext.Courses.FirstOrDefaultAsync(x => x.Id == courseId, cancellationToken)
            ?? throw new NotFoundException("Course not found.");

        var classSession = new ClassSession
        {
            CourseId = courseId,
            Title = request.Title.Trim(),
            Instructor = request.Instructor?.Trim(),
            Capacity = request.Capacity,
            StartDateUtc = request.StartDateUtc,
            EndDateUtc = request.EndDateUtc
        };

        dbContext.ClassSessions.Add(classSession);
        await dbContext.Activities.AddAsync(new ActivityLog
        {
            UserId = actorUserId,
            Type = "class.created",
            Description = $"Class {classSession.Title} was created for {course.Name}.",
            HappenedAtUtc = dateTimeProvider.UtcNow
        }, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ClassSessionResponse(classSession.Id, classSession.Title, classSession.Instructor, classSession.Capacity, classSession.StartDateUtc, classSession.EndDateUtc);
    }

    public async Task<IReadOnlyCollection<EnrollmentResponse>> GetEnrollmentsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Enrollments
            .AsNoTracking()
            .Include(x => x.Lead)
            .Include(x => x.Course)
            .Include(x => x.ClassSession)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new EnrollmentResponse(
                x.Id,
                x.LeadId,
                x.Lead.FullName,
                x.CourseId,
                x.Course.Name,
                x.ClassSessionId,
                x.ClassSession != null ? x.ClassSession.Title : null,
                x.Status,
                x.AmountPaid,
                x.EnrolledAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<EnrollmentResponse> CreateEnrollmentAsync(CreateEnrollmentRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(x => x.Id == request.LeadId, cancellationToken)
            ?? throw new NotFoundException("Lead not found.");

        var course = await dbContext.Courses.FirstOrDefaultAsync(x => x.Id == request.CourseId, cancellationToken)
            ?? throw new NotFoundException("Course not found.");

        if (request.ClassSessionId.HasValue)
        {
            var classExists = await dbContext.ClassSessions.AnyAsync(x => x.Id == request.ClassSessionId.Value && x.CourseId == request.CourseId, cancellationToken);
            if (!classExists)
            {
                throw new AppValidationException("Class session does not belong to the selected course.");
            }
        }

        var enrollment = new Enrollment
        {
            LeadId = request.LeadId,
            CourseId = request.CourseId,
            ClassSessionId = request.ClassSessionId,
            Status = request.Status,
            AmountPaid = request.AmountPaid,
            EnrolledAtUtc = request.EnrolledAtUtc ?? dateTimeProvider.UtcNow
        };

        dbContext.Enrollments.Add(enrollment);

        if (request.Status is EnrollmentStatus.Active or EnrollmentStatus.Completed)
        {
            lead.Status = LeadStatus.Converted;
            lead.ClosedRevenue = request.AmountPaid;
        }

        await dbContext.Activities.AddAsync(new ActivityLog
        {
            LeadId = lead.Id,
            UserId = actorUserId,
            Type = "enrollment.created",
            Description = $"{lead.FullName} was enrolled in {course.Name}.",
            HappenedAtUtc = dateTimeProvider.UtcNow
        }, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        var classTitle = request.ClassSessionId.HasValue
            ? await dbContext.ClassSessions.Where(x => x.Id == request.ClassSessionId).Select(x => x.Title).FirstAsync(cancellationToken)
            : null;

        return new EnrollmentResponse(enrollment.Id, lead.Id, lead.FullName, course.Id, course.Name, enrollment.ClassSessionId, classTitle, enrollment.Status, enrollment.AmountPaid, enrollment.EnrolledAtUtc);
    }
}
