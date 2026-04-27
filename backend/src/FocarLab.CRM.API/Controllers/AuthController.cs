using FocarLab.CRM.API.Extensions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace FocarLab.CRM.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// Authenticates a CRM user and returns a JWT token.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("login")]
    [SwaggerOperation(Summary = "Authenticate and issue JWT")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Returns the authenticated user profile.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [SwaggerOperation(Summary = "Get current user profile")]
    [ProducesResponseType(typeof(UserSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserSummaryResponse>> Me(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var response = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return Ok(response);
    }
}
