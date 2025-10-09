using System;
using System.ComponentModel.DataAnnotations;

namespace SmartHotelManagement.Models
{
    public class LoyaltyAccount
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Range(0, long.MaxValue)]
        public long PointsBalance { get; set; } = 0;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Navigation
        public User? User { get; set; }
    }
}
