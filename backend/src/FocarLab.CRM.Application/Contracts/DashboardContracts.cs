using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Application.Contracts;

public sealed record DashboardMetricResponse(int Today, int ThisWeek, int ThisMonth, int TotalOpenLeads);
public sealed record FunnelStageResponse(LeadStatus Status, int Count);
public sealed record TimelineEventResponse(Guid Id, string Type, string Description, DateTimeOffset HappenedAtUtc);
public sealed record TrendPointResponse(string Label, int Count);
public sealed record RevenuePointResponse(string Label, decimal Value);
public sealed record SourcePointResponse(string Source, int Count);

public sealed record DashboardOverviewResponse(
    DashboardMetricResponse Metrics,
    decimal ConversionRate,
    decimal RevenueThisMonth,
    decimal RevenueTotal,
    IReadOnlyCollection<FunnelStageResponse> Funnel,
    IReadOnlyCollection<TimelineEventResponse> ActivityTimeline,
    IReadOnlyCollection<TrendPointResponse> LeadTrend,
    IReadOnlyCollection<RevenuePointResponse> RevenueTrend,
    IReadOnlyCollection<SourcePointResponse> SourceBreakdown);
