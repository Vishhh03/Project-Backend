using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimpleHotelAPI.Data;
using SimpleHotelAPI.DTOs;
using SimpleHotelAPI.Interfaces;
using SimpleHotelAPI.Models;

namespace SimpleHotelAPI.Controllers;

/// <summary>
/// Controller for user authentication operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly HotelContext _context;
    private readonly IJwtService _jwtService;
    private readonly ILoyaltyService _loyaltyService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(HotelContext context, IJwtService jwtService, ILoyaltyService loyaltyService, ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _loyaltyService = loyaltyService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="request">User registration information</param>
    /// <returns>Authentication response with JWT token</returns>
    /// <response code="201">User registered successfully</response>
    /// <response code="400">Invalid registration data or email already exists</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Validate model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest($"Validation failed: {string.Join(", ", errors)}");
            }

            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (existingUser != null)
            {
                _logger.LogWarning("Registration attempt with existing email: {Email}", request.Email);
                return BadRequest("A user with this email already exists");
            }

            // Hash the password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create new user
            var user = new User
            {
                Name = request.Name.Trim(),
                Email = request.Email.ToLower().Trim(),
                PasswordHash = passwordHash,
                Role = request.Role,
                ContactNumber = request.ContactNumber?.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            // Add user to database
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create loyalty account for the new user
            var loyaltyAccount = new LoyaltyAccount
            {
                UserId = user.Id,
                PointsBalance = 0,
                TotalPointsEarned = 0,
                LastUpdated = DateTime.UtcNow
            };

            _context.LoyaltyAccounts.Add(loyaltyAccount);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddHours(24); // Default 24 hours

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var userInfo = await CreateUserInfoAsync(user);
            var response = new AuthResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = userInfo
            };

            _logger.LogInformation("User registered successfully: {Email}", user.Email);
            return CreatedAtAction(nameof(Register), new { id = user.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for email: {Email}", request.Email);
            return StatusCode(500, "An error occurred during registration");
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Authentication response with JWT token</returns>
    /// <response code="200">Login successful</response>
    /// <response code="400">Invalid login data</response>
    /// <response code="401">Invalid credentials or inactive account</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(string), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Validate model state
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest($"Validation failed: {string.Join(", ", errors)}");
            }

            // Find user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
            {
                _logger.LogWarning("Login attempt with non-existent email: {Email}", request.Email);
                return Unauthorized("Invalid email or password");
            }

            // Check if account is active
            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt with inactive account: {Email}", request.Email);
                return Unauthorized("Account is inactive. Please contact support.");
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Login attempt with invalid password for email: {Email}", request.Email);
                return Unauthorized("Invalid email or password");
            }

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddHours(24); // Default 24 hours

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var userInfo = await CreateUserInfoAsync(user);
            var response = new AuthResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = userInfo
            };

            _logger.LogInformation("User logged in successfully: {Email}", user.Email);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return StatusCode(500, "An error occurred during login");
        }
    }

    /// <summary>
    /// Get current user information (requires authentication)
    /// </summary>
    /// <returns>Current user information</returns>
    /// <response code="200">User information retrieved successfully</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="404">User not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(string), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserInfo>> GetCurrentUser()
    {
        try
        {
            // Get token from Authorization header
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader == null || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized("Authorization token is required");
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var userId = _jwtService.GetUserIdFromToken(token);

            if (userId == null)
            {
                return Unauthorized("Invalid or expired token");
            }

            // Get user from database
            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                _logger.LogWarning("Token contains non-existent user ID: {UserId}", userId);
                return NotFound("User not found");
            }

            if (!user.IsActive)
            {
                return Unauthorized("Account is inactive");
            }

            var userInfo = await CreateUserInfoAsync(user);
            return Ok(userInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user information");
            return StatusCode(500, "An error occurred while retrieving user information");
        }
    }

    /// <summary>
    /// Helper method to create UserInfo with loyalty account information
    /// </summary>
    private async Task<UserInfo> CreateUserInfoAsync(User user)
    {
        var userInfo = new UserInfo
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            ContactNumber = user.ContactNumber,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            IsActive = user.IsActive
        };

        // Get loyalty account information
        try
        {
            var loyaltyAccount = await _loyaltyService.GetLoyaltyAccountAsync(user.Id);
            if (loyaltyAccount != null)
            {
                userInfo.LoyaltyAccount = new LoyaltyInfo
                {
                    PointsBalance = loyaltyAccount.PointsBalance,
                    TotalPointsEarned = loyaltyAccount.TotalPointsEarned,
                    LastUpdated = loyaltyAccount.LastUpdated
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve loyalty account for user {UserId}", user.Id);
            // Don't fail the entire operation if loyalty account retrieval fails
        }

        return userInfo;
    }
}