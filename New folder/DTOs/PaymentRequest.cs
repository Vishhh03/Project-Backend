using System.ComponentModel.DataAnnotations;
using FinalDestinationAPI.Models;
using FinalDestinationAPI.Validation;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for processing payments with comprehensive validation
/// </summary>
[ExpiryDate] // Validates that the card hasn't expired
public class PaymentRequest
{
    /// <summary>
    /// ID of the booking to pay for
    /// </summary>
    [Required(ErrorMessage = "Booking ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Booking ID must be a positive number")]
    public int BookingId { get; set; }
    
    /// <summary>
    /// Payment amount (must be positive)
    /// </summary>
    [Required(ErrorMessage = "Payment amount is required")]
    [Range(0.01, 999999.99, ErrorMessage = "Amount must be between $0.01 and $999,999.99")]
    [DataType(DataType.Currency)]
    public decimal Amount { get; set; }
    
    /// <summary>
    /// Currency code (3-letter ISO code)
    /// </summary>
    [Required(ErrorMessage = "Currency is required")]
    [CurrencyCode]
    public string Currency { get; set; } = "USD";
    
    /// <summary>
    /// Payment method
    /// </summary>
    [Required(ErrorMessage = "Payment method is required")]
    public PaymentMethod PaymentMethod { get; set; }
    
    /// <summary>
    /// Credit card number (required for card payments)
    /// </summary>
    [Validation.CreditCard]
    public string? CardNumber { get; set; }
    
    /// <summary>
    /// Card holder's name (required for card payments)
    /// </summary>
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Card holder name must be between 2 and 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-\.]+$", ErrorMessage = "Card holder name can only contain letters, spaces, hyphens, and periods")]
    public string? CardHolderName { get; set; }
    
    /// <summary>
    /// Card expiry month (01-12)
    /// </summary>
    [RegularExpression(@"^(0[1-9]|1[0-2])$", ErrorMessage = "Expiry month must be between 01 and 12")]
    public string? ExpiryMonth { get; set; }
    
    /// <summary>
    /// Card expiry year (2-digit format)
    /// </summary>
    [RegularExpression(@"^\d{2}$", ErrorMessage = "Expiry year must be a 2-digit year")]
    public string? ExpiryYear { get; set; }
    
    /// <summary>
    /// Card verification value (3-4 digits)
    /// </summary>
    [RegularExpression(@"^\d{3,4}$", ErrorMessage = "CVV must be 3 or 4 digits")]
    public string? CVV { get; set; }
}




