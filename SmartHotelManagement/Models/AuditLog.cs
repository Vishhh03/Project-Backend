
// Models/AuditLog.cs
using System;

namespace SmartHotelManagement.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty; // user email or id
        public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
        public string Details { get; set; } = string.Empty;
    }
}
