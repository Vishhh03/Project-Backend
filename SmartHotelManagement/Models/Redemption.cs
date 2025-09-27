using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHotelManagement.Models
{
    public class Redemption
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int BookingId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal PointsUsed { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountAmount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public User User { get; set; } = null!;
        public Booking Booking { get; set; } = null!;
        public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
    }
}