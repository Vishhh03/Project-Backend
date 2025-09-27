using System.ComponentModel.DataAnnotations;

namespace SmartHotelManagement.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public UserRole Role { get; set; }
        
        [Phone]
        [StringLength(20)]
        public string? ContactNumber { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public ICollection<Booking>? Bookings { get; set; }
        public ICollection<Review>? Reviews { get; set; }
        public LoyaltyAccount? LoyaltyAccount { get; set; }
    }
    
    public enum UserRole
    {
        Guest = 1,
        HotelManager = 2,
        Admin = 3
    }
}