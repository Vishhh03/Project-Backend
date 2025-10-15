using System.ComponentModel.DataAnnotations;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for user registration
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User's full name
    /// </summary>
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// User's email address (must be unique)
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's password (will be hashed before storage)
    /// </summary>
    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]", 
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Password confirmation (must match password)
    /// </summary>
    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("Password", ErrorMessage = "Password and confirmation do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>
    /// User's role (defaults to Guest)
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Guest;

    /// <summary>
    /// Optional contact number
    /// </summary>
    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(20, ErrorMessage = "Contact number cannot exceed 20 characters")]
    public string? ContactNumber { get; set; }
}




