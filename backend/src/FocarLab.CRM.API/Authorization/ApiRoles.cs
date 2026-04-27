namespace FocarLab.CRM.API.Authorization;

public static class ApiRoles
{
    public const string Staff = "Master,Admin,Sales,Manager";
    public const string AdminAndAbove = "Master,Admin,Manager";
    public const string AdminOnly = "Master,Admin";
}
