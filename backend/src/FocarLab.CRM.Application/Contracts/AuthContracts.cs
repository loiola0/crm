using System.ComponentModel.DataAnnotations;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Application.Contracts;

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public sealed record UserSummaryResponse(
    Guid Id,
    string FullName,
    string Email,
    UserRole Role,
    bool IsActive);

public sealed record LoginResponse(
    string Token,
    DateTimeOffset ExpiresAtUtc,
    UserSummaryResponse User);
