namespace FinalDestinationAPI.Configuration;

/// <summary>
/// Loyalty program configuration settings
/// </summary>
public class LoyaltySettings
{
    public const string SectionName = "Loyalty";
    
    public double PointsPercentage { get; set; } = 0.1;
    public decimal MinimumBookingAmount { get; set; } = 50.0m;
}




