using System.ComponentModel.DataAnnotations;

namespace SmartHotelManagement.Models
{
    public class Review
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int HotelId { get; set; }
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        [StringLength(1000)]
        public string? Comment { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; } = null!;
        public Hotel Hotel { get; set; } = null!;
    }
}