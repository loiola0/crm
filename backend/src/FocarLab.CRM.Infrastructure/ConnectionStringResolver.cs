using Npgsql;

namespace FocarLab.CRM.Infrastructure;

public static class ConnectionStringResolver
{
    public static string Resolve(string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            throw new InvalidOperationException("DATABASE_URL is not configured.");
        }

        if (rawValue.Contains("Host=", StringComparison.OrdinalIgnoreCase))
        {
            return rawValue;
        }

        if (!Uri.TryCreate(rawValue, UriKind.Absolute, out var uri))
        {
            return rawValue;
        }

        var userInfo = uri.UserInfo.Split(':', 2, StringSplitOptions.TrimEntries);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port,
            Database = uri.AbsolutePath.Trim('/'),
            Username = userInfo.ElementAtOrDefault(0),
            Password = userInfo.ElementAtOrDefault(1),
            SslMode = SslMode.Disable
        };

        return builder.ConnectionString;
    }
}
