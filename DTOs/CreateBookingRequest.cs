using System.ComponentModel.DataAnnotations;
using FinalDestinationAPI.Validation;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for creating a new booking with comprehensive validation
/// </summary>
[DateRange(365)] // Maximum 365 days booking duration
public class CreateBookingRequest
{
    /// <summary>
    /// Guest's full name
    /// </summary>
    [Required(ErrorMessage = "Guest name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Guest name must be between 2 and 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s\-\.]+$", ErrorMessage = "Guest name can only contain letters, spaces, hyphens, and periods")]
    public string GuestName { get; set; } = string.Empty;
    
    /// <summary>
    /// Guest's email address
    /// </summary>
    [Required(ErrorMessage = "Guest email is required")]
    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string GuestEmail { get; set; } = string.Empty;
    
    /// <summary>
    /// ID of the hotel to book
    /// </summary>
    [Required(ErrorMessage = "Hotel ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Hotel ID must be a positive number")]
    public int HotelId { get; set; }
    
    /// <summary>
    /// Check-in date (cannot be in the past)
    /// </summary>
    [Required(ErrorMessage = "Check-in date is required")]
    [FutureDate]
    public DateTime CheckInDate { get; set; }
    
    /// <summary>
    /// Check-out date (must be after check-in date)
    /// </summary>
    [Required(ErrorMessage = "Check-out date is required")]
    [DateAfter("CheckInDate", ErrorMessage = "Check-out date must be after check-in date")]
    public DateTime CheckOutDate { get; set; }
    
    /// <summary>
    /// Number of guests (1-10)
    /// </summary>
    [Required(ErrorMessage = "Number of guests is required")]
    [Range(1, 10, ErrorMessage = "Number of guests must be between 1 and 10")]
    public int NumberOfGuests { get; set; } = 1;
}




