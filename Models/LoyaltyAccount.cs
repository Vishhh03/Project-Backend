namespace FinalDestinationAPI.Models;

public class LoyaltyAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PointsBalance { get; set; }
    public int TotalPointsEarned { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public User User { get; set; } = null!;
    public ICollection<PointsTransaction> Transactions { get; set; } = new List<PointsTransaction>();
}

public class PointsTransaction
{
    public int Id { get; set; }
    public int LoyaltyAccountId { get; set; }
    public int? BookingId { get; set; }
    public int PointsEarned { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation Properties
    public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
    public Booking? Booking { get; set; }
}




