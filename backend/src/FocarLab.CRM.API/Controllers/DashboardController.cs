using FocarLab.CRM.API.Authorization;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[Authorize(Roles = ApiRoles.Staff)]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    /// <summary>
    /// Returns high-level CRM KPIs, funnel data, revenue, and recent activity.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "Get CRM dashboard overview")]
    [ProducesResponseType(typeof(DashboardOverviewResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardOverviewResponse>> Get(CancellationToken cancellationToken)
    {
        var response = await dashboardService.GetOverviewAsync(cancellationToken);
        return Ok(response);
    }
}
