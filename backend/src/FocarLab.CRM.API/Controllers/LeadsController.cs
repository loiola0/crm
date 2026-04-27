using FocarLab.CRM.API.Authorization;
using FocarLab.CRM.API.Extensions;
using FocarLab.CRM.Application.Common;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[Authorize(Roles = ApiRoles.Staff)]
[Route("api/leads")]
public sealed class LeadsController(ILeadService leadService) : ControllerBase
{
    /// <summary>
    /// Returns paginated leads filtered by search, source, and funnel status.
    /// </summary>
    [HttpGet]
    [SwaggerOperation(Summary = "List leads")]
    [ProducesResponseType(typeof(PagedResult<LeadListItemResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<LeadListItemResponse>>> Get([FromQuery] LeadQueryRequest request, CancellationToken cancellationToken)
    {
        var response = await leadService.GetAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Returns a single lead with notes, messages, and enrollments.
    /// </summary>
    [HttpGet("{id:guid}")]
    [SwaggerOperation(Summary = "Get lead detail")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeadDetailResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await leadService.GetByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Creates a new lead and calculates its initial score.
    /// </summary>
    [HttpPost]
    [SwaggerOperation(Summary = "Create lead")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<LeadDetailResponse>> Create([FromBody] CreateLeadRequest request, CancellationToken cancellationToken)
    {
        var response = await leadService.CreateAsync(request, User.GetUserId(), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    /// <summary>
    /// Updates the main lead profile, tags, ownership, and score inputs.
    /// </summary>
    [HttpPut("{id:guid}")]
    [SwaggerOperation(Summary = "Update lead")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeadDetailResponse>> Update(Guid id, [FromBody] UpdateLeadRequest request, CancellationToken cancellationToken)
    {
        var response = await leadService.UpdateAsync(id, request, User.GetUserId(), cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Deletes a lead permanently.
    /// </summary>
    [Authorize(Roles = ApiRoles.AdminOnly)]
    [HttpDelete("{id:guid}")]
    [SwaggerOperation(Summary = "Delete lead")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await leadService.DeleteAsync(id, User.GetUserId(), cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Updates only the funnel status for a lead.
    /// </summary>
    [HttpPost("{id:guid}/status")]
    [SwaggerOperation(Summary = "Move lead in funnel")]
    [ProducesResponseType(typeof(LeadDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeadDetailResponse>> UpdateStatus(Guid id, [FromBody] UpdateLeadStatusRequest request, CancellationToken cancellationToken)
    {
        var response = await leadService.UpdateStatusAsync(id, request, User.GetUserId(), cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Adds a note to a lead timeline.
    /// </summary>
    [HttpPost("{id:guid}/notes")]
    [SwaggerOperation(Summary = "Add lead note")]
    [ProducesResponseType(typeof(LeadNoteResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeadNoteResponse>> AddNote(Guid id, [FromBody] AddLeadNoteRequest request, CancellationToken cancellationToken)
    {
        var response = await leadService.AddNoteAsync(id, request, User.GetUserId(), cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Stores a CRM communication record against a lead.
    /// </summary>
    [HttpPost("{id:guid}/messages")]
    [SwaggerOperation(Summary = "Add conversation message")]
    [ProducesResponseType(typeof(ConversationMessageResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConversationMessageResponse>> AddMessage(Guid id, [FromBody] AddConversationMessageRequest request, CancellationToken cancellationToken)
    {
        var response = await leadService.AddMessageAsync(id, request, User.GetUserId(), cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Recalculates automatic lead scoring rules.
    /// </summary>
    [HttpPost("{id:guid}/score/recalculate")]
    [SwaggerOperation(Summary = "Recalculate lead score")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecalculateScore(Guid id, CancellationToken cancellationToken)
    {
        var score = await leadService.RecalculateScoreAsync(id, User.GetUserId(), cancellationToken);
        return Ok(new { score });
    }
}
