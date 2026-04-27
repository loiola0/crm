using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Application.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<UserSummaryResponse> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class AuthService(IAppDbContext dbContext, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService, IDateTimeProvider dateTimeProvider) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email == normalizedEmail && x.IsActive, cancellationToken);

        if (user is null || !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new AppUnauthorizedException("Invalid email or password.");
        }

        var expiresAtUtc = dateTimeProvider.UtcNow.AddHours(8);

        return new LoginResponse(
            jwtTokenService.CreateToken(user),
            expiresAtUtc,
            new UserSummaryResponse(user.Id, user.FullName, user.Email, user.Role, user.IsActive));
    }

    public async Task<UserSummaryResponse> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        return new UserSummaryResponse(user.Id, user.FullName, user.Email, user.Role, user.IsActive);
    }
}
