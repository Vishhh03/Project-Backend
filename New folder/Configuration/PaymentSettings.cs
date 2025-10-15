namespace FinalDestinationAPI.Configuration;

/// <summary>
/// Payment service configuration settings
/// </summary>
public class PaymentSettings
{
    public const string SectionName = "Payment";
    
    public double MockSuccessRate { get; set; } = 0.9;
    public int ProcessingDelayMs { get; set; } = 1000;
}




