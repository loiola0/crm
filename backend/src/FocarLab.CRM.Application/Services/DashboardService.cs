using FocarLab.CRM.Application.Abstractions;
using FocarLab.CRM.Application.Contracts;
using FocarLab.CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FocarLab.CRM.Application.Services;

public interface IDashboardService
{
    Task<DashboardOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default);
}

public sealed class DashboardService(IAppDbContext dbContext, IDateTimeProvider dateTimeProvider) : IDashboardService
{
    public async Task<DashboardOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var now = dateTimeProvider.UtcNow;
        var todayStart = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var weekStart = todayStart.AddDays(-(int)todayStart.DayOfWeek);
        var monthStart = new DateTimeOffset(todayStart.Year, todayStart.Month, 1, 0, 0, 0, TimeSpan.Zero);

        var leadsQuery = dbContext.Leads.AsNoTracking();
        var createdToday = await leadsQuery.CountAsync(x => x.CreatedAtUtc >= todayStart, cancellationToken);
        var createdThisWeek = await leadsQuery.CountAsync(x => x.CreatedAtUtc >= weekStart, cancellationToken);
        var createdThisMonth = await leadsQuery.CountAsync(x => x.CreatedAtUtc >= monthStart, cancellationToken);
        var totalOpenLeads = await leadsQuery.CountAsync(x => x.Status != LeadStatus.Converted && x.Status != LeadStatus.Lost, cancellationToken);

        var totalLeads = await leadsQuery.CountAsync(cancellationToken);
        var convertedLeads = await leadsQuery.CountAsync(x => x.Status == LeadStatus.Converted, cancellationToken);
        var conversionRate = totalLeads == 0 ? 0 : Math.Round((decimal)convertedLeads / totalLeads * 100, 2);

        var revenueThisMonth = await leadsQuery
            .Where(x => x.Status == LeadStatus.Converted && x.UpdatedAtUtc >= monthStart)
            .SumAsync(x => x.ClosedRevenue ?? 0, cancellationToken);

        var revenueTotal = await leadsQuery
            .Where(x => x.Status == LeadStatus.Converted)
            .SumAsync(x => x.ClosedRevenue ?? 0, cancellationToken);

        var funnel = await leadsQuery
            .GroupBy(x => x.Status)
            .Select(group => new FunnelStageResponse(group.Key, group.Count()))
            .ToListAsync(cancellationToken);

        var recentActivities = await dbContext.Activities
            .AsNoTracking()
            .OrderByDescending(x => x.HappenedAtUtc)
            .Take(10)
            .Select(x => new TimelineEventResponse(x.Id, x.Type, x.Description, x.HappenedAtUtc))
            .ToListAsync(cancellationToken);

        var leadTrend = await BuildLeadTrendAsync(todayStart, cancellationToken);
        var revenueTrend = await BuildRevenueTrendAsync(monthStart, cancellationToken);
        var sourceBreakdown = await leadsQuery
            .GroupBy(x => x.Source)
            .Select(group => new SourcePointResponse(group.Key.ToString(), group.Count()))
            .ToListAsync(cancellationToken);

        return new DashboardOverviewResponse(
            new DashboardMetricResponse(createdToday, createdThisWeek, createdThisMonth, totalOpenLeads),
            conversionRate,
            revenueThisMonth,
            revenueTotal,
            funnel,
            recentActivities,
            leadTrend,
            revenueTrend,
            sourceBreakdown);
    }

    private async Task<IReadOnlyCollection<TrendPointResponse>> BuildLeadTrendAsync(DateTimeOffset todayStart, CancellationToken cancellationToken)
    {
        var dates = Enumerable.Range(0, 14)
            .Select(offset => todayStart.AddDays(-13 + offset))
            .ToArray();

        var results = new List<TrendPointResponse>(dates.Length);

        foreach (var date in dates)
        {
            var next = date.AddDays(1);
            var count = await dbContext.Leads.AsNoTracking().CountAsync(x => x.CreatedAtUtc >= date && x.CreatedAtUtc < next, cancellationToken);
            results.Add(new TrendPointResponse(date.ToString("dd MMM"), count));
        }

        return results;
    }

    private async Task<IReadOnlyCollection<RevenuePointResponse>> BuildRevenueTrendAsync(DateTimeOffset monthStart, CancellationToken cancellationToken)
    {
        var months = Enumerable.Range(0, 6)
            .Select(offset => monthStart.AddMonths(-5 + offset))
            .ToArray();

        var results = new List<RevenuePointResponse>(months.Length);

        foreach (var month in months)
        {
            var next = month.AddMonths(1);
            var value = await dbContext.Leads.AsNoTracking()
                .Where(x => x.Status == LeadStatus.Converted && x.UpdatedAtUtc >= month && x.UpdatedAtUtc < next)
                .SumAsync(x => x.ClosedRevenue ?? 0, cancellationToken);

            results.Add(new RevenuePointResponse(month.ToString("MMM yy"), value));
        }

        return results;
    }
}
