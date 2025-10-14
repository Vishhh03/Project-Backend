# Booking System Module Documentation

**Team**: Booking Management Team  
**Module Owner**: Reservation & Booking Operations  
**Last Updated**: December 2024

## 📋 Module Overview

The Booking System module manages the complete booking lifecycle from creation to completion, including room availability, booking validation, payment integration, and cancellation handling. This module serves as the core business logic for hotel reservations and ensures data consistency across the booking process.

## 🎯 Module Responsibilities

- Booking creation and validation
- Room availability management
- Booking status lifecycle management
- Payment integration and confirmation
- Booking cancellation and refunds
- User-specific booking access control
- Booking search and filtering

## 🏗️ Module Architecture

```
Booking System Module
├── Controllers/
│   └── BookingsController.cs     # Booking API endpoints
├── Models/
│   └── Booking.cs               # Booking entity
├── DTOs/
│   ├── CreateBookingRequest.cs  # Booking creation input
│   └── BookingResponse.cs       # Booking output
├── Services/
│   └── (Integrated with Payment) # Payment processing
└── Data/
    └── HotelContext.cs          # Database context (shared)
```

## 🔧 Key Components

### 1. BookingsController.cs

**Purpose**: Handles all booking-related HTTP requests with authentication and authorization

```csharp
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly HotelContext _context;
    private readonly IPaymentService _paymentService;
    private readonly ILoyaltyService _loyaltyService;
    private readonly ILogger<BookingsController> _logger;

    // GET /api/bookings - Admin only (all bookings)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<BookingResponse>>> GetBookings()
    {
        var bookings = await _context.Bookings
            .Include(b => b.Hotel)
            .Include(b => b.User)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                GuestName = b.GuestName,
                GuestEmail = b.GuestEmail,
                HotelId = b.HotelId,
                HotelName = b.Hotel.Name,
                UserId = b.UserId,
                CheckInDate = b.CheckInDate,
                CheckOutDate = b.CheckOutDate,
                NumberOfGuests = b.NumberOfGuests,
                TotalAmount = b.TotalAmount,
                Status = b.Status,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(bookings);
    }

    // GET /api/bookings/my - Current user's bookings
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookingResponse>>> GetMyBookings()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var bookings = await _context.Bookings
            .Include(b => b.Hotel)
            .Where(b => b.UserId == userId.Value)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                GuestName = b.GuestName,
                GuestEmail = b.GuestEmail,
                HotelId = b.HotelId,
                HotelName = b.Hotel.Name,
                UserId = b.UserId,
                CheckInDate = b.CheckInDate,
                CheckOutDate = b.CheckOutDate,
                NumberOfGuests = b.NumberOfGuests,
                TotalAmount = b.TotalAmount,
                Status = b.Status,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(bookings);
    }

    // POST /api/bookings - Create new booking
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BookingResponse>> CreateBooking(CreateBookingRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        // Validate hotel exists and has availability
        var hotel = await _context.Hotels.FindAsync(request.HotelId);
        if (hotel == null)
        {
            return NotFound("Hotel not found");
        }

        if (hotel.AvailableRooms <= 0)
        {
            return BadRequest("No rooms available");
        }

        // Validate dates
        if (request.CheckInDate >= request.CheckOutDate)
        {
            return BadRequest("Check-out date must be after check-in date");
        }

        if (request.CheckInDate < DateTime.Today)
        {
            return BadRequest("Check-in date cannot be in the past");
        }

        // Calculate total amount
        var nights = (request.CheckOutDate - request.CheckInDate).Days;
        var totalAmount = nights * hotel.PricePerNight;

        // Create booking
        var booking = new Booking
        {
            GuestName = request.GuestName,
            GuestEmail = request.GuestEmail,
            HotelId = request.HotelId,
            UserId = userId.Value,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            NumberOfGuests = request.NumberOfGuests,
            TotalAmount = totalAmount,
            Status = BookingStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        // Update hotel availability
        hotel.AvailableRooms--;

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created booking {BookingId} for user {UserId} at hotel {HotelId}", 
            booking.Id, userId.Value, request.HotelId);

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, 
            MapToBookingResponse(booking, hotel.Name));
    }

    // POST /api/bookings/{id}/payment - Process payment for booking
    [HttpPost("{id}/payment")]
    [Authorize]
    public async Task<ActionResult<PaymentResult>> ProcessPayment(int id, PaymentRequest request)
    {
        var userId = GetCurrentUserId();
        var booking = await _context.Bookings
            .Include(b => b.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound("Booking not found");
        }

        // Check ownership (users can only pay for their own bookings, admins can pay for any)
        if (booking.UserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid("You can only process payments for your own bookings");
        }

        // Validate payment amount matches booking total
        if (request.Amount != booking.TotalAmount)
        {
            return BadRequest($"Payment amount {request.Amount:C} does not match booking total {booking.TotalAmount:C}");
        }

        // Check if payment already exists
        var existingPayment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == id);
        if (existingPayment != null)
        {
            return BadRequest("Payment already processed for this booking");
        }

        // Process payment
        var paymentResult = await _paymentService.ProcessPaymentAsync(new PaymentRequest
        {
            BookingId = id,
            Amount = request.Amount,
            Currency = request.Currency,
            PaymentMethod = request.PaymentMethod,
            CardNumber = request.CardNumber,
            ExpiryMonth = request.ExpiryMonth,
            ExpiryYear = request.ExpiryYear,
            Cvv = request.Cvv,
            CardHolderName = request.CardHolderName
        });

        if (paymentResult.Status == PaymentStatus.Completed)
        {
            // Award loyalty points
            if (booking.UserId.HasValue)
            {
                await _loyaltyService.AwardPointsAsync(booking.UserId.Value, booking.Id, booking.TotalAmount);
            }

            _logger.LogInformation("Payment processed successfully for booking {BookingId}, " +
                "payment ID {PaymentId}", id, paymentResult.PaymentId);
        }
        else
        {
            _logger.LogWarning("Payment failed for booking {BookingId}: {ErrorMessage}", 
                id, paymentResult.ErrorMessage);
        }

        return Ok(paymentResult);
    }

    // PUT /api/bookings/{id}/cancel - Cancel booking
    [HttpPut("{id}/cancel")]
    [Authorize]
    public async Task<ActionResult<BookingResponse>> CancelBooking(int id)
    {
        var userId = GetCurrentUserId();
        var booking = await _context.Bookings
            .Include(b => b.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound("Booking not found");
        }

        // Check ownership
        if (booking.UserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid("You can only cancel your own bookings");
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            return BadRequest("Booking is already cancelled");
        }

        // Check cancellation policy (24 hours before check-in)
        if (booking.CheckInDate <= DateTime.Today.AddDays(1) && !User.IsInRole("Admin"))
        {
            return BadRequest("Cannot cancel booking within 24 hours of check-in");
        }

        // Process refund if payment exists
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == id && p.Status == PaymentStatus.Completed);

        if (payment != null)
        {
            var refundResult = await _paymentService.ProcessRefundAsync(payment.Id, payment.Amount);
            if (refundResult.Status != PaymentStatus.Refunded)
            {
                return BadRequest($"Refund failed: {refundResult.ErrorMessage}");
            }
        }

        // Update booking status
        booking.Status = BookingStatus.Cancelled;

        // Restore hotel availability
        booking.Hotel.AvailableRooms++;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled booking {BookingId} for user {UserId}", id, userId);

        return Ok(MapToBookingResponse(booking, booking.Hotel.Name));
    }

    // Helper method to get current user ID from JWT
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
    }
}
```

**Why This Design**:
- **Authentication-first**: All endpoints require authentication
- **Role-based access**: Different permissions for different operations
- **Business validation**: Comprehensive validation of booking rules
- **Transaction integrity**: Atomic operations for booking and availability
- **Integration ready**: Built-in payment and loyalty integration

### 2. Booking Model

**Purpose**: Represents booking entity with complete booking lifecycle

```csharp
public class Booking
{
    public int Id { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public int? UserId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Hotel Hotel { get; set; } = null!;
    public User? User { get; set; }
}

public enum BookingStatus
{
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3
}
```

**Design Decisions**:
- **Guest information**: Stored directly for booking records
- **User relationship**: Optional for guest bookings vs registered users
- **Calculated total**: Computed during booking creation
- **Status enum**: Simple but effective status tracking
- **Audit trail**: CreatedAt for booking history

### 3. CreateBookingRequest DTO

**Purpose**: Validates and structures booking creation input

```csharp
public class CreateBookingRequest
{
    [Required(ErrorMessage = "Guest name is required")]
    [StringLength(100, ErrorMessage = "Guest name cannot exceed 100 characters")]
    public string GuestName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Guest email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string GuestEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hotel ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Hotel ID must be a positive number")]
    public int HotelId { get; set; }

    [Required(ErrorMessage = "Check-in date is required")]
    [DataType(DataType.Date)]
    public DateTime CheckInDate { get; set; }

    [Required(ErrorMessage = "Check-out date is required")]
    [DataType(DataType.Date)]
    public DateTime CheckOutDate { get; set; }

    [Required(ErrorMessage = "Number of guests is required")]
    [Range(1, 10, ErrorMessage = "Number of guests must be between 1 and 10")]
    public int NumberOfGuests { get; set; }
}
```

**Validation Strategy**:
- **Required fields**: All essential booking information
- **Data types**: Proper date and email validation
- **Business rules**: Guest count limits and positive IDs
- **String lengths**: Prevent database overflow

## 🔄 Booking Lifecycle Management

### Booking Status Flow

```
┌─────────────┐    Payment     ┌─────────────┐    Check-out    ┌─────────────┐
│  Confirmed  │ ──────────────▶│  Confirmed  │ ──────────────▶│  Completed  │
└─────────────┘                └─────────────┘                └─────────────┘
       │                              │
       │ Cancel                       │ Cancel
       ▼                              ▼
┌─────────────┐                ┌─────────────┐
│  Cancelled  │                │  Cancelled  │
└─────────────┘                └─────────────┘
```

### Business Rules Implementation

```csharp
// Booking validation logic
private async Task<ValidationResult> ValidateBookingAsync(CreateBookingRequest request)
{
    var errors = new List<string>();

    // Date validation
    if (request.CheckInDate >= request.CheckOutDate)
    {
        errors.Add("Check-out date must be after check-in date");
    }

    if (request.CheckInDate < DateTime.Today)
    {
        errors.Add("Check-in date cannot be in the past");
    }

    // Hotel availability
    var hotel = await _context.Hotels.FindAsync(request.HotelId);
    if (hotel == null)
    {
        errors.Add("Hotel not found");
    }
    else if (hotel.AvailableRooms <= 0)
    {
        errors.Add("No rooms available");
    }

    // Guest count validation
    if (request.NumberOfGuests <= 0 || request.NumberOfGuests > 10)
    {
        errors.Add("Number of guests must be between 1 and 10");
    }

    return new ValidationResult
    {
        IsValid = !errors.Any(),
        Errors = errors
    };
}

// Cancellation policy enforcement
private bool CanCancelBooking(Booking booking, bool isAdmin)
{
    if (booking.Status == BookingStatus.Cancelled)
        return false;

    if (booking.Status == BookingStatus.Completed)
        return false;

    // Admin can cancel anytime
    if (isAdmin)
        return true;

    // Regular users: 24-hour cancellation policy
    return booking.CheckInDate > DateTime.Today.AddDays(1);
}
```

## 🔗 Integration Points

### With Payment Module

```csharp
// Payment processing integration
[HttpPost("{id}/payment")]
public async Task<ActionResult<PaymentResult>> ProcessPayment(int id, PaymentRequest request)
{
    // Validate booking and payment amount
    var booking = await GetBookingWithValidation(id);
    
    // Process payment through payment service
    var paymentResult = await _paymentService.ProcessPaymentAsync(new PaymentRequest
    {
        BookingId = id,
        Amount = booking.TotalAmount,
        Currency = "USD",
        PaymentMethod = request.PaymentMethod,
        // ... other payment details
    });

    // Handle payment result
    if (paymentResult.Status == PaymentStatus.Completed)
    {
        // Award loyalty points
        await _loyaltyService.AwardPointsAsync(booking.UserId.Value, booking.Id, booking.TotalAmount);
        
        _logger.LogInformation("Payment successful for booking {BookingId}", id);
    }

    return Ok(paymentResult);
}
```

### With Loyalty Module

```csharp
// Automatic loyalty points awarding
private async Task AwardLoyaltyPointsAsync(Booking booking)
{
    if (booking.UserId.HasValue)
    {
        try
        {
            await _loyaltyService.AwardPointsAsync(
                booking.UserId.Value, 
                booking.Id, 
                booking.TotalAmount);
                
            _logger.LogInformation("Awarded loyalty points for booking {BookingId}", booking.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to award loyalty points for booking {BookingId}", booking.Id);
            // Don't fail the booking if loyalty points fail
        }
    }
}
```

### With Hotel Module

```csharp
// Room availability management
private async Task UpdateHotelAvailabilityAsync(int hotelId, int roomChange)
{
    var hotel = await _context.Hotels.FindAsync(hotelId);
    if (hotel != null)
    {
        hotel.AvailableRooms += roomChange;
        
        // Ensure availability doesn't go negative
        if (hotel.AvailableRooms < 0)
        {
            hotel.AvailableRooms = 0;
        }
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Updated hotel {HotelId} availability by {Change} rooms", 
            hotelId, roomChange);
    }
}

// Usage in booking creation
hotel.AvailableRooms--; // Reserve room

// Usage in booking cancellation  
hotel.AvailableRooms++; // Release room
```

## ⚙️ Configuration

### Booking Business Rules

```csharp
public class BookingSettings
{
    public int MaxGuestsPerBooking { get; set; } = 10;
    public int CancellationHours { get; set; } = 24;
    public bool AllowPastDateBookings { get; set; } = false;
    public bool RequirePaymentForConfirmation { get; set; } = false;
    public decimal MaxBookingAmount { get; set; } = 10000;
}
```

### Configuration in appsettings.json

```json
{
  "Booking": {
    "MaxGuestsPerBooking": 10,
    "CancellationHours": 24,
    "AllowPastDateBookings": false,
    "RequirePaymentForConfirmation": false,
    "MaxBookingAmount": 10000.00
  }
}
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task CreateBooking_ValidRequest_ReturnsBookingResponse()
{
    // Arrange
    var hotel = new Hotel 
    { 
        Id = 1, 
        Name = "Test Hotel", 
        PricePerNight = 100, 
        AvailableRooms = 5 
    };
    _context.Hotels.Add(hotel);
    await _context.SaveChangesAsync();

    var request = new CreateBookingRequest
    {
        GuestName = "John Doe",
        GuestEmail = "john@example.com",
        HotelId = 1,
        CheckInDate = DateTime.Today.AddDays(1),
        CheckOutDate = DateTime.Today.AddDays(3),
        NumberOfGuests = 2
    };

    // Act
    var result = await _controller.CreateBooking(request);

    // Assert
    var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
    var booking = Assert.IsType<BookingResponse>(createdResult.Value);
    Assert.Equal("John Doe", booking.GuestName);
    Assert.Equal(200, booking.TotalAmount); // 2 nights * $100
}

[Test]
public async Task CancelBooking_WithinCancellationPeriod_UpdatesStatusAndAvailability()
{
    // Arrange
    var hotel = new Hotel { Id = 1, AvailableRooms = 5 };
    var booking = new Booking
    {
        Id = 1,
        HotelId = 1,
        UserId = 1,
        CheckInDate = DateTime.Today.AddDays(2),
        Status = BookingStatus.Confirmed
    };
    
    _context.Hotels.Add(hotel);
    _context.Bookings.Add(booking);
    await _context.SaveChangesAsync();

    // Act
    var result = await _controller.CancelBooking(1);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result.Result);
    var cancelledBooking = Assert.IsType<BookingResponse>(okResult.Value);
    Assert.Equal(BookingStatus.Cancelled, cancelledBooking.Status);
    
    // Verify hotel availability restored
    var updatedHotel = await _context.Hotels.FindAsync(1);
    Assert.Equal(6, updatedHotel.AvailableRooms);
}
```

### Integration Testing

```csharp
[Test]
public async Task BookingWorkflow_CreatePayCancel_WorksEndToEnd()
{
    // Arrange
    var client = _factory.CreateClient();
    await AuthenticateAsync(client, "guest@example.com", "Guest123!");

    // Act 1: Create booking
    var createRequest = new CreateBookingRequest
    {
        GuestName = "Integration Test",
        GuestEmail = "test@example.com",
        HotelId = 1,
        CheckInDate = DateTime.Today.AddDays(1),
        CheckOutDate = DateTime.Today.AddDays(3),
        NumberOfGuests = 2
    };

    var createResponse = await client.PostAsJsonAsync("/api/bookings", createRequest);
    createResponse.EnsureSuccessStatusCode();
    var booking = await createResponse.Content.ReadFromJsonAsync<BookingResponse>();

    // Act 2: Process payment
    var paymentRequest = new PaymentRequest
    {
        Amount = booking.TotalAmount,
        Currency = "USD",
        PaymentMethod = PaymentMethod.CreditCard,
        CardNumber = "4111111111111111"
    };

    var paymentResponse = await client.PostAsJsonAsync($"/api/bookings/{booking.Id}/payment", paymentRequest);
    paymentResponse.EnsureSuccessStatusCode();

    // Act 3: Cancel booking
    var cancelResponse = await client.PutAsync($"/api/bookings/{booking.Id}/cancel", null);
    cancelResponse.EnsureSuccessStatusCode();

    // Assert
    var cancelledBooking = await cancelResponse.Content.ReadFromJsonAsync<BookingResponse>();
    Assert.Equal(BookingStatus.Cancelled, cancelledBooking.Status);
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"No rooms available" error**
   - Check hotel availability count in database
   - Verify concurrent booking handling
   - Check for negative availability values

2. **Payment amount mismatch**
   - Verify total amount calculation logic
   - Check for currency conversion issues
   - Ensure price hasn't changed between booking and payment

3. **Cancellation policy violations**
   - Check date calculations for 24-hour rule
   - Verify timezone handling
   - Confirm admin override permissions

### Debug Logging

```csharp
// Add comprehensive logging
[HttpPost]
public async Task<ActionResult<BookingResponse>> CreateBooking(CreateBookingRequest request)
{
    _logger.LogInformation("Creating booking for user {UserId} at hotel {HotelId} " +
        "from {CheckIn} to {CheckOut}", 
        GetCurrentUserId(), request.HotelId, request.CheckInDate, request.CheckOutDate);

    try
    {
        // ... booking logic
        
        _logger.LogInformation("Successfully created booking {BookingId} with total {Amount}", 
            booking.Id, booking.TotalAmount);
            
        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to create booking for user {UserId} at hotel {HotelId}", 
            GetCurrentUserId(), request.HotelId);
        throw;
    }
}
```

### Performance Monitoring

```csharp
// Monitor booking creation performance
[HttpPost]
public async Task<ActionResult<BookingResponse>> CreateBooking(CreateBookingRequest request)
{
    using var activity = _logger.BeginScope("Booking creation");
    var stopwatch = Stopwatch.StartNew();
    
    try
    {
        // ... booking logic
        
        _logger.LogInformation("Booking creation completed in {ElapsedMs}ms", 
            stopwatch.ElapsedMilliseconds);
            
        return result;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Booking creation failed after {ElapsedMs}ms", 
            stopwatch.ElapsedMilliseconds);
        throw;
    }
}
```

## 📈 Performance Considerations

### Database Optimization

```csharp
// Efficient booking queries with proper includes
public async Task<BookingResponse?> GetBookingByIdAsync(int id)
{
    return await _context.Bookings
        .Include(b => b.Hotel)
        .Include(b => b.User)
        .Where(b => b.Id == id)
        .Select(b => new BookingResponse
        {
            Id = b.Id,
            GuestName = b.GuestName,
            HotelName = b.Hotel.Name,
            // ... other properties
        })
        .FirstOrDefaultAsync();
}

// Pagination for booking lists
public async Task<PagedResult<BookingResponse>> GetBookingsAsync(int page, int pageSize)
{
    var query = _context.Bookings
        .Include(b => b.Hotel)
        .OrderByDescending(b => b.CreatedAt);

    var totalCount = await query.CountAsync();
    var bookings = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(b => new BookingResponse { /* ... */ })
        .ToListAsync();

    return new PagedResult<BookingResponse>
    {
        Items = bookings,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    };
}
```

### Concurrency Handling

```csharp
// Handle concurrent booking attempts
[HttpPost]
public async Task<ActionResult<BookingResponse>> CreateBooking(CreateBookingRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    
    try
    {
        // Lock hotel record for update
        var hotel = await _context.Hotels
            .Where(h => h.Id == request.HotelId)
            .FirstOrDefaultAsync();

        if (hotel == null || hotel.AvailableRooms <= 0)
        {
            return BadRequest("Hotel not available");
        }

        // Create booking and update availability atomically
        var booking = new Booking { /* ... */ };
        hotel.AvailableRooms--;

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, response);
    }
    catch (Exception)
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

## 🔮 Future Enhancements

1. **Advanced Booking Features**
   - Room type selection
   - Special requests handling
   - Group booking management
   - Recurring bookings

2. **Availability Management**
   - Real-time availability tracking
   - Overbooking protection
   - Seasonal availability rules
   - Block booking management

3. **Business Logic Enhancements**
   - Dynamic pricing integration
   - Flexible cancellation policies
   - Booking modifications
   - Waitlist management

4. **Integration Improvements**
   - Email notifications
   - SMS confirmations
   - Calendar integration
   - Third-party booking platforms

## 📚 Related Documentation

- [PAYMENT_MODULE.md](PAYMENT_MODULE.md) - Payment processing integration
- [LOYALTY_MODULE.md](LOYALTY_MODULE.md) - Loyalty points integration
- [HOTEL_MODULE.md](HOTEL_MODULE.md) - Hotel availability management
- [AUTH_MODULE.md](AUTH_MODULE.md) - User authentication and authorization