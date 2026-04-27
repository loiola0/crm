using FocarLab.CRM.API.Authorization;
using FocarLab.CRM.API.Extensions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[Authorize(Roles = ApiRoles.Staff)]
[Route("api/courses")]
public sealed class CoursesController(IEducationService educationService) : ControllerBase
{
    /// <summary>
    /// Returns courses and their scheduled classes.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "List courses")]
    [ProducesResponseType(typeof(IReadOnlyCollection<CourseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<CourseResponse>>> Get(CancellationToken cancellationToken)
    {
        var response = await educationService.GetCoursesAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Creates a new course.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminAndAbove)]
    [HttpPost]
    [SwaggerOperation(Summary = "Create course")]
    [ProducesResponseType(typeof(CourseResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<CourseResponse>> Create([FromBody] CreateCourseRequest request, CancellationToken cancellationToken)
    {
        var response = await educationService.CreateCourseAsync(request, User.GetUserId(), cancellationToken);
        return Created($"/api/courses/{response.Id}", response);
    }

    /// <summary>
    /// Adds a class session to an existing course.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminAndAbove)]
    [HttpPost("{courseId:guid}/classes")]
    [SwaggerOperation(Summary = "Create class session")]
    [ProducesResponseType(typeof(ClassSessionResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ClassSessionResponse>> CreateClassSession(Guid courseId, [FromBody] CreateClassSessionRequest request, CancellationToken cancellationToken)
    {
        var response = await educationService.CreateClassSessionAsync(courseId, request, User.GetUserId(), cancellationToken);
        return Created(string.Empty, response);
    }
}
