using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.DTOs;

public class PaymentResult
{
    public int PaymentId { get; set; }
    public PaymentStatus Status { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? ErrorMessage { get; set; }
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}




