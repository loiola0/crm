using FocarLab.CRM.API.Authorization;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[Authorize(Roles = ApiRoles.Staff)]
[Route("api/settings")]
public sealed class SettingsController(ISettingsService settingsService, IConfiguration configuration) : ControllerBase
{
    /// <summary>
    /// Returns scoring rules, prompt templates, and recent automation logs.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "Get CRM settings overview")]
    [ProducesResponseType(typeof(SettingsOverviewResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettingsOverviewResponse>> Get(CancellationToken cancellationToken)
    {
        var response = await settingsService.GetOverviewAsync(
            !string.IsNullOrWhiteSpace(configuration["OPENAI_API_KEY"]),
            !string.IsNullOrWhiteSpace(configuration["WEBHOOK_SECRET"]),
            cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Replaces the current lead scoring rule set.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminOnly)]
    [HttpPut("scoring-rules")]
    [SwaggerOperation(Summary = "Save lead scoring rules")]
    [ProducesResponseType(typeof(IReadOnlyCollection<LeadScoringRuleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<LeadScoringRuleResponse>>> SaveScoringRules([FromBody] IReadOnlyCollection<LeadScoringRuleRequest> request, CancellationToken cancellationToken)
    {
        var response = await settingsService.SaveScoringRulesAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Creates a new AI prompt template.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminOnly)]
    [HttpPost("prompt-templates")]
    [SwaggerOperation(Summary = "Create AI prompt template")]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<PromptTemplateResponse>> CreatePromptTemplate([FromBody] PromptTemplateRequest request, CancellationToken cancellationToken)
    {
        var response = await settingsService.CreatePromptTemplateAsync(request, cancellationToken);
        return Created(string.Empty, response);
    }

    /// <summary>
    /// Updates an existing AI prompt template.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminOnly)]
    [HttpPut("prompt-templates/{id:guid}")]
    [SwaggerOperation(Summary = "Update AI prompt template")]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PromptTemplateResponse>> UpdatePromptTemplate(Guid id, [FromBody] PromptTemplateRequest request, CancellationToken cancellationToken)
    {
        var response = await settingsService.UpdatePromptTemplateAsync(id, request, cancellationToken);
        return Ok(response);
    }
}
