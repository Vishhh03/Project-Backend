using System.Security.Claims;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Interfaces;

/// <summary>
/// Service for JWT token management including generation and validation
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Generates a JWT token for the specified user
    /// </summary>
    /// <param name="user">The user to generate the token for</param>
    /// <returns>JWT token string</returns>
    string GenerateToken(User user);
    
    /// <summary>
    /// Validates a JWT token and returns the claims principal
    /// </summary>
    /// <param name="token">The JWT token to validate</param>
    /// <returns>ClaimsPrincipal if valid, null if invalid</returns>
    ClaimsPrincipal? ValidateToken(string token);
    
    /// <summary>
    /// Extracts the user ID from a JWT token
    /// </summary>
    /// <param name="token">The JWT token</param>
    /// <returns>User ID if valid, null if invalid</returns>
    int? GetUserIdFromToken(string token);
    
    /// <summary>
    /// Extracts the user role from a JWT token
    /// </summary>
    /// <param name="token">The JWT token</param>
    /// <returns>User role if valid, null if invalid</returns>
    string? GetUserRoleFromToken(string token);
}




