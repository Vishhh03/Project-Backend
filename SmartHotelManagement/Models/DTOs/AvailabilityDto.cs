// Models/DTOs/AvailabilityDto.cs
using SmartHotelManagement.Models;
using System.ComponentModel.DataAnnotations;

public class AvailabilityDto { public DateTime Date { get; set; } public bool IsAvailable { get; set; } public decimal? PriceOverride { get; set; } }

public class BulkAvailabilityDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public bool IsAvailable { get; set; }
    public decimal? PriceOverride { get; set; }
}

public class UpdateAvailabilityDto { public bool IsAvailable { get; set; } public decimal? PriceOverride { get; set; } }

// Booking DTOs
public class CreateBookingDto
{
    [Required] public int RoomId { get; set; }
    [Required] public DateTime CheckInDate { get; set; }
    [Required] public DateTime CheckOutDate { get; set; }
}

// User DTOs
public class UserProfileDto { public int Id { get; set; } public string Name { get; set; } = string.Empty; public string Email { get; set; } = string.Empty; public string? ContactNumber { get; set; } public UserRole Role { get; set; } }
public class UpdateProfileDto { [StringLength(100)] public string? Name { get; set; } [Phone] public string? ContactNumber { get; set; } }
public class ChangePasswordDto { [Required] public string CurrentPassword { get; set; } = string.Empty; [Required] public string NewPassword { get; set; } = string.Empty; }
public class CreateManagerDto { [Required][EmailAddress] public string Email { get; set; } = string.Empty; [Required] public string Password { get; set; } = string.Empty; [Required] public string Name { get; set; } = string.Empty; public string? ContactNumber { get; set; } }
public class AssignManagerDto { [Required] public int HotelId { get; set; } [Required] public int ManagerId { get; set; } }
