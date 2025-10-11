namespace FinalDestinationAPI.DTOs;

public class LoyaltyAccountResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PointsBalance { get; set; }
    public int TotalPointsEarned { get; set; }
    public DateTime LastUpdated { get; set; }
    public List<PointsTransactionResponse> RecentTransactions { get; set; } = new();
}

public class PointsTransactionResponse
{
    public int Id { get; set; }
    public int PointsEarned { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? BookingId { get; set; }
}

public class CreateLoyaltyAccountRequest
{
    public int UserId { get; set; }
}

public class AwardPointsRequest
{
    public int UserId { get; set; }
    public int BookingId { get; set; }
    public decimal BookingAmount { get; set; }
}




