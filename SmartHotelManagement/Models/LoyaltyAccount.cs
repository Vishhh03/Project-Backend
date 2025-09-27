using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHotelManagement.Models
{
    public class LoyaltyAccount
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal PointsBalance { get; set; } = 0;
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public User User { get; set; } = null!;
        public ICollection<Redemption>? Redemptions { get; set; }
    }
}