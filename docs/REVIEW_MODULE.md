# Review & Rating Module Documentation

**Team**: Review & Rating Team  
**Module Owner**: Customer Feedback & Rating System  
**Last Updated**: December 2024

## 📋 Module Overview

The Review & Rating module manages customer feedback, hotel ratings, and review moderation. This module provides a comprehensive system for guests to share their experiences and helps maintain accurate hotel ratings through automated calculations and review management.

## 🎯 Module Responsibilities

- Review submission and validation
- Hotel rating calculations and updates
- Review moderation and management
- User review history tracking
- Review-based hotel ranking
- Review response management (future)
- Content filtering and validation

## 🏗️ Module Architecture

```
Review & Rating Module
├── Controllers/
│   └── ReviewsController.cs      # Review API endpoints
├── Services/
│   └── ReviewService.cs         # Review business logic
├── Models/
│   └── Review.cs               # Review entity
├── DTOs/
│   ├── ReviewRequest.cs        # Review input
│   ├── ReviewResponse.cs       # Review output
│   └── UpdateReviewRequest.cs  # Review update input
└── Interfaces/
    └── IReviewService.cs       # Review service contract
```

## 🔧 Key Components

### 1. ReviewsController.cs

**Purpose**: Handles all review-related HTTP requests with proper authorization

```csharp
[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly HotelContext _context;
    private readonly ILogger<ReviewsController> _logger;

    // GET /api/reviews/hotel/{hotelId} - Get all reviews for a hotel
    [HttpGet("hotel/{hotelId}")]
    public async Task<ActionResult<IEnumerable<ReviewResponse>>> GetHotelReviews(int hotelId)
    {
        var hotel = await _context.Hotels.FindAsync(hotelId);
        if (hotel == null)
        {
            return NotFound("Hotel not found");
        }

        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.HotelId == hotelId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User.Name,
                HotelId = r.HotelId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} reviews for hotel {HotelId}", 
            reviews.Count, hotelId);

        return Ok(reviews);
    }

    // POST /api/reviews - Submit a new review
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> SubmitReview(ReviewRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        // Validate hotel exists
        var hotel = await _context.Hotels.FindAsync(request.HotelId);
        if (hotel == null)
        {
            return NotFound("Hotel not found");
        }

        // Check if user has already reviewed this hotel
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == userId.Value && r.HotelId == request.HotelId);

        if (existingReview != null)
        {
            return BadRequest("You have already reviewed this hotel. Use PUT to update your review.");
        }

        // Optional: Verify user has stayed at the hotel
        var hasBooking = await _context.Bookings
            .AnyAsync(b => b.UserId == userId.Value && 
                          b.HotelId == request.HotelId && 
                          b.Status == BookingStatus.Completed);

        if (!hasBooking)
        {
            return BadRequest("You can only review hotels where you have completed a stay");
        }

        // Create review
        var review = new Review
        {
            UserId = userId.Value,
            HotelId = request.HotelId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // Update hotel rating
        await _reviewService.UpdateHotelRatingAsync(request.HotelId);

        _logger.LogInformation("User {UserId} submitted review {ReviewId} for hotel {HotelId} with rating {Rating}", 
            userId.Value, review.Id, request.HotelId, request.Rating);

        // Load user information for response
        var user = await _context.Users.FindAsync(userId.Value);
        var response = new ReviewResponse
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = user?.Name ?? "Unknown",
            HotelId = review.HotelId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };

        return CreatedAtAction(nameof(GetReview), new { id = review.Id }, response);
    }

    // GET /api/reviews/{id} - Get specific review
    [HttpGet("{id}")]
    public async Task<ActionResult<ReviewResponse>> GetReview(int id)
    {
        var review = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
        {
            return NotFound("Review not found");
        }

        var response = new ReviewResponse
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = review.User.Name,
            HotelId = review.HotelId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };

        return Ok(response);
    }

    // PUT /api/reviews/{id} - Update existing review
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> UpdateReview(int id, UpdateReviewRequest request)
    {
        var userId = GetCurrentUserId();
        var review = await _context.Reviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
        {
            return NotFound("Review not found");
        }

        // Users can only update their own reviews
        if (review.UserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid("You can only update your own reviews");
        }

        // Update review
        review.Rating = request.Rating;
        review.Comment = request.Comment;

        await _context.SaveChangesAsync();

        // Update hotel rating
        await _reviewService.UpdateHotelRatingAsync(review.HotelId);

        _logger.LogInformation("Updated review {ReviewId} for hotel {HotelId}", id, review.HotelId);

        var response = new ReviewResponse
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = review.User.Name,
            HotelId = review.HotelId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };

        return Ok(response);
    }

    // DELETE /api/reviews/{id} - Delete review
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var userId = GetCurrentUserId();
        var review = await _context.Reviews.FindAsync(id);

        if (review == null)
        {
            return NotFound("Review not found");
        }

        // Users can only delete their own reviews, admins can delete any
        if (review.UserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid("You can only delete your own reviews");
        }

        var hotelId = review.HotelId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        // Update hotel rating after deletion
        await _reviewService.UpdateHotelRatingAsync(hotelId);

        _logger.LogInformation("Deleted review {ReviewId} for hotel {HotelId}", id, hotelId);

        return NoContent();
    }

    // GET /api/reviews/user/{userId} - Get user's reviews (Admin only or own reviews)
    [HttpGet("user/{userId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ReviewResponse>>> GetUserReviews(int userId)
    {
        var currentUserId = GetCurrentUserId();
        
        // Users can only view their own reviews, admins can view any
        if (currentUserId != userId && !User.IsInRole("Admin"))
        {
            return Forbid("You can only view your own reviews");
        }

        var reviews = await _context.Reviews
            .Include(r => r.Hotel)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User.Name,
                HotelId = r.HotelId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : null;
    }
}
```

**Why This Design**:
- **Authentication required**: Only authenticated users can submit reviews
- **Ownership validation**: Users can only modify their own reviews
- **Business rules**: Users must have completed stays to review
- **Automatic rating updates**: Hotel ratings recalculated on review changes
- **Comprehensive validation**: Prevents duplicate reviews and invalid data

### 2. ReviewService.cs

**Purpose**: Implements business logic for review operations and rating calculations

```csharp
public class ReviewService : IReviewService
{
    private readonly HotelContext _context;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(HotelContext context, ILogger<ReviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task UpdateHotelRatingAsync(int hotelId)
    {
        var hotel = await _context.Hotels
            .Include(h => h.Reviews)
            .FirstOrDefaultAsync(h => h.Id == hotelId);

        if (hotel == null)
        {
            _logger.LogWarning("Attempted to update rating for non-existent hotel {HotelId}", hotelId);
            return;
        }

        if (hotel.Reviews.Any())
        {
            // Calculate average rating
            var averageRating = hotel.Reviews.Average(r => r.Rating);
            var roundedRating = Math.Round(averageRating, 1);

            var oldRating = hotel.Rating;
            hotel.Rating = (decimal)roundedRating;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated hotel {HotelId} rating from {OldRating} to {NewRating} " +
                "based on {ReviewCount} reviews", 
                hotelId, oldRating, roundedRating, hotel.Reviews.Count);
        }
        else
        {
            // No reviews, set rating to 0
            hotel.Rating = 0;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Reset hotel {HotelId} rating to 0 (no reviews)", hotelId);
        }
    }

    public async Task<ReviewStatistics> GetHotelReviewStatisticsAsync(int hotelId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.HotelId == hotelId)
            .ToListAsync();

        if (!reviews.Any())
        {
            return new ReviewStatistics
            {
                HotelId = hotelId,
                TotalReviews = 0,
                AverageRating = 0,
                RatingDistribution = new Dictionary<int, int>()
            };
        }

        var ratingDistribution = reviews
            .GroupBy(r => r.Rating)
            .ToDictionary(g => g.Key, g => g.Count());

        // Ensure all ratings 1-5 are represented
        for (int i = 1; i <= 5; i++)
        {
            if (!ratingDistribution.ContainsKey(i))
            {
                ratingDistribution[i] = 0;
            }
        }

        return new ReviewStatistics
        {
            HotelId = hotelId,
            TotalReviews = reviews.Count,
            AverageRating = reviews.Average(r => r.Rating),
            RatingDistribution = ratingDistribution,
            MostRecentReview = reviews.OrderByDescending(r => r.CreatedAt).First().CreatedAt
        };
    }

    public async Task<bool> CanUserReviewHotelAsync(int userId, int hotelId)
    {
        // Check if user has already reviewed this hotel
        var existingReview = await _context.Reviews
            .AnyAsync(r => r.UserId == userId && r.HotelId == hotelId);

        if (existingReview)
        {
            return false;
        }

        // Check if user has completed a stay at this hotel
        var hasCompletedStay = await _context.Bookings
            .AnyAsync(b => b.UserId == userId && 
                          b.HotelId == hotelId && 
                          b.Status == BookingStatus.Completed);

        return hasCompletedStay;
    }

    public async Task<List<Review>> GetTopRatedHotelsAsync(int count = 10)
    {
        return await _context.Hotels
            .Include(h => h.Reviews)
            .Where(h => h.Reviews.Any())
            .OrderByDescending(h => h.Rating)
            .ThenByDescending(h => h.Reviews.Count)
            .Take(count)
            .SelectMany(h => h.Reviews)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<bool> ValidateReviewContentAsync(string comment)
    {
        if (string.IsNullOrWhiteSpace(comment))
        {
            return true; // Empty comments are allowed
        }

        // Basic content validation
        if (comment.Length > 1000)
        {
            return false;
        }

        // Check for inappropriate content (basic implementation)
        var inappropriateWords = new[] { "spam", "fake", "scam" }; // In production, use a comprehensive list
        var lowerComment = comment.ToLower();

        return !inappropriateWords.Any(word => lowerComment.Contains(word));
    }
}

public class ReviewStatistics
{
    public int HotelId { get; set; }
    public int TotalReviews { get; set; }
    public double AverageRating { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new();
    public DateTime? MostRecentReview { get; set; }
}
```

### 3. Review Model

**Purpose**: Represents review entity with rating and feedback information

```csharp
public class Review
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int HotelId { get; set; }
    public int Rating { get; set; } // 1-5 scale
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User User { get; set; } = null!;
    public Hotel Hotel { get; set; } = null!;
}
```

**Design Decisions**:
- **Integer rating**: Simple 1-5 scale for consistency
- **Optional comment**: Users can rate without detailed feedback
- **User relationship**: Links reviews to authenticated users
- **Hotel relationship**: Links reviews to specific hotels
- **Timestamp**: Tracks when review was submitted

### 4. Review DTOs

**Purpose**: Structure and validate review-related data transfer

```csharp
public class ReviewRequest
{
    [Required(ErrorMessage = "Hotel ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Hotel ID must be a positive number")]
    public int HotelId { get; set; }

    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    [StringLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
    public string Comment { get; set; } = string.Empty;
}

public class UpdateReviewRequest
{
    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    [StringLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
    public string Comment { get; set; } = string.Empty;
}

public class ReviewResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

## ⭐ Rating Calculation System

### Automatic Rating Updates

```csharp
// Triggered after review creation, update, or deletion
public async Task UpdateHotelRatingAsync(int hotelId)
{
    var hotel = await _context.Hotels
        .Include(h => h.Reviews)
        .FirstOrDefaultAsync(h => h.Id == hotelId);

    if (hotel?.Reviews.Any() == true)
    {
        // Calculate weighted average (could be enhanced with recency weighting)
        var averageRating = hotel.Reviews.Average(r => r.Rating);
        hotel.Rating = Math.Round((decimal)averageRating, 1);
        
        _logger.LogInformation("Updated hotel {HotelId} rating to {Rating} from {ReviewCount} reviews",
            hotelId, hotel.Rating, hotel.Reviews.Count);
    }
    else
    {
        hotel.Rating = 0;
        _logger.LogInformation("Reset hotel {HotelId} rating to 0 (no reviews)", hotelId);
    }

    await _context.SaveChangesAsync();
}
```

### Rating Distribution Analysis

```csharp
public async Task<RatingAnalysis> GetRatingAnalysisAsync(int hotelId)
{
    var reviews = await _context.Reviews
        .Where(r => r.HotelId == hotelId)
        .ToListAsync();

    if (!reviews.Any())
    {
        return new RatingAnalysis { HotelId = hotelId };
    }

    var distribution = new Dictionary<int, int>();
    for (int i = 1; i <= 5; i++)
    {
        distribution[i] = reviews.Count(r => r.Rating == i);
    }

    return new RatingAnalysis
    {
        HotelId = hotelId,
        TotalReviews = reviews.Count,
        AverageRating = reviews.Average(r => r.Rating),
        RatingDistribution = distribution,
        PercentageByRating = distribution.ToDictionary(
            kvp => kvp.Key, 
            kvp => (double)kvp.Value / reviews.Count * 100)
    };
}
```

## 🔗 Integration Points

### With Hotel Module

```csharp
// Hotel rating updates affect hotel search results
public async Task<List<Hotel>> GetTopRatedHotelsAsync(int count = 10)
{
    return await _context.Hotels
        .Where(h => h.Rating > 0) // Only hotels with reviews
        .OrderByDescending(h => h.Rating)
        .ThenByDescending(h => h.Reviews.Count) // Secondary sort by review count
        .Take(count)
        .ToListAsync();
}

// Hotel search can filter by minimum rating
public async Task<List<Hotel>> SearchHotelsByRatingAsync(decimal minRating)
{
    return await _context.Hotels
        .Where(h => h.Rating >= minRating)
        .OrderByDescending(h => h.Rating)
        .ToListAsync();
}
```

### With Booking Module

```csharp
// Verify user eligibility to review based on completed bookings
public async Task<bool> CanUserReviewHotelAsync(int userId, int hotelId)
{
    // User must have completed at least one stay
    var hasCompletedStay = await _context.Bookings
        .AnyAsync(b => b.UserId == userId && 
                      b.HotelId == hotelId && 
                      b.Status == BookingStatus.Completed &&
                      b.CheckOutDate < DateTime.Today); // Stay must be finished

    // User hasn't already reviewed this hotel
    var hasExistingReview = await _context.Reviews
        .AnyAsync(r => r.UserId == userId && r.HotelId == hotelId);

    return hasCompletedStay && !hasExistingReview;
}
```

### With Authentication Module

```csharp
// Review ownership validation
private bool CanUserModifyReview(Review review, ClaimsPrincipal user)
{
    var userId = GetCurrentUserId(user);
    
    // User can modify their own reviews
    if (review.UserId == userId)
        return true;
    
    // Admins can modify any review
    if (user.IsInRole("Admin"))
        return true;
    
    return false;
}
```

## ⚙️ Configuration

### Review Settings

```csharp
public class ReviewSettings
{
    public int MaxCommentLength { get; set; } = 1000;
    public bool RequireCompletedStay { get; set; } = true;
    public bool AllowMultipleReviews { get; set; } = false;
    public int MinDaysAfterCheckout { get; set; } = 0;
    public bool EnableContentModeration { get; set; } = true;
    public List<string> ProhibitedWords { get; set; } = new();
}
```

### Configuration in appsettings.json

```json
{
  "Review": {
    "MaxCommentLength": 1000,
    "RequireCompletedStay": true,
    "AllowMultipleReviews": false,
    "MinDaysAfterCheckout": 0,
    "EnableContentModeration": true,
    "ProhibitedWords": ["spam", "fake", "scam"]
  }
}
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task SubmitReview_ValidReview_CreatesReviewAndUpdatesRating()
{
    // Arrange
    var hotel = new Hotel { Id = 1, Name = "Test Hotel", Rating = 0 };
    var user = new User { Id = 1, Name = "Test User" };
    var booking = new Booking 
    { 
        Id = 1, 
        UserId = 1, 
        HotelId = 1, 
        Status = BookingStatus.Completed,
        CheckOutDate = DateTime.Today.AddDays(-1)
    };

    _context.Hotels.Add(hotel);
    _context.Users.Add(user);
    _context.Bookings.Add(booking);
    await _context.SaveChangesAsync();

    var request = new ReviewRequest
    {
        HotelId = 1,
        Rating = 5,
        Comment = "Excellent hotel!"
    };

    // Act
    var result = await _controller.SubmitReview(request);

    // Assert
    var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
    var review = Assert.IsType<ReviewResponse>(createdResult.Value);
    Assert.Equal(5, review.Rating);
    Assert.Equal("Excellent hotel!", review.Comment);

    // Verify hotel rating was updated
    var updatedHotel = await _context.Hotels.FindAsync(1);
    Assert.Equal(5.0m, updatedHotel.Rating);
}

[Test]
public async Task UpdateHotelRating_MultipleReviews_CalculatesCorrectAverage()
{
    // Arrange
    var hotel = new Hotel { Id = 1, Name = "Test Hotel" };
    var reviews = new List<Review>
    {
        new Review { Id = 1, HotelId = 1, UserId = 1, Rating = 5 },
        new Review { Id = 2, HotelId = 1, UserId = 2, Rating = 4 },
        new Review { Id = 3, HotelId = 1, UserId = 3, Rating = 3 }
    };

    _context.Hotels.Add(hotel);
    _context.Reviews.AddRange(reviews);
    await _context.SaveChangesAsync();

    // Act
    await _reviewService.UpdateHotelRatingAsync(1);

    // Assert
    var updatedHotel = await _context.Hotels.FindAsync(1);
    Assert.Equal(4.0m, updatedHotel.Rating); // (5+4+3)/3 = 4.0
}

[Test]
public async Task SubmitReview_DuplicateReview_ReturnsBadRequest()
{
    // Arrange
    var existingReview = new Review { UserId = 1, HotelId = 1, Rating = 4 };
    _context.Reviews.Add(existingReview);
    await _context.SaveChangesAsync();

    var request = new ReviewRequest { HotelId = 1, Rating = 5 };

    // Act
    var result = await _controller.SubmitReview(request);

    // Assert
    var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
    Assert.Contains("already reviewed", badRequestResult.Value.ToString());
}
```

### Integration Testing

```csharp
[Test]
public async Task ReviewWorkflow_SubmitUpdateDelete_WorksEndToEnd()
{
    // Arrange
    var client = _factory.CreateClient();
    await AuthenticateAsync(client, "guest@example.com", "Guest123!");
    
    // Create completed booking first
    await CreateCompletedBookingAsync(client, 1);

    // Act 1: Submit review
    var reviewRequest = new ReviewRequest
    {
        HotelId = 1,
        Rating = 5,
        Comment = "Great hotel!"
    };

    var submitResponse = await client.PostAsJsonAsync("/api/reviews", reviewRequest);
    submitResponse.EnsureSuccessStatusCode();
    var review = await submitResponse.Content.ReadFromJsonAsync<ReviewResponse>();

    // Act 2: Update review
    var updateRequest = new UpdateReviewRequest
    {
        Rating = 4,
        Comment = "Good hotel, but could be better"
    };

    var updateResponse = await client.PutAsJsonAsync($"/api/reviews/{review.Id}", updateRequest);
    updateResponse.EnsureSuccessStatusCode();
    var updatedReview = await updateResponse.Content.ReadFromJsonAsync<ReviewResponse>();

    // Act 3: Delete review
    var deleteResponse = await client.DeleteAsync($"/api/reviews/{review.Id}");
    deleteResponse.EnsureSuccessStatusCode();

    // Assert
    Assert.Equal(4, updatedReview.Rating);
    Assert.Equal("Good hotel, but could be better", updatedReview.Comment);
    
    // Verify review is deleted
    var getResponse = await client.GetAsync($"/api/reviews/{review.Id}");
    Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Rating not updating after review changes**
   - Check if UpdateHotelRatingAsync is being called
   - Verify database transaction completion
   - Check for exceptions in rating calculation

2. **Users can't submit reviews**
   - Verify user has completed bookings at the hotel
   - Check for existing reviews by the same user
   - Confirm user authentication is working

3. **Review validation failures**
   - Check rating range (1-5)
   - Verify comment length limits
   - Check for prohibited content

### Debug Logging

```csharp
// Enhanced logging for review operations
[HttpPost]
public async Task<ActionResult<ReviewResponse>> SubmitReview(ReviewRequest request)
{
    var userId = GetCurrentUserId();
    
    _logger.LogInformation("User {UserId} attempting to review hotel {HotelId} with rating {Rating}",
        userId, request.HotelId, request.Rating);

    try
    {
        // Check eligibility
        var canReview = await _reviewService.CanUserReviewHotelAsync(userId.Value, request.HotelId);
        if (!canReview)
        {
            _logger.LogWarning("User {UserId} not eligible to review hotel {HotelId}", 
                userId, request.HotelId);
            return BadRequest("You are not eligible to review this hotel");
        }

        // ... review creation logic

        _logger.LogInformation("Successfully created review {ReviewId} for hotel {HotelId}",
            review.Id, request.HotelId);

        return CreatedAtAction(nameof(GetReview), new { id = review.Id }, response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to create review for user {UserId} and hotel {HotelId}",
            userId, request.HotelId);
        throw;
    }
}
```

## 📈 Performance Considerations

### Database Optimization

```csharp
// Efficient review queries with proper indexing
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Review>(entity =>
    {
        // Composite index for hotel reviews
        entity.HasIndex(e => new { e.HotelId, e.CreatedAt })
              .HasDatabaseName("IX_Reviews_Hotel_Date");
              
        // Index for user reviews
        entity.HasIndex(e => new { e.UserId, e.CreatedAt })
              .HasDatabaseName("IX_Reviews_User_Date");
              
        // Index for rating queries
        entity.HasIndex(e => e.Rating)
              .HasDatabaseName("IX_Reviews_Rating");
    });
}

// Optimized hotel rating calculation
public async Task UpdateHotelRatingAsync(int hotelId)
{
    // Use raw SQL for better performance with large datasets
    var averageRating = await _context.Reviews
        .Where(r => r.HotelId == hotelId)
        .AverageAsync(r => (double?)r.Rating) ?? 0;

    await _context.Database.ExecuteSqlRawAsync(
        "UPDATE Hotels SET Rating = {0} WHERE Id = {1}",
        Math.Round(averageRating, 1), hotelId);
}
```

### Caching Strategy

```csharp
// Cache hotel reviews for better performance
public async Task<List<ReviewResponse>> GetHotelReviewsCachedAsync(int hotelId)
{
    var cacheKey = $"hotel_reviews_{hotelId}";
    
    var cachedReviews = await _cache.GetAsync<List<ReviewResponse>>(cacheKey);
    if (cachedReviews != null)
    {
        return cachedReviews;
    }

    var reviews = await GetHotelReviewsFromDatabaseAsync(hotelId);
    await _cache.SetAsync(cacheKey, reviews, TimeSpan.FromMinutes(15));
    
    return reviews;
}

// Invalidate cache when reviews change
private async Task InvalidateReviewCacheAsync(int hotelId)
{
    await _cache.RemoveAsync($"hotel_reviews_{hotelId}");
    await _cache.RemoveAsync($"hotel_rating_{hotelId}");
}
```

## 🔮 Future Enhancements

1. **Advanced Review Features**
   - Photo uploads with reviews
   - Review helpfulness voting
   - Review responses from hotel managers
   - Review moderation workflow

2. **Content Analysis**
   - Sentiment analysis of review comments
   - Automatic content moderation
   - Spam detection algorithms
   - Review authenticity verification

3. **Review Analytics**
   - Review trends over time
   - Competitor rating comparisons
   - Review response rate tracking
   - Customer satisfaction metrics

4. **Enhanced Rating System**
   - Multi-criteria ratings (cleanliness, service, location)
   - Weighted ratings based on reviewer credibility
   - Seasonal rating variations
   - Demographic-based rating insights

## 📚 Related Documentation

- [HOTEL_MODULE.md](HOTEL_MODULE.md) - Hotel rating integration
- [BOOKING_MODULE.md](BOOKING_MODULE.md) - Review eligibility verification
- [AUTH_MODULE.md](AUTH_MODULE.md) - User authentication for reviews
- [API_DOCUMENTATION.md](../finaldestination/API_DOCUMENTATION.md) - Review API endpoints