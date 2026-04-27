namespace FocarLab.CRM.Domain.Enums;

public enum UserRole
{
    Master = 1,
    Admin = 2,
    Sales = 3,
    Manager = 4
}

public enum LeadStatus
{
    New = 1,
    Contacted = 2,
    Qualified = 3,
    Converted = 4,
    Lost = 5
}

public enum LeadSource
{
    Manual = 1,
    WhatsApp = 2,
    Ads = 3,
    Organic = 4,
    Referral = 5,
    Event = 6,
    Other = 7
}

public enum EnrollmentStatus
{
    Pending = 1,
    Active = 2,
    Completed = 3,
    Cancelled = 4
}

public enum MessageDirection
{
    Inbound = 1,
    Outbound = 2
}

public enum ScoringRuleType
{
    TagContains = 1,
    MessageCountAtLeast = 2,
    EngagementAtLeast = 3
}
