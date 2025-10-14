# Payment Processing Module Documentation

**Team**: Payment Processing Team  
**Module Owner**: Payment & Transaction Management  
**Last Updated**: December 2024

## 📋 Module Overview

The Payment Processing module handles all payment-related operations including payment processing, transaction management, refunds, and payment history. This module uses a mock payment service for development and testing, providing realistic payment scenarios without external dependencies.

## 🎯 Module Responsibilities

- Payment processing simulation
- Transaction record management
- Refund processing
- Payment validation and security
- Payment method handling
- Transaction history tracking
- Payment status management

## 🏗️ Module Architecture

```
Payment Processing Module
├── Controllers/
│   └── PaymentsController.cs     # Payment API endpoints
├── Services/
│   └── MockPaymentService.cs     # Payment processing logic
├── Models/
│   └── Payment.cs               # Payment entity
├── DTOs/
│   ├── PaymentRequest.cs        # Payment input
│   ├── PaymentResult.cs         # Payment output
│   └── RefundRequest.cs         # Refund input
├── Configuration/
│   └── PaymentSettings.cs       # Payment configuration
└── Interfaces/
    └── IPaymentService.cs       # Payment service contract
```

## 🔧 Key Components

### 1. MockPaymentService.cs

**Purpose**: Simulates realistic payment processing with configurable success/failure rates

```csharp
public class MockPaymentService : IPaymentService
{
    private readonly HotelContext _context;
    private readonly PaymentSettings _settings;
    private readonly ILogger<MockPaymentService> _logger;

    public MockPaymentService(
        HotelContext context,
        IOptions<PaymentSettings> settings,
        ILogger<MockPaymentService> logger)
    {
        _context = context;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        _logger.LogInformation("Processing payment for booking {BookingId}, amount {Amount}", 
            request.BookingId, request.Amount);

        // Simulate processing delay
        await Task.Delay(_settings.ProcessingDelayMs);

        // Validate payment request
        var validationResult = ValidatePaymentRequest(request);
        if (!validationResult.IsValid)
        {
            return CreateFailedPaymentResult(request, validationResult.ErrorMessage);
        }

        // Simulate payment processing with configurable success rate
        var isSuccess = Random.Shared.NextDouble() <= _settings.MockSuccessRate;

        var payment = new Payment
        {
            BookingId = request.BookingId,
            Amount = request.Amount,
            Currency = request.Currency,
            PaymentMethod = request.PaymentMethod,
            Status = isSuccess ? PaymentStatus.Completed : PaymentStatus.Failed,
            TransactionId = GenerateTransactionId(),
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var result = new PaymentResult
        {
            PaymentId = payment.Id,
            Status = payment.Status,
            TransactionId = payment.TransactionId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            PaymentMethod = payment.PaymentMethod,
            ProcessedAt = payment.ProcessedAt,
            ErrorMessage = isSuccess ? null : "Payment processing failed - insufficient funds"
        };

        _logger.LogInformation("Payment {PaymentId} processed with status {Status}", 
            payment.Id, payment.Status);

        return result;
    }

    public async Task<PaymentResult> ProcessRefundAsync(int paymentId, decimal amount)
    {
        _logger.LogInformation("Processing refund for payment {PaymentId}, amount {Amount}", 
            paymentId, amount);

        var originalPayment = await _context.Payments.FindAsync(paymentId);
        if (originalPayment == null)
        {
            return new PaymentResult
            {
                Status = PaymentStatus.Failed,
                ErrorMessage = "Original payment not found"
            };
        }

        if (originalPayment.Status != PaymentStatus.Completed)
        {
            return new PaymentResult
            {
                Status = PaymentStatus.Failed,
                ErrorMessage = "Cannot refund a payment that was not completed"
            };
        }

        if (amount > originalPayment.Amount)
        {
            return new PaymentResult
            {
                Status = PaymentStatus.Failed,
                ErrorMessage = "Refund amount cannot exceed original payment amount"
            };
        }

        // Simulate refund processing delay
        await Task.Delay(_settings.ProcessingDelayMs);

        // Simulate refund success (95% success rate for refunds)
        var isSuccess = Random.Shared.NextDouble() <= 0.95;

        if (isSuccess)
        {
            // Update original payment status
            originalPayment.Status = PaymentStatus.Refunded;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Refund processed successfully for payment {PaymentId}", paymentId);

            return new PaymentResult
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Refunded,
                TransactionId = GenerateTransactionId(),
                Amount = amount,
                Currency = originalPayment.Currency,
                PaymentMethod = originalPayment.PaymentMethod,
                ProcessedAt = DateTime.UtcNow
            };
        }
        else
        {
            _logger.LogWarning("Refund failed for payment {PaymentId}", paymentId);

            return new PaymentResult
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Failed,
                ErrorMessage = "Refund processing failed - please contact support"
            };
        }
    }

    public async Task<Payment?> GetPaymentAsync(int paymentId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
            .ThenInclude(b => b.Hotel)
            .FirstOrDefaultAsync(p => p.Id == paymentId);
    }

    public async Task<List<Payment>> GetPaymentHistoryAsync(int userId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
            .ThenInclude(b => b.Hotel)
            .Where(p => p.Booking.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    private PaymentValidationResult ValidatePaymentRequest(PaymentRequest request)
    {
        var errors = new List<string>();

        // Amount validation
        if (request.Amount <= 0)
        {
            errors.Add("Payment amount must be greater than zero");
        }

        if (request.Amount > 50000) // Max payment limit
        {
            errors.Add("Payment amount exceeds maximum limit");
        }

        // Currency validation
        if (string.IsNullOrEmpty(request.Currency) || request.Currency.Length != 3)
        {
            errors.Add("Invalid currency code");
        }

        // Card validation (basic)
        if (request.PaymentMethod == PaymentMethod.CreditCard || 
            request.PaymentMethod == PaymentMethod.DebitCard)
        {
            if (string.IsNullOrEmpty(request.CardNumber) || request.CardNumber.Length < 13)
            {
                errors.Add("Invalid card number");
            }

            if (request.ExpiryMonth < 1 || request.ExpiryMonth > 12)
            {
                errors.Add("Invalid expiry month");
            }

            if (request.ExpiryYear < DateTime.Now.Year)
            {
                errors.Add("Card has expired");
            }

            if (string.IsNullOrEmpty(request.Cvv) || request.Cvv.Length < 3)
            {
                errors.Add("Invalid CVV");
            }
        }

        return new PaymentValidationResult
        {
            IsValid = !errors.Any(),
            ErrorMessage = string.Join("; ", errors)
        };
    }

    private string GenerateTransactionId()
    {
        return $"TXN{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";
    }

    private PaymentResult CreateFailedPaymentResult(PaymentRequest request, string errorMessage)
    {
        return new PaymentResult
        {
            PaymentId = 0,
            Status = PaymentStatus.Failed,
            Amount = request.Amount,
            Currency = request.Currency,
            PaymentMethod = request.PaymentMethod,
            ErrorMessage = errorMessage
        };
    }
}
```

**Why Mock Payment Service**:
- **Development friendly**: No external API dependencies
- **Configurable scenarios**: Adjustable success/failure rates
- **Realistic simulation**: Includes delays and validation
- **Testing support**: Predictable behavior for tests

### 2. PaymentsController.cs

**Purpose**: Handles payment-related HTTP requests with proper authorization

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly HotelContext _context;
    private readonly ILogger<PaymentsController> _logger;

    // GET /api/payments/{id} - Get payment details
    [HttpGet("{id}")]
    public async Task<ActionResult<Payment>> GetPayment(int id)
    {
        var userId = GetCurrentUserId();
        var payment = await _paymentService.GetPaymentAsync(id);

        if (payment == null)
        {
            return NotFound("Payment not found");
        }

        // Users can only view their own payments, admins can view all
        if (payment.Booking.UserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid("You can only view your own payments");
        }

        return Ok(payment);
    }

    // GET /api/payments/history - Get user's payment history
    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<Payment>>> GetPaymentHistory()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var payments = await _paymentService.GetPaymentHistoryAsync(userId.Value);
        return Ok(payments);
    }

    // POST /api/payments/{id}/refund - Process refund (Admin only)
    [HttpPost("{id}/refund")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PaymentResult>> ProcessRefund(int id, RefundRequest request)
    {
        _logger.LogInformation("Processing refund for payment {PaymentId} by admin {AdminId}", 
            id, GetCurrentUserId());

        var payment = await _paymentService.GetPaymentAsync(id);
        if (payment == null)
        {
            return NotFound("Payment not found");
        }

        if (payment.Status != PaymentStatus.Completed)
        {
            return BadRequest("Can only refund completed payments");
        }

        var refundAmount = request.Amount ?? payment.Amount;
        if (refundAmount > payment.Amount)
        {
            return BadRequest("Refund amount cannot exceed original payment amount");
        }

        var result = await _paymentService.ProcessRefundAsync(id, refundAmount);

        if (result.Status == PaymentStatus.Refunded)
        {
            _logger.LogInformation("Refund processed successfully for payment {PaymentId}", id);
        }
        else
        {
            _logger.LogWarning("Refund failed for payment {PaymentId}: {Error}", id, result.ErrorMessage);
        }

        return Ok(result);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
    }
}
```

### 3. Payment Model

**Purpose**: Represents payment entity with complete transaction information

```csharp
public class Payment
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus Status { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Booking Booking { get; set; } = null!;
}

public enum PaymentMethod
{
    CreditCard = 1,
    DebitCard = 2,
    PayPal = 3,
    BankTransfer = 4
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4
}
```

**Design Decisions**:
- **Decimal precision**: Accurate financial calculations
- **Transaction ID**: Unique identifier for payment tracking
- **Status tracking**: Complete payment lifecycle management
- **Audit trail**: Created and processed timestamps
- **Booking relationship**: Links payments to reservations

### 4. Payment DTOs

**Purpose**: Structure and validate payment-related data transfer

```csharp
public class PaymentRequest
{
    [Required(ErrorMessage = "Booking ID is required")]
    public int BookingId { get; set; }

    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, 50000, ErrorMessage = "Amount must be between $0.01 and $50,000")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Currency is required")]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be 3 characters")]
    public string Currency { get; set; } = "USD";

    [Required(ErrorMessage = "Payment method is required")]
    public PaymentMethod PaymentMethod { get; set; }

    // Credit/Debit Card fields
    [CreditCard(ErrorMessage = "Invalid card number")]
    public string? CardNumber { get; set; }

    [Range(1, 12, ErrorMessage = "Expiry month must be between 1 and 12")]
    public int? ExpiryMonth { get; set; }

    [Range(2024, 2050, ErrorMessage = "Invalid expiry year")]
    public int? ExpiryYear { get; set; }

    [StringLength(4, MinimumLength = 3, ErrorMessage = "CVV must be 3 or 4 digits")]
    public string? Cvv { get; set; }

    [StringLength(100, ErrorMessage = "Card holder name cannot exceed 100 characters")]
    public string? CardHolderName { get; set; }
}

public class PaymentResult
{
    public int PaymentId { get; set; }
    public PaymentStatus Status { get; set; }
    public string? TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

public class RefundRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "Refund amount must be greater than zero")]
    public decimal? Amount { get; set; } // If null, refund full amount

    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string? Reason { get; set; }
}
```

## 🔒 Security Implementation

### Payment Data Security

```csharp
// Secure card number handling (in real implementation)
public class SecurePaymentRequest
{
    // Never log or store full card numbers
    [JsonIgnore]
    public string CardNumber { get; set; } = string.Empty;

    // Only store last 4 digits for display
    public string MaskedCardNumber => 
        string.IsNullOrEmpty(CardNumber) ? "" : 
        $"****-****-****-{CardNumber.Substring(CardNumber.Length - 4)}";

    // Never store CVV
    [JsonIgnore]
    public string Cvv { get; set; } = string.Empty;
}

// Audit logging for payment operations
private void LogPaymentOperation(string operation, int paymentId, int userId, decimal amount)
{
    _logger.LogInformation("Payment operation: {Operation}, PaymentId: {PaymentId}, " +
        "UserId: {UserId}, Amount: {Amount:C}", 
        operation, paymentId, userId, amount);
}
```

### PCI DSS Compliance Considerations

```csharp
// In production, implement these security measures:
public class ProductionPaymentService : IPaymentService
{
    // 1. Never store sensitive card data
    // 2. Use tokenization for card references
    // 3. Encrypt data in transit and at rest
    // 4. Implement proper access controls
    // 5. Log all payment operations for audit

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        // Tokenize card data immediately
        var cardToken = await _tokenizationService.TokenizeCardAsync(request.CardNumber);
        
        // Clear sensitive data from memory
        request.CardNumber = string.Empty;
        request.Cvv = string.Empty;
        
        // Process payment using token
        return await ProcessTokenizedPaymentAsync(cardToken, request);
    }
}
```

## 🔗 Integration Points

### With Booking Module

```csharp
// Payment processing called from BookingsController
[HttpPost("{id}/payment")]
public async Task<ActionResult<PaymentResult>> ProcessPayment(int id, PaymentRequest request)
{
    // Validate booking exists and belongs to user
    var booking = await _context.Bookings.FindAsync(id);
    if (booking == null) return NotFound();
    
    // Validate payment amount matches booking total
    if (request.Amount != booking.TotalAmount)
    {
        return BadRequest("Payment amount must match booking total");
    }

    // Process payment
    var result = await _paymentService.ProcessPaymentAsync(request);
    
    // Update booking status based on payment result
    if (result.Status == PaymentStatus.Completed)
    {
        // Payment successful - booking remains confirmed
        // Award loyalty points
        await _loyaltyService.AwardPointsAsync(booking.UserId.Value, booking.Id, booking.TotalAmount);
    }
    else
    {
        // Payment failed - could cancel booking or mark as pending payment
        _logger.LogWarning("Payment failed for booking {BookingId}: {Error}", 
            id, result.ErrorMessage);
    }

    return Ok(result);
}
```

### With Loyalty Module

```csharp
// Automatic loyalty points on successful payment
public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
{
    var result = await _mockPaymentService.ProcessPaymentAsync(request);
    
    if (result.Status == PaymentStatus.Completed)
    {
        // Get booking to award loyalty points
        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);
            
        if (booking?.UserId.HasValue == true)
        {
            try
            {
                await _loyaltyService.AwardPointsAsync(
                    booking.UserId.Value, 
                    booking.Id, 
                    request.Amount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to award loyalty points for payment {PaymentId}", 
                    result.PaymentId);
                // Don't fail payment if loyalty points fail
            }
        }
    }
    
    return result;
}
```

## ⚙️ Configuration

### Payment Settings

```csharp
public class PaymentSettings
{
    public double MockSuccessRate { get; set; } = 0.9; // 90% success rate
    public int ProcessingDelayMs { get; set; } = 1000; // 1 second delay
    public decimal MaxPaymentAmount { get; set; } = 50000;
    public string DefaultCurrency { get; set; } = "USD";
    public bool EnableRefunds { get; set; } = true;
    public int RefundProcessingDays { get; set; } = 3;
}
```

### Configuration in appsettings.json

```json
{
  "Payment": {
    "MockSuccessRate": 0.9,
    "ProcessingDelayMs": 1000,
    "MaxPaymentAmount": 50000.00,
    "DefaultCurrency": "USD",
    "EnableRefunds": true,
    "RefundProcessingDays": 3
  }
}
```

### Service Registration

```csharp
// Program.cs
builder.Services.Configure<PaymentSettings>(
    builder.Configuration.GetSection("Payment"));
    
builder.Services.AddScoped<IPaymentService, MockPaymentService>();
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task ProcessPayment_ValidRequest_ReturnsSuccessResult()
{
    // Arrange
    var request = new PaymentRequest
    {
        BookingId = 1,
        Amount = 300.00m,
        Currency = "USD",
        PaymentMethod = PaymentMethod.CreditCard,
        CardNumber = "4111111111111111",
        ExpiryMonth = 12,
        ExpiryYear = 2025,
        Cvv = "123"
    };

    // Configure mock for 100% success
    _paymentSettings.MockSuccessRate = 1.0;

    // Act
    var result = await _paymentService.ProcessPaymentAsync(request);

    // Assert
    Assert.Equal(PaymentStatus.Completed, result.Status);
    Assert.Equal(300.00m, result.Amount);
    Assert.NotNull(result.TransactionId);
    Assert.Null(result.ErrorMessage);
}

[Test]
public async Task ProcessRefund_ValidPayment_ReturnsRefundedStatus()
{
    // Arrange
    var payment = new Payment
    {
        Id = 1,
        Amount = 300.00m,
        Status = PaymentStatus.Completed,
        Currency = "USD"
    };
    _context.Payments.Add(payment);
    await _context.SaveChangesAsync();

    // Act
    var result = await _paymentService.ProcessRefundAsync(1, 300.00m);

    // Assert
    Assert.Equal(PaymentStatus.Refunded, result.Status);
    Assert.Equal(300.00m, result.Amount);
    
    // Verify payment status updated
    var updatedPayment = await _context.Payments.FindAsync(1);
    Assert.Equal(PaymentStatus.Refunded, updatedPayment.Status);
}

[Test]
public async Task ProcessPayment_InvalidCardNumber_ReturnsFailure()
{
    // Arrange
    var request = new PaymentRequest
    {
        BookingId = 1,
        Amount = 300.00m,
        PaymentMethod = PaymentMethod.CreditCard,
        CardNumber = "123", // Invalid card number
        ExpiryMonth = 12,
        ExpiryYear = 2025,
        Cvv = "123"
    };

    // Act
    var result = await _paymentService.ProcessPaymentAsync(request);

    // Assert
    Assert.Equal(PaymentStatus.Failed, result.Status);
    Assert.Contains("Invalid card number", result.ErrorMessage);
}
```

### Integration Testing

```csharp
[Test]
public async Task PaymentWorkflow_CreateProcessRefund_WorksEndToEnd()
{
    // Arrange
    var client = _factory.CreateClient();
    await AuthenticateAsync(client, "admin@hotel.com", "Admin123!");

    // Create a booking first
    var booking = await CreateTestBookingAsync(client);

    // Act 1: Process payment
    var paymentRequest = new PaymentRequest
    {
        BookingId = booking.Id,
        Amount = booking.TotalAmount,
        Currency = "USD",
        PaymentMethod = PaymentMethod.CreditCard,
        CardNumber = "4111111111111111",
        ExpiryMonth = 12,
        ExpiryYear = 2025,
        Cvv = "123",
        CardHolderName = "Test User"
    };

    var paymentResponse = await client.PostAsJsonAsync(
        $"/api/bookings/{booking.Id}/payment", paymentRequest);
    paymentResponse.EnsureSuccessStatusCode();
    
    var paymentResult = await paymentResponse.Content.ReadFromJsonAsync<PaymentResult>();
    Assert.Equal(PaymentStatus.Completed, paymentResult.Status);

    // Act 2: Process refund
    var refundRequest = new RefundRequest
    {
        Amount = booking.TotalAmount,
        Reason = "Customer cancellation"
    };

    var refundResponse = await client.PostAsJsonAsync(
        $"/api/payments/{paymentResult.PaymentId}/refund", refundRequest);
    refundResponse.EnsureSuccessStatusCode();
    
    var refundResult = await refundResponse.Content.ReadFromJsonAsync<PaymentResult>();
    Assert.Equal(PaymentStatus.Refunded, refundResult.Status);
}
```

### Load Testing

```csharp
[Test]
public async Task ProcessPayment_ConcurrentRequests_HandlesLoad()
{
    // Arrange
    var tasks = new List<Task<PaymentResult>>();
    var request = new PaymentRequest
    {
        BookingId = 1,
        Amount = 100.00m,
        Currency = "USD",
        PaymentMethod = PaymentMethod.CreditCard,
        CardNumber = "4111111111111111"
    };

    // Act - Process 100 concurrent payments
    for (int i = 0; i < 100; i++)
    {
        var bookingRequest = request with { BookingId = i + 1 };
        tasks.Add(_paymentService.ProcessPaymentAsync(bookingRequest));
    }

    var results = await Task.WhenAll(tasks);

    // Assert
    Assert.Equal(100, results.Length);
    Assert.True(results.All(r => r.Status != PaymentStatus.Pending));
    
    // Verify success rate is within expected range
    var successCount = results.Count(r => r.Status == PaymentStatus.Completed);
    var successRate = (double)successCount / results.Length;
    Assert.True(successRate >= 0.85 && successRate <= 0.95); // 90% ± 5%
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Payment processing timeouts**
   - Check ProcessingDelayMs configuration
   - Verify database connection stability
   - Monitor service performance metrics

2. **High failure rates**
   - Check MockSuccessRate configuration
   - Verify payment validation logic
   - Review error logs for patterns

3. **Refund processing failures**
   - Verify original payment status
   - Check refund amount validation
   - Ensure proper database transactions

### Debug Logging

```csharp
// Enhanced logging for payment operations
public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
{
    using var scope = _logger.BeginScope("Payment processing for booking {BookingId}", request.BookingId);
    
    _logger.LogInformation("Starting payment processing: Amount={Amount}, Method={Method}", 
        request.Amount, request.PaymentMethod);

    try
    {
        var result = await ProcessPaymentInternalAsync(request);
        
        _logger.LogInformation("Payment processing completed: Status={Status}, TransactionId={TransactionId}", 
            result.Status, result.TransactionId);
            
        return result;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Payment processing failed for booking {BookingId}", request.BookingId);
        throw;
    }
}
```

### Performance Monitoring

```csharp
// Payment processing metrics
public class PaymentMetrics
{
    private static readonly Counter PaymentAttempts = Metrics
        .CreateCounter("payment_attempts_total", "Total payment attempts", new[] { "method", "status" });
        
    private static readonly Histogram PaymentDuration = Metrics
        .CreateHistogram("payment_duration_seconds", "Payment processing duration");

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        using var timer = PaymentDuration.NewTimer();
        
        try
        {
            var result = await _paymentService.ProcessPaymentAsync(request);
            
            PaymentAttempts.WithLabels(request.PaymentMethod.ToString(), result.Status.ToString()).Inc();
            
            return result;
        }
        catch (Exception)
        {
            PaymentAttempts.WithLabels(request.PaymentMethod.ToString(), "Error").Inc();
            throw;
        }
    }
}
```

## 📈 Performance Considerations

### Database Optimization

```csharp
// Efficient payment queries
public async Task<List<Payment>> GetPaymentHistoryAsync(int userId, int page, int pageSize)
{
    return await _context.Payments
        .Include(p => p.Booking)
        .ThenInclude(b => b.Hotel)
        .Where(p => p.Booking.UserId == userId)
        .OrderByDescending(p => p.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new Payment
        {
            Id = p.Id,
            Amount = p.Amount,
            Currency = p.Currency,
            Status = p.Status,
            TransactionId = p.TransactionId,
            ProcessedAt = p.ProcessedAt,
            CreatedAt = p.CreatedAt,
            Booking = new Booking
            {
                Id = p.Booking.Id,
                Hotel = new Hotel
                {
                    Id = p.Booking.Hotel.Id,
                    Name = p.Booking.Hotel.Name
                }
            }
        })
        .ToListAsync();
}
```

### Async Processing

```csharp
// Background payment processing for high volume
public class BackgroundPaymentProcessor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackgroundPaymentProcessor> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<HotelContext>();
            
            // Process pending payments
            var pendingPayments = await context.Payments
                .Where(p => p.Status == PaymentStatus.Pending)
                .Take(10)
                .ToListAsync(stoppingToken);

            foreach (var payment in pendingPayments)
            {
                await ProcessPendingPaymentAsync(payment, scope.ServiceProvider);
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

## 🔮 Future Enhancements

1. **Real Payment Gateway Integration**
   - Stripe, PayPal, or Square integration
   - Webhook handling for payment status updates
   - Multi-currency support with real exchange rates

2. **Advanced Security Features**
   - PCI DSS compliance implementation
   - Fraud detection and prevention
   - 3D Secure authentication

3. **Payment Features**
   - Partial refunds
   - Payment plans and installments
   - Saved payment methods
   - Recurring payments

4. **Business Intelligence**
   - Payment analytics and reporting
   - Revenue tracking
   - Chargeback management
   - Settlement reporting

## 📚 Related Documentation

- [BOOKING_MODULE.md](BOOKING_MODULE.md) - Booking-payment integration
- [LOYALTY_MODULE.md](LOYALTY_MODULE.md) - Points awarding on payments
- [AUTH_MODULE.md](AUTH_MODULE.md) - Payment authorization
- [API_DOCUMENTATION.md](../finaldestination/API_DOCUMENTATION.md) - Payment API endpoints