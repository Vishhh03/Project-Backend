# Loyalty Program Module Documentation

**Team**: Loyalty Program Team  
**Module Owner**: Customer Rewards & Points System  
**Last Updated**: December 2024

## 📋 Module Overview

The Loyalty Program module manages customer rewards, points accumulation, and loyalty account operations. This module provides a comprehensive points-based system that encourages customer retention through automatic point awarding, transaction tracking, and reward management.

## 🎯 Module Responsibilities

- Loyalty account creation and management
- Automatic points calculation and awarding
- Points transaction history tracking
- Points balance management
- Reward calculation and validation
- Integration with booking and payment systems
- Loyalty program analytics

## 🏗️ Module Architecture

```
Loyalty Program Module
├── Controllers/
│   └── LoyaltyController.cs      # Loyalty API endpoints
├── Services/
│   └── LoyaltyService.cs        # Loyalty business logic
├── Models/
│   ├── LoyaltyAccount.cs        # Loyalty account entity
│   └── PointsTransaction.cs     # Points transaction entity
├── DTOs/
│   ├── LoyaltyAccountResponse.cs # Loyalty account output
│   └── PointsTransactionResponse.cs # Transaction output
├── Configuration/
│   └── LoyaltySettings.cs       # Loyalty configuration
└── Interfaces/
    └── ILoyaltyService.cs       # Loyalty service contract
```

## 🔧 Key Components

### 1. LoyaltyController.cs

**Purpose**: Handles loyalty program HTTP requests with proper authentication

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _loyaltyService;
    private readonly HotelContext _context;
    private readonly ILogger<LoyaltyController> _logger;

    // GET /api/loyalty/account - Get current user's loyalty account
    [HttpGet("account")]
    public async Task<ActionResult<LoyaltyAccountResponse>> GetLoyaltyAccount()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var loyaltyAccount = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.UserId == userId.Value);

        if (loyaltyAccount == null)
        {
            // Create loyalty account if it doesn't exist
            loyaltyAccount = await _loyaltyService.CreateLoyaltyAccountAsync(userId.Value);
        }

        var response = new LoyaltyAccountResponse
        {
            Id = loyaltyAccount.Id,
            UserId = loyaltyAccount.UserId,
            PointsBalance = loyaltyAccount.PointsBalance,
            TotalPointsEarned = loyaltyAccount.TotalPointsEarned,
            LastUpdated = loyaltyAccount.LastUpdated
        };

        _logger.LogInformation("Retrieved loyalty account for user {UserId} with balance {Points}",
            userId.Value, loyaltyAccount.PointsBalance);

        return Ok(response);
    }

    // GET /api/loyalty/transactions - Get current user's points transaction history
    [HttpGet("transactions")]
    public async Task<ActionResult<IEnumerable<PointsTransactionResponse>>> GetPointsTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var loyaltyAccount = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.UserId == userId.Value);

        if (loyaltyAccount == null)
        {
            return Ok(new List<PointsTransactionResponse>());
        }

        var transactions = await _context.PointsTransactions
            .Include(pt => pt.Booking)
            .ThenInclude(b => b.Hotel)
            .Where(pt => pt.LoyaltyAccountId == loyaltyAccount.Id)
            .OrderByDescending(pt => pt.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(pt => new PointsTransactionResponse
            {
                Id = pt.Id,
                LoyaltyAccountId = pt.LoyaltyAccountId,
                BookingId = pt.BookingId,
                PointsEarned = pt.PointsEarned,
                Description = pt.Description,
                CreatedAt = pt.CreatedAt,
                HotelName = pt.Booking != null ? pt.Booking.Hotel.Name : null
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} points transactions for user {UserId}",
            transactions.Count, userId.Value);

        return Ok(transactions);
    }

    // GET /api/loyalty/summary - Get loyalty program summary for current user
    [HttpGet("summary")]
    public async Task<ActionResult<LoyaltySummaryResponse>> GetLoyaltySummary()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var summary = await _loyaltyService.GetLoyaltySummaryAsync(userId.Value);
        return Ok(summary);
    }

    // POST /api/loyalty/redeem - Redeem points (future feature)
    [HttpPost("redeem")]
    public async Task<ActionResult<RedemptionResult>> RedeemPoints(RedeemPointsRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var result = await _loyaltyService.RedeemPointsAsync(userId.Value, request.Points, request.RedemptionType);
            
            _logger.LogInformation("User {UserId} redeemed {Points} points for {Type}",
                userId.Value, request.Points, request.RedemptionType);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Points redemption failed for user {UserId}: {Error}",
                userId.Value, ex.Message);
            return BadRequest(ex.Message);
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
    }
}
```

### 2. LoyaltyService.cs

**Purpose**: Implements business logic for loyalty program operations

```csharp
public class LoyaltyService : ILoyaltyService
{
    private readonly HotelContext _context;
    private readonly LoyaltySettings _settings;
    private readonly ILogger<LoyaltyService> _logger;

    public LoyaltyService(
        HotelContext context,
        IOptions<LoyaltySettings> settings,
        ILogger<LoyaltyService> logger)
    {
        _context = context;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<LoyaltyAccount> CreateLoyaltyAccountAsync(int userId)
    {
        var existingAccount = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.UserId == userId);

        if (existingAccount != null)
        {
            return existingAccount;
        }

        var loyaltyAccount = new LoyaltyAccount
        {
            UserId = userId,
            PointsBalance = _settings.WelcomeBonusPoints,
            TotalPointsEarned = _settings.WelcomeBonusPoints,
            LastUpdated = DateTime.UtcNow
        };

        _context.LoyaltyAccounts.Add(loyaltyAccount);
        await _context.SaveChangesAsync();

        // Create welcome bonus transaction
        if (_settings.WelcomeBonusPoints > 0)
        {
            await CreatePointsTransactionAsync(
                loyaltyAccount.Id,
                null,
                _settings.WelcomeBonusPoints,
                "Welcome bonus points");
        }

        _logger.LogInformation("Created loyalty account for user {UserId} with {Points} welcome bonus points",
            userId, _settings.WelcomeBonusPoints);

        return loyaltyAccount;
    }

    public async Task AwardPointsAsync(int userId, int bookingId, decimal bookingAmount)
    {
        var loyaltyAccount = await GetOrCreateLoyaltyAccountAsync(userId);

        // Calculate points based on booking amount
        var pointsToAward = CalculatePointsFromAmount(bookingAmount);

        if (pointsToAward <= 0)
        {
            _logger.LogInformation("No points awarded for booking {BookingId} - amount {Amount} below minimum",
                bookingId, bookingAmount);
            return;
        }

        // Check if points already awarded for this booking
        var existingTransaction = await _context.PointsTransactions
            .FirstOrDefaultAsync(pt => pt.BookingId == bookingId);

        if (existingTransaction != null)
        {
            _logger.LogWarning("Points already awarded for booking {BookingId}", bookingId);
            return;
        }

        // Update loyalty account
        loyaltyAccount.PointsBalance += pointsToAward;
        loyaltyAccount.TotalPointsEarned += pointsToAward;
        loyaltyAccount.LastUpdated = DateTime.UtcNow;

        // Create points transaction
        await CreatePointsTransactionAsync(
            loyaltyAccount.Id,
            bookingId,
            pointsToAward,
            $"Points earned from booking (${bookingAmount:F2})");

        await _context.SaveChangesAsync();

        _logger.LogInformation("Awarded {Points} points to user {UserId} for booking {BookingId} (${Amount:F2})",
            pointsToAward, userId, bookingId, bookingAmount);
    }

    public async Task<RedemptionResult> RedeemPointsAsync(int userId, int pointsToRedeem, RedemptionType redemptionType)
    {
        var loyaltyAccount = await GetOrCreateLoyaltyAccountAsync(userId);

        if (loyaltyAccount.PointsBalance < pointsToRedeem)
        {
            throw new InvalidOperationException($"Insufficient points. Available: {loyaltyAccount.PointsBalance}, Required: {pointsToRedeem}");
        }

        var discountAmount = CalculateDiscountFromPoints(pointsToRedeem, redemptionType);

        // Deduct points
        loyaltyAccount.PointsBalance -= pointsToRedeem;
        loyaltyAccount.LastUpdated = DateTime.UtcNow;

        // Create redemption transaction (negative points)
        await CreatePointsTransactionAsync(
            loyaltyAccount.Id,
            null,
            -pointsToRedeem,
            $"Points redeemed for {redemptionType} (${discountAmount:F2} discount)");

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} redeemed {Points} points for ${Discount:F2} discount",
            userId, pointsToRedeem, discountAmount);

        return new RedemptionResult
        {
            PointsRedeemed = pointsToRedeem,
            DiscountAmount = discountAmount,
            NewBalance = loyaltyAccount.PointsBalance,
            RedemptionType = redemptionType
        };
    }

    public async Task<LoyaltySummaryResponse> GetLoyaltySummaryAsync(int userId)
    {
        var loyaltyAccount = await GetOrCreateLoyaltyAccountAsync(userId);

        var recentTransactions = await _context.PointsTransactions
            .Include(pt => pt.Booking)
            .ThenInclude(b => b.Hotel)
            .Where(pt => pt.LoyaltyAccountId == loyaltyAccount.Id)
            .OrderByDescending(pt => pt.CreatedAt)
            .Take(5)
            .ToListAsync();

        var totalBookings = await _context.Bookings
            .CountAsync(b => b.UserId == userId && b.Status == BookingStatus.Completed);

        var nextRewardThreshold = CalculateNextRewardThreshold(loyaltyAccount.TotalPointsEarned);

        return new LoyaltySummaryResponse
        {
            CurrentBalance = loyaltyAccount.PointsBalance,
            TotalEarned = loyaltyAccount.TotalPointsEarned,
            TotalBookings = totalBookings,
            NextRewardThreshold = nextRewardThreshold,
            PointsToNextReward = Math.Max(0, nextRewardThreshold - loyaltyAccount.TotalPointsEarned),
            RecentTransactions = recentTransactions.Select(pt => new PointsTransactionResponse
            {
                Id = pt.Id,
                PointsEarned = pt.PointsEarned,
                Description = pt.Description,
                CreatedAt = pt.CreatedAt,
                HotelName = pt.Booking?.Hotel?.Name
            }).ToList()
        };
    }

    private async Task<LoyaltyAccount> GetOrCreateLoyaltyAccountAsync(int userId)
    {
        var loyaltyAccount = await _context.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.UserId == userId);

        if (loyaltyAccount == null)
        {
            loyaltyAccount = await CreateLoyaltyAccountAsync(userId);
        }

        return loyaltyAccount;
    }

    private async Task CreatePointsTransactionAsync(int loyaltyAccountId, int? bookingId, int points, string description)
    {
        var transaction = new PointsTransaction
        {
            LoyaltyAccountId = loyaltyAccountId,
            BookingId = bookingId,
            PointsEarned = points,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        _context.PointsTransactions.Add(transaction);
    }

    private int CalculatePointsFromAmount(decimal amount)
    {
        if (amount < _settings.MinimumBookingAmount)
        {
            return 0;
        }

        // Calculate points as percentage of booking amount
        var points = (int)Math.Floor(amount * _settings.PointsPercentage);
        
        // Apply maximum points per booking limit
        return Math.Min(points, _settings.MaxPointsPerBooking);
    }

    private decimal CalculateDiscountFromPoints(int points, RedemptionType redemptionType)
    {
        return redemptionType switch
        {
            RedemptionType.BookingDiscount => points * _settings.PointsToDiscountRatio,
            RedemptionType.RoomUpgrade => points * 0.5m, // Different rate for upgrades
            _ => points * _settings.PointsToDiscountRatio
        };
    }

    private int CalculateNextRewardThreshold(int totalEarned)
    {
        var thresholds = new[] { 100, 250, 500, 1000, 2500, 5000 };
        return thresholds.FirstOrDefault(t => t > totalEarned);
    }
}

public enum RedemptionType
{
    BookingDiscount = 1,
    RoomUpgrade = 2,
    FreeNight = 3
}

public class RedemptionResult
{
    public int PointsRedeemed { get; set; }
    public decimal DiscountAmount { get; set; }
    public int NewBalance { get; set; }
    public RedemptionType RedemptionType { get; set; }
}
```

### 3. Loyalty Models

**Purpose**: Represent loyalty program entities with points and transaction tracking

```csharp
public class LoyaltyAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PointsBalance { get; set; }
    public int TotalPointsEarned { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User User { get; set; } = null!;
    public ICollection<PointsTransaction> Transactions { get; set; } = new List<PointsTransaction>();
}

public class PointsTransaction
{
    public int Id { get; set; }
    public int LoyaltyAccountId { get; set; }
    public int? BookingId { get; set; }
    public int PointsEarned { get; set; } // Can be negative for redemptions
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
    public Booking? Booking { get; set; }
}
```

**Design Decisions**:
- **Separate balance and total**: Track current balance vs lifetime earnings
- **Transaction history**: Complete audit trail of all point activities
- **Flexible points**: Support both earning (positive) and redemption (negative)
- **Booking linkage**: Connect points to specific bookings for transparency

### 4. Loyalty DTOs

**Purpose**: Structure loyalty program data transfer and responses

```csharp
public class LoyaltyAccountResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PointsBalance { get; set; }
    public int TotalPointsEarned { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class PointsTransactionResponse
{
    public int Id { get; set; }
    public int LoyaltyAccountId { get; set; }
    public int? BookingId { get; set; }
    public int PointsEarned { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? HotelName { get; set; }
}

public class LoyaltySummaryResponse
{
    public int CurrentBalance { get; set; }
    public int TotalEarned { get; set; }
    public int TotalBookings { get; set; }
    public int NextRewardThreshold { get; set; }
    public int PointsToNextReward { get; set; }
    public List<PointsTransactionResponse> RecentTransactions { get; set; } = new();
}

public class RedeemPointsRequest
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Points must be greater than zero")]
    public int Points { get; set; }

    [Required]
    public RedemptionType RedemptionType { get; set; }
}
```

## 🎯 Points Calculation System

### Automatic Points Awarding

```csharp
// Called after successful payment processing
public async Task AwardPointsAsync(int userId, int bookingId, decimal bookingAmount)
{
    // Get or create loyalty account
    var loyaltyAccount = await GetOrCreateLoyaltyAccountAsync(userId);

    // Calculate points (10% of booking amount by default)
    var pointsToAward = CalculatePointsFromAmount(bookingAmount);

    if (pointsToAward > 0)
    {
        // Update account balance
        loyaltyAccount.PointsBalance += pointsToAward;
        loyaltyAccount.TotalPointsEarned += pointsToAward;
        loyaltyAccount.LastUpdated = DateTime.UtcNow;

        // Create transaction record
        var transaction = new PointsTransaction
        {
            LoyaltyAccountId = loyaltyAccount.Id,
            BookingId = bookingId,
            PointsEarned = pointsToAward,
            Description = $"Points earned from booking (${bookingAmount:F2})",
            CreatedAt = DateTime.UtcNow
        };

        _context.PointsTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Awarded {Points} points to user {UserId} for ${Amount:F2} booking",
            pointsToAward, userId, bookingAmount);
    }
}

private int CalculatePointsFromAmount(decimal amount)
{
    // Minimum booking amount required
    if (amount < _settings.MinimumBookingAmount)
        return 0;

    // Calculate as percentage of booking amount
    var points = (int)Math.Floor(amount * _settings.PointsPercentage);
    
    // Apply maximum limit
    return Math.Min(points, _settings.MaxPointsPerBooking);
}
```

### Points Redemption System

```csharp
public async Task<RedemptionResult> RedeemPointsAsync(int userId, int pointsToRedeem, RedemptionType redemptionType)
{
    var loyaltyAccount = await GetOrCreateLoyaltyAccountAsync(userId);

    // Validate sufficient balance
    if (loyaltyAccount.PointsBalance < pointsToRedeem)
    {
        throw new InvalidOperationException(
            $"Insufficient points. Available: {loyaltyAccount.PointsBalance}, Required: {pointsToRedeem}");
    }

    // Calculate discount value
    var discountAmount = CalculateDiscountFromPoints(pointsToRedeem, redemptionType);

    // Deduct points
    loyaltyAccount.PointsBalance -= pointsToRedeem;
    loyaltyAccount.LastUpdated = DateTime.UtcNow;

    // Record redemption transaction
    var transaction = new PointsTransaction
    {
        LoyaltyAccountId = loyaltyAccount.Id,
        PointsEarned = -pointsToRedeem, // Negative for redemptions
        Description = $"Points redeemed for {redemptionType} (${discountAmount:F2} discount)",
        CreatedAt = DateTime.UtcNow
    };

    _context.PointsTransactions.Add(transaction);
    await _context.SaveChangesAsync();

    return new RedemptionResult
    {
        PointsRedeemed = pointsToRedeem,
        DiscountAmount = discountAmount,
        NewBalance = loyaltyAccount.PointsBalance,
        RedemptionType = redemptionType
    };
}
```

## 🔗 Integration Points

### With Payment Module

```csharp
// Automatic points awarding after successful payment
public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
{
    var paymentResult = await _paymentService.ProcessPaymentAsync(request);
    
    if (paymentResult.Status == PaymentStatus.Completed)
    {
        // Get booking information
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);
            
        if (booking?.UserId.HasValue == true)
        {
            // Award loyalty points
            await _loyaltyService.AwardPointsAsync(
                booking.UserId.Value, 
                booking.Id, 
                request.Amount);
        }
    }
    
    return paymentResult;
}
```

### With Booking Module

```csharp
// Points redemption integration with booking discounts
public async Task<decimal> ApplyLoyaltyDiscountAsync(int userId, decimal bookingAmount, int pointsToRedeem)
{
    if (pointsToRedeem <= 0)
        return bookingAmount;

    var redemptionResult = await _loyaltyService.RedeemPointsAsync(
        userId, pointsToRedeem, RedemptionType.BookingDiscount);

    var discountedAmount = bookingAmount - redemptionResult.DiscountAmount;
    
    _logger.LogInformation("Applied ${Discount:F2} loyalty discount to booking for user {UserId}",
        redemptionResult.DiscountAmount, userId);

    return Math.Max(0, discountedAmount);
}
```

### With User Registration

```csharp
// Automatic loyalty account creation for new users
public async Task<User> CreateUserAsync(RegisterRequest request)
{
    var user = new User
    {
        Name = request.Name,
        Email = request.Email,
        // ... other properties
    };

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    // Create loyalty account with welcome bonus
    await _loyaltyService.CreateLoyaltyAccountAsync(user.Id);

    return user;
}
```

## ⚙️ Configuration

### Loyalty Settings

```csharp
public class LoyaltySettings
{
    public decimal PointsPercentage { get; set; } = 0.1m; // 10% of booking amount
    public decimal MinimumBookingAmount { get; set; } = 50.0m;
    public int MaxPointsPerBooking { get; set; } = 1000;
    public int WelcomeBonusPoints { get; set; } = 100;
    public decimal PointsToDiscountRatio { get; set; } = 0.01m; // 1 point = $0.01
    public bool EnablePointsExpiration { get; set; } = false;
    public int PointsExpirationDays { get; set; } = 365;
    public List<RewardTier> RewardTiers { get; set; } = new();
}

public class RewardTier
{
    public string Name { get; set; } = string.Empty;
    public int MinimumPoints { get; set; }
    public decimal BonusMultiplier { get; set; } = 1.0m;
    public List<string> Benefits { get; set; } = new();
}
```

### Configuration in appsettings.json

```json
{
  "Loyalty": {
    "PointsPercentage": 0.1,
    "MinimumBookingAmount": 50.0,
    "MaxPointsPerBooking": 1000,
    "WelcomeBonusPoints": 100,
    "PointsToDiscountRatio": 0.01,
    "EnablePointsExpiration": false,
    "PointsExpirationDays": 365,
    "RewardTiers": [
      {
        "Name": "Bronze",
        "MinimumPoints": 0,
        "BonusMultiplier": 1.0,
        "Benefits": ["Standard earning rate"]
      },
      {
        "Name": "Silver",
        "MinimumPoints": 500,
        "BonusMultiplier": 1.25,
        "Benefits": ["25% bonus points", "Priority support"]
      },
      {
        "Name": "Gold",
        "MinimumPoints": 2000,
        "BonusMultiplier": 1.5,
        "Benefits": ["50% bonus points", "Room upgrades", "Late checkout"]
      }
    ]
  }
}
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task AwardPoints_ValidBooking_CreatesTransactionAndUpdatesBalance()
{
    // Arrange
    var user = new User { Id = 1, Name = "Test User" };
    var loyaltyAccount = new LoyaltyAccount 
    { 
        Id = 1, 
        UserId = 1, 
        PointsBalance = 0, 
        TotalPointsEarned = 0 
    };
    
    _context.Users.Add(user);
    _context.LoyaltyAccounts.Add(loyaltyAccount);
    await _context.SaveChangesAsync();

    // Act
    await _loyaltyService.AwardPointsAsync(1, 1, 300.00m);

    // Assert
    var updatedAccount = await _context.LoyaltyAccounts.FindAsync(1);
    Assert.Equal(30, updatedAccount.PointsBalance); // 10% of $300
    Assert.Equal(30, updatedAccount.TotalPointsEarned);

    var transaction = await _context.PointsTransactions
        .FirstOrDefaultAsync(pt => pt.LoyaltyAccountId == 1);
    Assert.NotNull(transaction);
    Assert.Equal(30, transaction.PointsEarned);
    Assert.Equal(1, transaction.BookingId);
}

[Test]
public async Task RedeemPoints_SufficientBalance_DeductsPointsAndReturnsDiscount()
{
    // Arrange
    var loyaltyAccount = new LoyaltyAccount 
    { 
        Id = 1, 
        UserId = 1, 
        PointsBalance = 100, 
        TotalPointsEarned = 100 
    };
    
    _context.LoyaltyAccounts.Add(loyaltyAccount);
    await _context.SaveChangesAsync();

    // Act
    var result = await _loyaltyService.RedeemPointsAsync(1, 50, RedemptionType.BookingDiscount);

    // Assert
    Assert.Equal(50, result.PointsRedeemed);
    Assert.Equal(0.50m, result.DiscountAmount); // 50 points * $0.01
    Assert.Equal(50, result.NewBalance);

    var updatedAccount = await _context.LoyaltyAccounts.FindAsync(1);
    Assert.Equal(50, updatedAccount.PointsBalance);
}

[Test]
public async Task RedeemPoints_InsufficientBalance_ThrowsException()
{
    // Arrange
    var loyaltyAccount = new LoyaltyAccount 
    { 
        Id = 1, 
        UserId = 1, 
        PointsBalance = 25, 
        TotalPointsEarned = 25 
    };
    
    _context.LoyaltyAccounts.Add(loyaltyAccount);
    await _context.SaveChangesAsync();

    // Act & Assert
    var exception = await Assert.ThrowsAsync<InvalidOperationException>(
        () => _loyaltyService.RedeemPointsAsync(1, 50, RedemptionType.BookingDiscount));
    
    Assert.Contains("Insufficient points", exception.Message);
}
```

### Integration Testing

```csharp
[Test]
public async Task LoyaltyWorkflow_BookingToRedemption_WorksEndToEnd()
{
    // Arrange
    var client = _factory.CreateClient();
    await AuthenticateAsync(client, "guest@example.com", "Guest123!");

    // Act 1: Create booking and process payment (should award points)
    var booking = await CreateBookingAsync(client, 300.00m);
    await ProcessPaymentAsync(client, booking.Id, 300.00m);

    // Act 2: Check loyalty account
    var loyaltyResponse = await client.GetAsync("/api/loyalty/account");
    loyaltyResponse.EnsureSuccessStatusCode();
    var loyaltyAccount = await loyaltyResponse.Content.ReadFromJsonAsync<LoyaltyAccountResponse>();

    // Act 3: Redeem points
    var redeemRequest = new RedeemPointsRequest
    {
        Points = 15,
        RedemptionType = RedemptionType.BookingDiscount
    };

    var redeemResponse = await client.PostAsJsonAsync("/api/loyalty/redeem", redeemRequest);
    redeemResponse.EnsureSuccessStatusCode();
    var redemptionResult = await redeemResponse.Content.ReadFromJsonAsync<RedemptionResult>();

    // Assert
    Assert.Equal(130, loyaltyAccount.PointsBalance); // 100 welcome + 30 from booking
    Assert.Equal(15, redemptionResult.PointsRedeemed);
    Assert.Equal(0.15m, redemptionResult.DiscountAmount);
    Assert.Equal(115, redemptionResult.NewBalance);
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Points not awarded after payment**
   - Check if AwardPointsAsync is called after successful payment
   - Verify booking amount meets minimum threshold
   - Check for duplicate point awarding prevention

2. **Loyalty account not created**
   - Verify automatic account creation on user registration
   - Check welcome bonus configuration
   - Ensure proper user ID mapping

3. **Points calculation incorrect**
   - Review PointsPercentage configuration
   - Check MinimumBookingAmount setting
   - Verify MaxPointsPerBooking limits

### Debug Logging

```csharp
// Enhanced logging for loyalty operations
public async Task AwardPointsAsync(int userId, int bookingId, decimal bookingAmount)
{
    _logger.LogInformation("Attempting to award points for user {UserId}, booking {BookingId}, amount ${Amount:F2}",
        userId, bookingId, bookingAmount);

    try
    {
        var pointsToAward = CalculatePointsFromAmount(bookingAmount);
        
        _logger.LogDebug("Calculated {Points} points for ${Amount:F2} (rate: {Rate}%)",
            pointsToAward, bookingAmount, _settings.PointsPercentage * 100);

        if (pointsToAward <= 0)
        {
            _logger.LogInformation("No points awarded - amount ${Amount:F2} below minimum ${Minimum:F2}",
                bookingAmount, _settings.MinimumBookingAmount);
            return;
        }

        // ... award points logic

        _logger.LogInformation("Successfully awarded {Points} points to user {UserId}",
            pointsToAward, userId);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to award points for user {UserId}, booking {BookingId}",
            userId, bookingId);
        throw;
    }
}
```

## 📈 Performance Considerations

### Database Optimization

```csharp
// Efficient loyalty queries with proper indexing
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<LoyaltyAccount>(entity =>
    {
        // Index for user lookup
        entity.HasIndex(e => e.UserId)
              .IsUnique()
              .HasDatabaseName("IX_LoyaltyAccounts_UserId");
    });

    modelBuilder.Entity<PointsTransaction>(entity =>
    {
        // Composite index for account transactions
        entity.HasIndex(e => new { e.LoyaltyAccountId, e.CreatedAt })
              .HasDatabaseName("IX_PointsTransactions_Account_Date");
              
        // Index for booking-related transactions
        entity.HasIndex(e => e.BookingId)
              .HasDatabaseName("IX_PointsTransactions_BookingId");
    });
}
```

### Batch Processing

```csharp
// Batch points processing for high volume
public async Task ProcessPendingPointsAsync()
{
    var pendingBookings = await _context.Bookings
        .Include(b => b.User)
        .Where(b => b.Status == BookingStatus.Completed)
        .Where(b => !_context.PointsTransactions.Any(pt => pt.BookingId == b.Id))
        .Take(100)
        .ToListAsync();

    foreach (var booking in pendingBookings)
    {
        try
        {
            await AwardPointsAsync(booking.UserId.Value, booking.Id, booking.TotalAmount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process points for booking {BookingId}", booking.Id);
        }
    }

    _logger.LogInformation("Processed points for {Count} bookings", pendingBookings.Count);
}
```

## 🔮 Future Enhancements

1. **Advanced Loyalty Features**
   - Tier-based earning rates (Bronze, Silver, Gold)
   - Points expiration management
   - Bonus point promotions
   - Referral program integration

2. **Redemption Options**
   - Room upgrades
   - Free nights
   - Partner rewards (airlines, car rentals)
   - Gift card redemptions

3. **Analytics & Insights**
   - Loyalty program performance metrics
   - Customer lifetime value tracking
   - Redemption pattern analysis
   - Tier progression analytics

4. **Gamification**
   - Achievement badges
   - Streak bonuses
   - Challenge campaigns
   - Social sharing features

## 📚 Related Documentation

- [PAYMENT_MODULE.md](PAYMENT_MODULE.md) - Points awarding integration
- [BOOKING_MODULE.md](BOOKING_MODULE.md) - Booking-loyalty integration
- [AUTH_MODULE.md](AUTH_MODULE.md) - User authentication for loyalty
- [API_DOCUMENTATION.md](../finaldestination/API_DOCUMENTATION.md) - Loyalty API endpoints