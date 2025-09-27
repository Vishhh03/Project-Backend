using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHotelManagement.Models;
using SmartHotelManagement.Models.DTOs;
using SmartHotelManagement.Services;
using BCrypt.Net;

namespace SmartHotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly HotelDBContext _context;
        private readonly IJwtService _jwtService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(HotelDBContext context, IJwtService jwtService, ILogger<AuthController> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "User with this email already exists" });
                }

                // Hash the password
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                // Create new user
                var user = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    PasswordHash = passwordHash,
                    Role = request.Role,
                    ContactNumber = request.ContactNumber,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create loyalty account for guests
                if (request.Role == UserRole.Guest)
                {
                    var loyaltyAccount = new LoyaltyAccount
                    {
                        UserId = user.Id,
                        PointsBalance = 0,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.LoyaltyAccounts.Add(loyaltyAccount);
                    await _context.SaveChangesAsync();
                }

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);
                var expiration = DateTime.UtcNow.AddMinutes(60);

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role,
                    ContactNumber = user.ContactNumber,
                    CreatedAt = user.CreatedAt
                };

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = expiration,
                    User = userDto
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during user registration");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                // Find user by email
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);
                var expiration = DateTime.UtcNow.AddMinutes(60);

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Role = user.Role,
                    ContactNumber = user.ContactNumber,
                    CreatedAt = user.CreatedAt
                };

                var response = new AuthResponseDto
                {
                    Token = token,
                    Expiration = expiration,
                    User = userDto
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during user login");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("validate-token")]
        public IActionResult ValidateToken([FromBody] string token)
        {
            try
            {
                var isValid = _jwtService.ValidateToken(token);
                return Ok(new { isValid });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during token validation");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}