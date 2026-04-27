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
[Route("api/enrollments")]
public sealed class EnrollmentsController(IEducationService educationService) : ControllerBase
{
    /// <summary>
    /// Returns CRM enrollments linked to leads and courses.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "List enrollments")]
    [ProducesResponseType(typeof(IReadOnlyCollection<EnrollmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<EnrollmentResponse>>> Get(CancellationToken cancellationToken)
    {
        var response = await educationService.GetEnrollmentsAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Creates an enrollment and updates revenue for converted leads.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminAndAbove)]
    [HttpPost]
    [SwaggerOperation(Summary = "Create enrollment")]
    [ProducesResponseType(typeof(EnrollmentResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<EnrollmentResponse>> Create([FromBody] CreateEnrollmentRequest request, CancellationToken cancellationToken)
    {
        var response = await educationService.CreateEnrollmentAsync(request, User.GetUserId(), cancellationToken);
        return Created(string.Empty, response);
    }
}
