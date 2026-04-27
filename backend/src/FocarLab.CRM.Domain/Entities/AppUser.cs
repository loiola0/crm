using FocarLab.CRM.Domain.Common;
using FocarLab.CRM.Domain.Enums;

namespace FocarLab.CRM.Domain.Entities;

public sealed class AppUser : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Sales;
    public bool IsActive { get; set; } = true;

    public ICollection<Lead> OwnedLeads { get; set; } = new List<Lead>();
    public ICollection<ActivityLog> Activities { get; set; } = new List<ActivityLog>();
}
