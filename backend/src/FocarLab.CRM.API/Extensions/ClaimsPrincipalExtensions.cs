using System.Security.Claims;
using FocarLab.CRM.Application.Exceptions;

namespace FocarLab.CRM.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var subject = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub")
            ?? user.FindFirstValue(ClaimTypes.Name);

        if (!Guid.TryParse(subject, out var userId))
        {
            throw new AppUnauthorizedException("Authenticated user id could not be resolved.");
        }

        return userId;
    }
}
