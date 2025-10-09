// Controllers/AvailabilityController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHotelManagement.Models.DTOs;
using SmartHotelManagement.Models;

[ApiController]
[Route("api/hotels/{hotelId}/[controller]")]
[Authorize(Roles = "HotelManager,Admin")]
public class AvailabilityController : ControllerBase
{
    private readonly HotelDBContext _db;
    private readonly IUserContext _user;
    private readonly ILogger<AvailabilityController> _logger;

    public AvailabilityController(HotelDBContext db, IUserContext user, ILogger<AvailabilityController> logger)
    {
        _db = db;
        _user = user;
        _logger = logger;
    }

    // Get availability for a room date range
    [HttpGet("rooms/{roomId}")]
    public async Task<IActionResult> GetRoomAvailability(int hotelId, int roomId, DateTime start, DateTime end)
    {
        if (start.Date > end.Date) return BadRequest(new { message = "Invalid date range" });

        var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId);
        if (room == null) return NotFound(new { message = "Room not found" });

        var avail = await _db.Availabilities
            .AsNoTracking()
            .Where(a => a.RoomId == roomId && a.Date >= start.Date && a.Date <= end.Date)
            .ToListAsync();

        var result = avail.Select(a => new AvailabilityDto { Date = a.Date.Date, IsAvailable = a.IsAvailable, PriceOverride = a.PriceOverride });
        return Ok(result);
    }

    // Bulk update availability for a date range (manager scoped)
    [HttpPost("rooms/{roomId}/bulk")]
    public async Task<IActionResult> BulkUpdate(int hotelId, int roomId, [FromBody] BulkAvailabilityDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId);
        if (room == null) return NotFound(new { message = "Room not found" });

        var dates = Enumerable.Range(0, (request.End.Date - request.Start.Date).Days + 1)
            .Select(i => request.Start.Date.AddDays(i))
            .ToList();

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            foreach (var date in dates)
            {
                var existing = await _db.Availabilities.FirstOrDefaultAsync(a => a.RoomId == roomId && a.Date == date);
                if (existing == null)
                {
                    _db.Availabilities.Add(new Availability
                    {
                        RoomId = roomId,
                        Date = date,
                        IsAvailable = request.IsAvailable,
                        PriceOverride = request.PriceOverride,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    existing.IsAvailable = request.IsAvailable;
                    existing.PriceOverride = request.PriceOverride;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync();

            // Audit
            var userEmail = _user.GetUserEmail() ?? "unknown";
            _db.AuditLogs.Add(new AuditLog { EntityType = "Availability", Action = "BulkUpdate", PerformedBy = userEmail, Details = $"RoomId={roomId}, Start={request.Start:yyyy-MM-dd}, End={request.End:yyyy-MM-dd}" });
            await _db.SaveChangesAsync();

            await tx.CommitAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            _logger.LogError(ex, "Bulk update failed");
            return StatusCode(500, new { message = "Error updating availability" });
        }
    }

    // Update single date availability
    [HttpPut("rooms/{roomId}/date/{date}")]
    public async Task<IActionResult> UpdateSingle(int hotelId, int roomId, DateTime date, [FromBody] UpdateAvailabilityDto request)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId);
        if (room == null) return NotFound(new { message = "Room not found" });

        var existing = await _db.Availabilities.FirstOrDefaultAsync(a => a.RoomId == roomId && a.Date == date.Date);
        if (existing == null)
        {
            existing = new Availability { RoomId = roomId, Date = date.Date, IsAvailable = request.IsAvailable, PriceOverride = request.PriceOverride, UpdatedAt = DateTime.UtcNow };
            _db.Availabilities.Add(existing);
        }
        else
        {
            existing.IsAvailable = request.IsAvailable;
            existing.PriceOverride = request.PriceOverride;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
