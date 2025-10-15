using System.ComponentModel.DataAnnotations;

namespace FinalDestinationAPI.DTOs;

public class RefundRequest
{
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Refund amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string? Reason { get; set; }
}




