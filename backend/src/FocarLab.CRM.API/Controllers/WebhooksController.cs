using System.Text.Json;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting("webhooks")]
[Route("api/webhooks")]
public sealed class WebhooksController(IAutomationService automationService, IConfiguration configuration) : ControllerBase
{
    /// <summary>
    /// Receives n8n automation webhooks secured by the X-Webhook-Secret header.
    /// </summary>
    [HttpPost("n8n")]
    [SwaggerOperation(Summary = "Process n8n webhook")]
    [ProducesResponseType(typeof(WebhookProcessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WebhookProcessResponse>> ProcessN8n([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var signature = ValidateWebhookSecret();
        var response = await automationService.ProcessN8nWebhookAsync(payload.GetRawText(), signature, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Receives WhatsApp webhook payloads secured by the X-Webhook-Secret header.
    /// </summary>
    [HttpPost("whatsapp")]
    [SwaggerOperation(Summary = "Process WhatsApp webhook")]
    [ProducesResponseType(typeof(WebhookProcessResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WebhookProcessResponse>> ProcessWhatsApp([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var signature = ValidateWebhookSecret();
        var response = await automationService.ProcessWhatsAppWebhookAsync(payload.GetRawText(), signature, cancellationToken);
        return Ok(response);
    }

    private string ValidateWebhookSecret()
    {
        var configuredSecret = configuration["WEBHOOK_SECRET"];
        var receivedSecret = Request.Headers["X-Webhook-Secret"].ToString();

        if (string.IsNullOrWhiteSpace(configuredSecret) || !string.Equals(configuredSecret, receivedSecret, StringComparison.Ordinal))
        {
            throw new AppUnauthorizedException("Invalid webhook secret.");
        }

        return receivedSecret;
    }
}
