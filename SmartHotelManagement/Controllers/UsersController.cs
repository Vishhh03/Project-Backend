// Controllers/UsersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHotelManagement.Models;
using SmartHotelManagement.Models.DTOs;
using SmartHotelManagement.Services;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly HotelDBContext _db;
    private readonly IUserContext _user;
    private readonly ILogger<UsersController> _logger;
    private readonly IJwtService _jwt;

    public UsersController(HotelDBContext db, IUserContext user, ILogger<UsersController> logger, IJwtService jwt)
    {
        _db = db;
        _user = user;
        _logger = logger;
        _jwt = jwt;
    }

    // Get my profile
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var uid = _user.GetUserId();
        if (!uid.HasValue) return Unauthorized();

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid.Value);
        if (user == null) return NotFound();

        var dto = new UserProfileDto { Id = user.Id, Name = user.Name, Email = user.Email, ContactNumber = user.ContactNumber, Role = user.Role };
        return Ok(dto);
    }

    // Update profile (name, contact)
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var uid = _user.GetUserId();
        if (!uid.HasValue) return Unauthorized();

        var user = await _db.Users.FindAsync(uid.Value);
        if (user == null) return NotFound();

        user.Name = request.Name ?? user.Name;
        user.ContactNumber = request.ContactNumber ?? user.ContactNumber;
        user.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog { EntityType = "User", Action = "UpdateProfile", PerformedBy = user.Email, Details = $"UserId={user.Id}" });
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Change password
    [HttpPost("me/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var uid = _user.GetUserId();
        if (!uid.HasValue) return Unauthorized();

        var user = await _db.Users.FindAsync(uid.Value);
        if (user == null) return NotFound();

        // Using BCrypt as in earlier code; replace with PasswordHasher if migrated
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash)) return Unauthorized(new { message = "Current password incorrect" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog { EntityType = "User", Action = "ChangePassword", PerformedBy = user.Email, Details = $"UserId={user.Id}" });
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Admin: list managers
    [HttpGet("managers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ListManagers()
    {
        var managers = await _db.Users.AsNoTracking().Where(u => u.Role == UserRole.HotelManager).Select(u => new { u.Id, u.Name, u.Email, u.ContactNumber }).ToListAsync();
        return Ok(managers);
    }

    // Admin: create or promote a manager
    [HttpPost("managers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateManager([FromBody] CreateManagerDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email.ToLowerInvariant());
        if (exists) return Conflict(new { message = "User with email exists" });

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new User { Name = request.Name, Email = request.Email.ToLowerInvariant(), PasswordHash = passwordHash, Role = UserRole.HotelManager, ContactNumber = request.ContactNumber, CreatedAt = DateTime.UtcNow };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.AuditLogs.Add(new AuditLog { EntityType = "User", Action = "CreateManager", PerformedBy = _user.GetUserEmail() ?? "admin", Details = $"UserId={user.Id}" });
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ListManagers), new { id = user.Id }, new { user.Id, user.Email });
    }

    // Admin: assign manager to hotel
    [HttpPost("assign-manager")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignManager([FromBody] AssignManagerDto request)
    {
        var hotel = await _db.Hotels.FindAsync(request.HotelId);
        if (hotel == null) return NotFound(new { message = "Hotel not found" });

        var manager = await _db.Users.FindAsync(request.ManagerId);
        if (manager == null || manager.Role != UserRole.HotelManager) return BadRequest(new { message = "Manager invalid" });

        hotel.ManagerId = manager.Id;
        hotel.UpdatedAt = DateTime.UtcNow;
        _db.AuditLogs.Add(new AuditLog { EntityType = "Hotel", Action = "AssignManager", PerformedBy = _user.GetUserEmail() ?? "admin", Details = $"HotelId={hotel.Id}, ManagerId={manager.Id}" });
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
