using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHotelManagement.Models
{
    public class Booking
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int RoomId { get; set; }
        
        [Required]
        public DateTime CheckInDate { get; set; }
        
        [Required]
        public DateTime CheckOutDate { get; set; }
        
        [Required]
        public BookingStatus Status { get; set; }
        
        public int? PaymentId { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; } = null!;
        public Room Room { get; set; } = null!;
        public Payment? Payment { get; set; }
        public ICollection<Redemption>? Redemptions { get; set; }
    }
    
    public enum BookingStatus
    {
        Pending = 1,
        Confirmed = 2,
        CheckedIn = 3,
        CheckedOut = 4,
        Cancelled = 5
    }
}