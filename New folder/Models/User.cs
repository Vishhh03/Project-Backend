namespace FinalDestinationAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? ContactNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation Properties
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public LoyaltyAccount? LoyaltyAccount { get; set; }
}

public enum UserRole
{
    Guest = 1,
    HotelManager = 2,
    Admin = 3
}




