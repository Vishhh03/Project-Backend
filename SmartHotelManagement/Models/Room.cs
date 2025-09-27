using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartHotelManagement.Models
{
    public class Room
    {
        public int Id { get; set; }
        
        [Required]
        public int HotelId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Type { get; set; } = string.Empty;
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }
        
        [Required]
        public bool IsAvailable { get; set; } = true;
        
        [StringLength(500)]
        public string? Features { get; set; }
        
        [StringLength(100)]
        public string? RoomNumber { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public Hotel Hotel { get; set; } = null!;
        public ICollection<Booking>? Bookings { get; set; }
    }
}