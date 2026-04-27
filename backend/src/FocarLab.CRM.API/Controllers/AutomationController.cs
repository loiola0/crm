using FocarLab.CRM.API.Authorization;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[Authorize(Roles = ApiRoles.Staff)]
[Route("api/automation")]
public sealed class AutomationController(IAutomationService automationService) : ControllerBase
{
    /// <summary>
    /// Generates an AI-assisted sales reply preview for a lead conversation.
    /// </summary>
    [HttpPost("ai/preview")]
    [SwaggerOperation(Summary = "Generate AI sales reply preview")]
    [ProducesResponseType(typeof(AiPreviewResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AiPreviewResponse>> Preview([FromBody] AiPreviewRequest request, CancellationToken cancellationToken)
    {
        var response = await automationService.GenerateAiPreviewAsync(request, cancellationToken);
        return Ok(response);
    }
}
