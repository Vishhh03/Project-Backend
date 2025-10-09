// Controllers/BookingsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHotelManagement.Models;
using SmartHotelManagement.Models.DTOs;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly HotelDBContext _db;
    private readonly IUserContext _user;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(HotelDBContext db, IUserContext user, ILogger<BookingsController> logger)
    {
        _db = db;
        _user = user;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = _user.GetUserId();
        if (!userId.HasValue) return Unauthorized();

        var room = await _db.Rooms.FindAsync(request.RoomId);
        if (room == null) return NotFound(new { message = "Room not found" });

        if (request.CheckInDate.Date >= request.CheckOutDate.Date) return BadRequest(new { message = "Invalid check-in/check-out" });

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            // Check any confirmed bookings overlapping
            var overlap = await _db.Bookings.AnyAsync(b =>
                b.RoomId == request.RoomId &&
                b.Status == BookingStatus.Confirmed &&
                b.CheckInDate < request.CheckOutDate &&
                b.CheckOutDate > request.CheckInDate);

            if (overlap) return Conflict(new { message = "Room not available for selected dates" });

            // Check availability table for any date marked unavailable
            var dates = Enumerable.Range(0, (request.CheckOutDate.Date - request.CheckInDate.Date).Days)
                .Select(i => request.CheckInDate.Date.AddDays(i)).ToList();

            var blocked = await _db.Availabilities
                .Where(a => a.RoomId == request.RoomId && dates.Contains(a.Date) && a.IsAvailable == false)
                .AnyAsync();

            if (blocked) return Conflict(new { message = "Room unavailable for the selected dates" });

            // Calculate total (simple calculation using availability price overrides or room price)
            decimal total = 0;
            foreach (var d in dates)
            {
                var av = await _db.Availabilities.FirstOrDefaultAsync(a => a.RoomId == request.RoomId && a.Date == d);
                if (av?.PriceOverride != null) total += av.PriceOverride.Value;
                else total += room.Price;
            }

            var booking = new Booking
            {
                RoomId = request.RoomId,
                UserId = userId.Value,
                CheckInDate = request.CheckInDate.Date,
                CheckOutDate = request.CheckOutDate.Date,
                TotalAmount = total,
                Status = BookingStatus.Confirmed,
                CreatedAt = DateTime.UtcNow
            };

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            // Optional: mark per-date availability to false or maintain calendar of bookings (we keep Availabilities separate)
            // Audit
            _db.AuditLogs.Add(new AuditLog { EntityType = "Booking", Action = "Create", PerformedBy = _user.GetUserEmail() ?? userId.ToString(), Details = $"BookingId={booking.Id}, RoomId={booking.RoomId}, Dates={request.CheckInDate:yyyy-MM-dd} to {request.CheckOutDate:yyyy-MM-dd}" });
            await _db.SaveChangesAsync();

            await tx.CommitAsync();

            return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, new { booking.Id, booking.Status });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            _logger.LogError(ex, "Booking creation failed");
            return StatusCode(500, new { message = "Booking failed" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBooking(int id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Room).ThenInclude(r => r.RoomType)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        return Ok(booking);
    }

    // Cancel
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();
        var userId = _user.GetUserId();
        if (userId == null) return Unauthorized();

        // Owners or admin or booking owner allowed
        if (booking.UserId != userId && !_user.IsInRole("Admin")) return Forbid();

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog { EntityType = "Booking", Action = "Cancel", PerformedBy = _user.GetUserEmail() ?? userId.ToString(), Details = $"BookingId={id}" });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
