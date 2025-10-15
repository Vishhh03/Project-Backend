using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FinalDestinationAPI.Data;
using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Interfaces;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Controllers;

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

            // Create new user - ALWAYS as Guest for security
            var user = new User
            {
                Name = request.Name.Trim(),
                Email = request.Email.ToLower().Trim(),
                PasswordHash = passwordHash,
                Role = UserRole.Guest, 
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

    /// <summary>
    /// Apply to become a hotel manager (requires authentication as Guest)
    /// </summary>
    /// <param name="request">Hotel manager application details</param>
    /// <returns>Application confirmation</returns>
    /// <response code="201">Application submitted successfully</response>
    /// <response code="400">Invalid application data or user already has pending/approved application</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">User is not a Guest or already a Hotel Manager</response>
    [HttpPost("apply-hotel-manager")]
    [ProducesResponseType(typeof(HotelManagerApplicationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(string), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<HotelManagerApplicationResponse>> ApplyForHotelManager([FromBody] HotelManagerApplicationRequest request)
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

            // Get current user from token
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
                return NotFound("User not found");
            }

            // Check if user is a Guest
            if (user.Role != UserRole.Guest)
            {
                return BadRequest("Only Guest users can apply for Hotel Manager role. You are already a " + user.Role);
            }

            // Check if user already has a pending or approved application
            var existingApplication = await _context.HotelManagerApplications
                .Where(a => a.UserId == userId.Value && 
                           (a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.Approved))
                .FirstOrDefaultAsync();

            if (existingApplication != null)
            {
                if (existingApplication.Status == ApplicationStatus.Approved)
                {
                    return BadRequest("You already have an approved application. Your role will be updated shortly.");
                }
                return BadRequest("You already have a pending application. Please wait for it to be processed.");
            }

            // Create application
            var application = new HotelManagerApplication
            {
                UserId = userId.Value,
                BusinessName = request.BusinessName.Trim(),
                BusinessAddress = request.BusinessAddress.Trim(),
                BusinessLicense = request.BusinessLicense.Trim(),
                ContactPerson = request.ContactPerson.Trim(),
                BusinessPhone = request.BusinessPhone.Trim(),
                BusinessEmail = request.BusinessEmail.ToLower().Trim(),
                AdditionalInfo = request.AdditionalInfo?.Trim(),
                ApplicationDate = DateTime.UtcNow,
                Status = ApplicationStatus.Pending
            };

            _context.HotelManagerApplications.Add(application);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Hotel manager application submitted by user {UserId}", userId.Value);

            // Create response
            var response = new HotelManagerApplicationResponse
            {
                Id = application.Id,
                UserId = application.UserId,
                UserName = user.Name,
                UserEmail = user.Email,
                BusinessName = application.BusinessName,
                BusinessAddress = application.BusinessAddress,
                BusinessLicense = application.BusinessLicense,
                ContactPerson = application.ContactPerson,
                BusinessPhone = application.BusinessPhone,
                BusinessEmail = application.BusinessEmail,
                AdditionalInfo = application.AdditionalInfo,
                ApplicationDate = application.ApplicationDate,
                Status = application.Status,
                StatusText = application.Status.ToString()
            };

            return CreatedAtAction(nameof(GetMyApplication), new { id = application.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during hotel manager application submission");
            return StatusCode(500, "An error occurred while processing your application");
        }
    }

    /// <summary>
    /// Get current user's hotel manager application status
    /// </summary>
    /// <returns>Application details if exists</returns>
    /// <response code="200">Application found</response>
    /// <response code="404">No application found</response>
    /// <response code="401">Not authenticated</response>
    [HttpGet("my-application")]
    [ProducesResponseType(typeof(HotelManagerApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(string), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<HotelManagerApplicationResponse>> GetMyApplication()
    {
        try
        {
            // Get current user from token
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

            // Get application
            var application = await _context.HotelManagerApplications
                .Include(a => a.User)
                .Include(a => a.ProcessedByUser)
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.ApplicationDate)
                .FirstOrDefaultAsync();

            if (application == null)
            {
                return NotFound("No application found");
            }

            var response = new HotelManagerApplicationResponse
            {
                Id = application.Id,
                UserId = application.UserId,
                UserName = application.User.Name,
                UserEmail = application.User.Email,
                BusinessName = application.BusinessName,
                BusinessAddress = application.BusinessAddress,
                BusinessLicense = application.BusinessLicense,
                ContactPerson = application.ContactPerson,
                BusinessPhone = application.BusinessPhone,
                BusinessEmail = application.BusinessEmail,
                AdditionalInfo = application.AdditionalInfo,
                ApplicationDate = application.ApplicationDate,
                Status = application.Status,
                StatusText = application.Status.ToString(),
                ProcessedDate = application.ProcessedDate,
                ProcessedByName = application.ProcessedByUser?.Name,
                AdminNotes = application.AdminNotes
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hotel manager application");
            return StatusCode(500, "An error occurred while retrieving your application");
        }
    }

    /// <summary>
    /// Get all hotel manager applications (Admin only)
    /// </summary>
    /// <param name="status">Filter by status (optional)</param>
    /// <returns>List of applications</returns>
    /// <response code="200">Applications retrieved successfully</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (Admin only)</response>
    [HttpGet("admin/applications")]
    [ProducesResponseType(typeof(IEnumerable<HotelManagerApplicationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(string), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<HotelManagerApplicationResponse>>> GetAllApplications([FromQuery] ApplicationStatus? status = null)
    {
        try
        {
            // Get current user from token
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

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null || user.Role != UserRole.Admin)
            {
                return Forbid("Only administrators can view all applications");
            }

            // Get applications
            var query = _context.HotelManagerApplications
                .Include(a => a.User)
                .Include(a => a.ProcessedByUser)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status.Value);
            }

            var applications = await query
                .OrderByDescending(a => a.ApplicationDate)
                .ToListAsync();

            var response = applications.Select(a => new HotelManagerApplicationResponse
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User.Name,
                UserEmail = a.User.Email,
                BusinessName = a.BusinessName,
                BusinessAddress = a.BusinessAddress,
                BusinessLicense = a.BusinessLicense,
                ContactPerson = a.ContactPerson,
                BusinessPhone = a.BusinessPhone,
                BusinessEmail = a.BusinessEmail,
                AdditionalInfo = a.AdditionalInfo,
                ApplicationDate = a.ApplicationDate,
                Status = a.Status,
                StatusText = a.Status.ToString(),
                ProcessedDate = a.ProcessedDate,
                ProcessedByName = a.ProcessedByUser?.Name,
                AdminNotes = a.AdminNotes
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hotel manager applications");
            return StatusCode(500, "An error occurred while retrieving applications");
        }
    }

    /// <summary>
    /// Process (approve/reject) a hotel manager application (Admin only)
    /// </summary>
    /// <param name="id">Application ID</param>
    /// <param name="request">Processing decision and notes</param>
    /// <returns>Updated application</returns>
    /// <response code="200">Application processed successfully</response>
    /// <response code="400">Invalid request or application already processed</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (Admin only)</response>
    /// <response code="404">Application not found</response>
    [HttpPost("admin/applications/{id}/process")]
    [ProducesResponseType(typeof(HotelManagerApplicationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(string), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HotelManagerApplicationResponse>> ProcessApplication(int id, [FromBody] ProcessApplicationRequest request)
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

            // Get current user from token
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader == null || !authHeader.StartsWith("Bearer "))
            {
                return Unauthorized("Authorization token is required");
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var adminUserId = _jwtService.GetUserIdFromToken(token);

            if (adminUserId == null)
            {
                return Unauthorized("Invalid or expired token");
            }

            var adminUser = await _context.Users.FindAsync(adminUserId.Value);
            if (adminUser == null || adminUser.Role != UserRole.Admin)
            {
                return Forbid("Only administrators can process applications");
            }

            // Get application
            var application = await _context.HotelManagerApplications
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null)
            {
                return NotFound($"Application with ID {id} not found");
            }

            // Check if already processed
            if (application.Status != ApplicationStatus.Pending && application.Status != ApplicationStatus.RequiresMoreInfo)
            {
                return BadRequest($"Application has already been {application.Status}");
            }

            // Validate status
            if (request.Status != ApplicationStatus.Approved && 
                request.Status != ApplicationStatus.Rejected && 
                request.Status != ApplicationStatus.RequiresMoreInfo)
            {
                return BadRequest("Status must be Approved, Rejected, or RequiresMoreInfo");
            }

            // Update application
            application.Status = request.Status;
            application.ProcessedDate = DateTime.UtcNow;
            application.ProcessedBy = adminUserId.Value;
            application.AdminNotes = request.AdminNotes?.Trim();

            // If approved, upgrade user role
            if (request.Status == ApplicationStatus.Approved)
            {
                application.User.Role = UserRole.HotelManager;
                _logger.LogInformation("User {UserId} upgraded to Hotel Manager by admin {AdminId}", 
                    application.UserId, adminUserId.Value);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Application {ApplicationId} processed as {Status} by admin {AdminId}", 
                id, request.Status, adminUserId.Value);

            var response = new HotelManagerApplicationResponse
            {
                Id = application.Id,
                UserId = application.UserId,
                UserName = application.User.Name,
                UserEmail = application.User.Email,
                BusinessName = application.BusinessName,
                BusinessAddress = application.BusinessAddress,
                BusinessLicense = application.BusinessLicense,
                ContactPerson = application.ContactPerson,
                BusinessPhone = application.BusinessPhone,
                BusinessEmail = application.BusinessEmail,
                AdditionalInfo = application.AdditionalInfo,
                ApplicationDate = application.ApplicationDate,
                Status = application.Status,
                StatusText = application.Status.ToString(),
                ProcessedDate = application.ProcessedDate,
                ProcessedByName = adminUser.Name,
                AdminNotes = application.AdminNotes
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing hotel manager application {ApplicationId}", id);
            return StatusCode(500, "An error occurred while processing the application");
        }
    }
}




