using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinalDestinationAPI.Data;
using FinalDestinationAPI.Models;
using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Interfaces;
using FinalDestinationAPI.Services;
using FinalDestinationAPI.Extensions;
using System.Security.Claims;

namespace FinalDestinationAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Add JWT authentication to all endpoints
public class BookingsController : ControllerBase
{
    private readonly HotelContext _context;
    private readonly IPaymentService _paymentService;
    private readonly ILoyaltyService _loyaltyService;
    private readonly IValidationService _validationService;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(
        HotelContext context, 
        IPaymentService paymentService, 
        ILoyaltyService loyaltyService,
        IValidationService validationService,
        ILogger<BookingsController> logger)
    {
        _context = context;
        _paymentService = paymentService;
        _loyaltyService = loyaltyService;
        _validationService = validationService;
        _logger = logger;
    }

    // GET: api/bookings (Admin only - get all bookings)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<BookingResponse>>> GetBookings()
    {
        var bookings = await _context.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.User)
            .ToListAsync();

        var response = bookings.Select(MapToBookingResponse).ToList();
        return response;
    }

    // GET: api/bookings/5
    [HttpGet("{id}")]
    public async Task<ActionResult<BookingResponse>> GetBooking(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized("Invalid token");
        }

        var booking = await _context.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound($"Booking with ID {id} not found.");
        }

        // Users can only access their own bookings unless they are Admin
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && booking.UserId != currentUserId)
        {
            return Forbid("You can only access your own bookings.");
        }

        return MapToBookingResponse(booking);
    }

    // GET: api/bookings/my (Get current user's bookings)
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<BookingResponse>>> GetMyBookings()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized("Invalid token");
        }

        var bookings = await _context.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.User)
            .Where(b => b.UserId == currentUserId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var response = bookings.Select(MapToBookingResponse).ToList();
        return response;
    }

    // GET: api/bookings/guest/john@email.com (Admin only)
    [HttpGet("guest/{email}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<BookingResponse>>> GetBookingsByGuest(string email)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.User)
            .Where(b => b.GuestEmail.ToLower() == email.ToLower())
            .ToListAsync();

        var response = bookings.Select(MapToBookingResponse).ToList();
        return response;
    }

    // POST: api/bookings
    [HttpPost]
    public async Task<ActionResult<BookingResponse>> CreateBooking(CreateBookingRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return this.UnauthorizedError("Invalid token", "Unable to identify the current user from the JWT token");
        }

        // Perform comprehensive business rule validation
        var validationResult = await _validationService.ValidateBookingRequestAsync(request, currentUserId.Value);
        if (!validationResult.IsValid)
        {
            return this.ValidationError(validationResult);
        }

        // Get hotel (validation already confirmed it exists)
        var hotel = await _context.Hotels.FindAsync(request.HotelId);

        // Calculate total price
        var nights = (request.CheckOutDate - request.CheckInDate).Days;
        var totalAmount = hotel.PricePerNight * nights;

        // Create booking with pending status (requires payment)
        var booking = new Booking
        {
            GuestName = request.GuestName,
            GuestEmail = request.GuestEmail,
            HotelId = request.HotelId,
            UserId = currentUserId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            NumberOfGuests = request.NumberOfGuests,
            TotalAmount = totalAmount,
            Status = BookingStatus.Confirmed, // Will be updated after payment
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        
        // Reserve the room temporarily
        hotel.AvailableRooms--;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Booking {BookingId} created for user {UserId}, payment required", booking.Id, currentUserId);

        // Include hotel information in response
        booking.Hotel = hotel;
        var response = MapToBookingResponse(booking);
        response.PaymentRequired = true;

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, response);
    }

    // POST: api/bookings/5/payment
    [HttpPost("{id}/payment")]
    public async Task<ActionResult<PaymentResult>> ProcessPayment(int id, PaymentRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return this.UnauthorizedError("Invalid token", "Unable to identify the current user from the JWT token");
        }

        // Set booking ID in request for validation
        request.BookingId = id;

        // Perform comprehensive payment validation
        var validationResult = await _validationService.ValidatePaymentRequestAsync(request, currentUserId.Value);
        if (!validationResult.IsValid)
        {
            return this.ValidationError(validationResult);
        }

        // Get booking (validation already confirmed it exists and user has access)
        var booking = await _context.Bookings
            .Include(b => b.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        // Set booking ID in payment request
        request.BookingId = id;

        try
        {
            // Process payment
            var paymentResult = await _paymentService.ProcessPaymentAsync(request);

            if (paymentResult.Status == PaymentStatus.Completed)
            {
                // Payment successful - confirm booking
                booking.Status = BookingStatus.Confirmed;
                await _context.SaveChangesAsync();

                // Award loyalty points for the booking
                if (booking.UserId.HasValue)
                {
                    try
                    {
                        await _loyaltyService.AwardPointsAsync(booking.UserId.Value, booking.Id, booking.TotalAmount);
                        _logger.LogInformation("Loyalty points awarded for booking {BookingId} to user {UserId}", 
                            booking.Id, booking.UserId.Value);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to award loyalty points for booking {BookingId}", booking.Id);
                        // Don't fail the payment process if loyalty points fail
                    }
                }

                _logger.LogInformation("Payment {TransactionId} completed for booking {BookingId}", 
                    paymentResult.TransactionId, id);
            }
            else
            {
                // Payment failed - restore room availability
                if (booking.Hotel != null)
                {
                    booking.Hotel.AvailableRooms++;
                }
                booking.Status = BookingStatus.Cancelled;
                await _context.SaveChangesAsync();

                _logger.LogWarning("Payment failed for booking {BookingId}: {ErrorMessage}", 
                    id, paymentResult.ErrorMessage);
            }

            return paymentResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for booking {BookingId}", id);
            
            // Restore room availability on error
            if (booking.Hotel != null)
            {
                booking.Hotel.AvailableRooms++;
            }
            booking.Status = BookingStatus.Cancelled;
            await _context.SaveChangesAsync();

            return StatusCode(500, "An error occurred while processing the payment.");
        }
    }

    // PUT: api/bookings/5/cancel
    [HttpPut("{id}/cancel")]
    public async Task<ActionResult<PaymentResult?>> CancelBooking(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Unauthorized("Invalid token");
        }

        var booking = await _context.Bookings
            .Include(b => b.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound($"Booking with ID {id} not found.");
        }

        // Users can only cancel their own bookings unless they are Admin
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && booking.UserId != currentUserId)
        {
            return Forbid("You can only cancel your own bookings.");
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            return BadRequest("Booking is already cancelled.");
        }

        PaymentResult? refundResult = null;

        // Check if there's a completed payment that needs to be refunded
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == id && p.Status == PaymentStatus.Completed);

        if (payment != null)
        {
            try
            {
                // Process refund
                refundResult = await _paymentService.RefundPaymentAsync(payment.Id, payment.Amount);
                
                if (refundResult.Status != PaymentStatus.Refunded)
                {
                    _logger.LogWarning("Refund failed for booking {BookingId}: {ErrorMessage}", 
                        id, refundResult.ErrorMessage);
                    return BadRequest($"Failed to process refund: {refundResult.ErrorMessage}");
                }

                _logger.LogInformation("Refund {TransactionId} processed for booking {BookingId}", 
                    refundResult.TransactionId, id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund for booking {BookingId}", id);
                return StatusCode(500, "An error occurred while processing the refund.");
            }
        }

        // Cancel the booking
        booking.Status = BookingStatus.Cancelled;
        
        // Increase available rooms back
        if (booking.Hotel != null)
        {
            booking.Hotel.AvailableRooms++;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Booking {BookingId} cancelled by user {UserId}", id, currentUserId);

        return Ok(refundResult);
    }

    // DELETE: api/bookings/5 (Admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBooking(int id)
    {
        var booking = await _context.Bookings
            .Include(b => b.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound($"Booking with ID {id} not found.");
        }

        // Check if there are any payments associated with this booking
        var hasPayments = await _context.Payments.AnyAsync(p => p.BookingId == id);
        if (hasPayments)
        {
            return BadRequest("Cannot delete booking with associated payments. Cancel the booking instead.");
        }

        // Restore available rooms if booking was confirmed
        if (booking.Status == BookingStatus.Confirmed && booking.Hotel != null)
        {
            booking.Hotel.AvailableRooms++;
        }

        _context.Bookings.Remove(booking);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Booking {BookingId} deleted by admin", id);

        return NoContent();
    }

    #region Helper Methods

    /// <summary>
    /// Gets the current user ID from the JWT token
    /// </summary>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// Maps a Booking entity to a BookingResponse DTO
    /// </summary>
    private BookingResponse MapToBookingResponse(Booking booking)
    {
        // Check if there's a completed payment for this booking
        var hasPayment = _context.Payments.Any(p => p.BookingId == booking.Id && p.Status == PaymentStatus.Completed);
        var payment = _context.Payments.FirstOrDefault(p => p.BookingId == booking.Id && p.Status == PaymentStatus.Completed);

        // Check if loyalty points were earned for this booking
        int? loyaltyPointsEarned = null;
        if (booking.UserId.HasValue)
        {
            var pointsTransaction = _context.PointsTransactions
                .FirstOrDefault(pt => pt.BookingId == booking.Id);
            loyaltyPointsEarned = pointsTransaction?.PointsEarned;
        }

        return new BookingResponse
        {
            Id = booking.Id,
            GuestName = booking.GuestName,
            GuestEmail = booking.GuestEmail,
            HotelId = booking.HotelId,
            HotelName = booking.Hotel?.Name ?? "Unknown Hotel",
            UserId = booking.UserId,
            CheckInDate = booking.CheckInDate,
            CheckOutDate = booking.CheckOutDate,
            NumberOfGuests = booking.NumberOfGuests,
            TotalAmount = booking.TotalAmount,
            Status = booking.Status,
            CreatedAt = booking.CreatedAt,
            PaymentRequired = !hasPayment && booking.Status != BookingStatus.Cancelled,
            PaymentId = payment?.Id,
            LoyaltyPointsEarned = loyaltyPointsEarned
        };
    }

    #endregion
}




