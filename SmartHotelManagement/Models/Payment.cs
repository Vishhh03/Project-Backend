using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHotelManagement.Models
{
    public class Payment
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int BookingId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }
        
        [Required]
        public PaymentStatus Status { get; set; }
        
        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = string.Empty;
        
        [StringLength(255)]
        public string? TransactionId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; } = null!;
        public Booking Booking { get; set; } = null!;
    }
    
    public enum PaymentStatus
    {
        Pending = 1,
        Completed = 2,
        Failed = 3,
        Refunded = 4
    }
}