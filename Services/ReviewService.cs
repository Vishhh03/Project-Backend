using Microsoft.EntityFrameworkCore;
using FinalDestinationAPI.Data;
using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Interfaces;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Services;

public class ReviewService : IReviewService
{
    private readonly HotelContext _context;
    private readonly ICacheService _cache;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(HotelContext context, ICacheService cache, ILogger<ReviewService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ReviewResponse> CreateReviewAsync(int userId, ReviewRequest request)
    {
        // Check if hotel exists
        var hotel = await _context.Hotels.FindAsync(request.HotelId);
        if (hotel == null)
        {
            throw new ArgumentException("Hotel not found");
        }

        // Check if user already reviewed this hotel
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == userId && r.HotelId == request.HotelId);
        
        if (existingReview != null)
        {
            throw new InvalidOperationException("You have already reviewed this hotel");
        }

        var review = new Review
        {
            UserId = userId,
            HotelId = request.HotelId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // Update hotel rating
        await UpdateHotelRatingAsync(request.HotelId);

        // Clear cache for hotel reviews and hotel data
        await _cache.RemoveAsync($"hotel_reviews_{request.HotelId}");
        await _cache.RemoveAsync($"hotel_rating_{request.HotelId}");
        await _cache.RemoveAsync($"hotel:{request.HotelId}");
        await _cache.RemoveAsync("hotels:all");
        await _cache.RemoveByPatternAsync("hotels:search:*");

        _logger.LogInformation("Review created for hotel {HotelId} by user {UserId}", request.HotelId, userId);

        return await GetReviewResponseAsync(review.Id);
    }

    public async Task<ReviewResponse?> GetReviewAsync(int id)
    {
        return await GetReviewResponseAsync(id);
    }

    public async Task<IEnumerable<ReviewResponse>> GetReviewsByHotelAsync(int hotelId, int page = 1, int pageSize = 10)
    {
        var cacheKey = $"hotel_reviews_{hotelId}_page_{page}_size_{pageSize}";
        var cachedReviews = await _cache.GetAsync<IEnumerable<ReviewResponse>>(cacheKey);
        
        if (cachedReviews != null)
        {
            return cachedReviews;
        }

        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Hotel)
            .Where(r => r.HotelId == hotelId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReviewResponse
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User.Name,
                HotelId = r.HotelId,
                HotelName = r.Hotel.Name,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        await _cache.SetAsync(cacheKey, reviews, TimeSpan.FromMinutes(10));
        return reviews;
    }

    public async Task<IEnumerable<ReviewResponse>> GetReviewsByUserAsync(int userId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Hotel)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User.Name,
                HotelId = r.HotelId,
                HotelName = r.Hotel.Name,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return reviews;
    }

    public async Task<ReviewResponse?> UpdateReviewAsync(int id, int userId, UpdateReviewRequest request)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return null;
        }

        // Check if the review belongs to the user
        if (review.UserId != userId)
        {
            throw new UnauthorizedAccessException("You can only update your own reviews");
        }

        review.Rating = request.Rating;
        review.Comment = request.Comment;

        await _context.SaveChangesAsync();

        // Update hotel rating
        await UpdateHotelRatingAsync(review.HotelId);

        // Clear cache for hotel reviews and hotel data
        await _cache.RemoveAsync($"hotel_reviews_{review.HotelId}");
        await _cache.RemoveAsync($"hotel_rating_{review.HotelId}");
        await _cache.RemoveAsync($"hotel:{review.HotelId}");
        await _cache.RemoveAsync("hotels:all");
        await _cache.RemoveByPatternAsync("hotels:search:*");

        _logger.LogInformation("Review {ReviewId} updated by user {UserId}", id, userId);

        return await GetReviewResponseAsync(id);
    }

    public async Task<bool> DeleteReviewAsync(int id, int userId)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return false;
        }

        // Check if the review belongs to the user
        if (review.UserId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own reviews");
        }

        var hotelId = review.HotelId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        // Update hotel rating
        await UpdateHotelRatingAsync(hotelId);

        // Clear cache for hotel reviews and hotel data
        await _cache.RemoveAsync($"hotel_reviews_{hotelId}");
        await _cache.RemoveAsync($"hotel_rating_{hotelId}");
        await _cache.RemoveAsync($"hotel:{hotelId}");
        await _cache.RemoveAsync("hotels:all");
        await _cache.RemoveByPatternAsync("hotels:search:*");

        _logger.LogInformation("Review {ReviewId} deleted by user {UserId}", id, userId);

        return true;
    }

    public async Task<decimal> CalculateHotelRatingAsync(int hotelId)
    {
        var cacheKey = $"hotel_rating_{hotelId}";
        var cachedRating = await _cache.GetAsync<string>(cacheKey);
        
        if (cachedRating != null && decimal.TryParse(cachedRating, out var rating))
        {
            return rating;
        }

        var reviews = await _context.Reviews
            .Where(r => r.HotelId == hotelId)
            .ToListAsync();

        if (!reviews.Any())
        {
            return 0;
        }

        var averageRating = Math.Round((decimal)reviews.Average(r => r.Rating), 2);
        
        await _cache.SetAsync(cacheKey, averageRating.ToString(), TimeSpan.FromMinutes(30));
        return averageRating;
    }

    public async Task<int> GetReviewCountByHotelAsync(int hotelId)
    {
        return await _context.Reviews.CountAsync(r => r.HotelId == hotelId);
    }

    private async Task<ReviewResponse> GetReviewResponseAsync(int reviewId)
    {
        var review = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == reviewId);

        if (review == null)
        {
            throw new ArgumentException("Review not found");
        }

        return new ReviewResponse
        {
            Id = review.Id,
            UserId = review.UserId,
            UserName = review.User.Name,
            HotelId = review.HotelId,
            HotelName = review.Hotel.Name,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    private async Task UpdateHotelRatingAsync(int hotelId)
    {
        var newRating = await CalculateHotelRatingAsync(hotelId);
        var reviewCount = await GetReviewCountByHotelAsync(hotelId);
        var hotel = await _context.Hotels.FindAsync(hotelId);
        
        if (hotel != null)
        {
            hotel.Rating = newRating;
            hotel.ReviewCount = reviewCount;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Updated hotel {HotelId} rating to {Rating} with {ReviewCount} reviews", 
                hotelId, newRating, reviewCount);
        }
    }
}




