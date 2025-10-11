using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Response DTO for authentication operations (login/register)
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// JWT token for authentication
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Token expiration date and time
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// User information
    /// </summary>
    public UserInfo User { get; set; } = new();
}

/// <summary>
/// User information included in authentication response
/// </summary>
public class UserInfo
{
    /// <summary>
    /// User's unique identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// User's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's role in the system
    /// </summary>
    public UserRole Role { get; set; }

    /// <summary>
    /// User's contact number (if provided)
    /// </summary>
    public string? ContactNumber { get; set; }

    /// <summary>
    /// Account creation date
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last login date (if available)
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// Whether the account is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// User's loyalty account information
    /// </summary>
    public LoyaltyInfo? LoyaltyAccount { get; set; }
}

/// <summary>
/// Loyalty account information included in user info
/// </summary>
public class LoyaltyInfo
{
    /// <summary>
    /// Current points balance
    /// </summary>
    public int PointsBalance { get; set; }

    /// <summary>
    /// Total points earned throughout account lifetime
    /// </summary>
    public int TotalPointsEarned { get; set; }

    /// <summary>
    /// Last time the loyalty account was updated
    /// </summary>
    public DateTime LastUpdated { get; set; }
}




