using System.ComponentModel.DataAnnotations;

namespace SmartHotelManagement.Models
{
    public class Hotel
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(500)]
        public string Location { get; set; } = string.Empty;
        
        public int? ManagerId { get; set; }
        
        [StringLength(1000)]
        public string? Amenities { get; set; }
        
        [Range(1, 5)]
        public decimal Rating { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public User? Manager { get; set; }
        public ICollection<Room>? Rooms { get; set; }
        public ICollection<Review>? Reviews { get; set; }
    }
}