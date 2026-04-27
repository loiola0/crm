using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FocarLab.CRM.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=focarlab_crm;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(ConnectionStringResolver.Resolve(connectionString)).UseSnakeCaseNamingConvention();
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
