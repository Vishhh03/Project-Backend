using System.ComponentModel.DataAnnotations;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for hotel manager application
/// </summary>
public class HotelManagerApplicationRequest
{
    /// <summary>
    /// Business or hotel name
    /// </summary>
    [Required(ErrorMessage = "Business name is required")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Business name must be between 2 and 200 characters")]
    public string BusinessName { get; set; } = string.Empty;

    /// <summary>
    /// Full business address
    /// </summary>
    [Required(ErrorMessage = "Business address is required")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Business address must be between 10 and 500 characters")]
    public string BusinessAddress { get; set; } = string.Empty;

    /// <summary>
    /// Business license or registration number
    /// </summary>
    [Required(ErrorMessage = "Business license number is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Business license must be between 3 and 100 characters")]
    public string BusinessLicense { get; set; } = string.Empty;

    /// <summary>
    /// Contact person name
    /// </summary>
    [Required(ErrorMessage = "Contact person name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Contact person name must be between 2 and 100 characters")]
    public string ContactPerson { get; set; } = string.Empty;

    /// <summary>
    /// Business phone number
    /// </summary>
    [Required(ErrorMessage = "Business phone is required")]
    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string BusinessPhone { get; set; } = string.Empty;

    /// <summary>
    /// Business email address
    /// </summary>
    [Required(ErrorMessage = "Business email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string BusinessEmail { get; set; } = string.Empty;

    /// <summary>
    /// Additional information about the business
    /// </summary>
    [StringLength(1000, ErrorMessage = "Additional information cannot exceed 1000 characters")]
    public string? AdditionalInfo { get; set; }
}
