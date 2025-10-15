using System.ComponentModel.DataAnnotations;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for updating an existing hotel with comprehensive validation
/// </summary>
public class UpdateHotelRequest
{
    [Required(ErrorMessage = "Hotel name is required")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Hotel name must be between 2 and 200 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Address is required")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Address must be between 5 and 500 characters")]
    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "City is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "City must be between 2 and 100 characters")]
    public string City { get; set; } = string.Empty;

    [Required(ErrorMessage = "Price per night is required")]
    [Range(0.01, 10000.00, ErrorMessage = "Price per night must be between $0.01 and $10,000.00")]
    [DataType(DataType.Currency)]
    public decimal PricePerNight { get; set; }

    [Required(ErrorMessage = "Available rooms count is required")]
    [Range(0, 1000, ErrorMessage = "Available rooms must be between 0 and 1000")]
    public int AvailableRooms { get; set; }

    [Range(0.0, 5.0, ErrorMessage = "Rating must be between 0.0 and 5.0")]
    public decimal Rating { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Manager ID must be a positive number")]
    public int? ManagerId { get; set; }
}




