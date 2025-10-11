using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Interfaces;
using System.Security.Claims;

namespace FinalDestinationAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
    {
        _reviewService = reviewService;
        _logger = logger;
    }

    /// <summary>
    /// Get all reviews for a specific hotel with pagination
    /// </summary>
    /// <param name="hotelId">Hotel ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 10, max: 50)</param>
    /// <returns>List of reviews for the hotel</returns>
    [HttpGet("hotel/{hotelId}")]
    public async Task<ActionResult<IEnumerable<ReviewResponse>>> GetReviewsByHotel(
        int hotelId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        try
        {
            // Validate pagination parameters
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 10;

            var reviews = await _reviewService.GetReviewsByHotelAsync(hotelId, page, pageSize);
            var reviewCount = await _reviewService.GetReviewCountByHotelAsync(hotelId);
            var averageRating = await _reviewService.CalculateHotelRatingAsync(hotelId);

            Response.Headers["X-Total-Count"] = reviewCount.ToString();
            Response.Headers["X-Average-Rating"] = averageRating.ToString("F2");
            Response.Headers["X-Page"] = page.ToString();
            Response.Headers["X-Page-Size"] = pageSize.ToString();

            return Ok(reviews);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reviews for hotel {HotelId}", hotelId);
            return StatusCode(500, new { message = "An error occurred while retrieving reviews" });
        }
    }

    /// <summary>
    /// Get a specific review by ID
    /// </summary>
    /// <param name="id">Review ID</param>
    /// <returns>Review details</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<ReviewResponse>> GetReview(int id)
    {
        try
        {
            var review = await _reviewService.GetReviewAsync(id);
            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            return Ok(review);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the review" });
        }
    }

    /// <summary>
    /// Get all reviews by the current authenticated user
    /// </summary>
    /// <returns>List of user's reviews</returns>
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ReviewResponse>>> GetMyReviews()
    {
        try
        {
            var userId = GetCurrentUserId();
            var reviews = await _reviewService.GetReviewsByUserAsync(userId);
            return Ok(reviews);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reviews for current user");
            return StatusCode(500, new { message = "An error occurred while retrieving your reviews" });
        }
    }

    /// <summary>
    /// Create a new review for a hotel
    /// </summary>
    /// <param name="request">Review details</param>
    /// <returns>Created review</returns>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> CreateReview(ReviewRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            var review = await _reviewService.CreateReviewAsync(userId, request);
            
            return CreatedAtAction(nameof(GetReview), new { id = review.Id }, review);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating review for hotel {HotelId}", request.HotelId);
            return StatusCode(500, new { message = "An error occurred while creating the review" });
        }
    }

    /// <summary>
    /// Update an existing review
    /// </summary>
    /// <param name="id">Review ID</param>
    /// <param name="request">Updated review details</param>
    /// <returns>Updated review</returns>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> UpdateReview(int id, UpdateReviewRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            var review = await _reviewService.UpdateReviewAsync(id, userId, request);
            
            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            return Ok(review);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the review" });
        }
    }

    /// <summary>
    /// Delete a review
    /// </summary>
    /// <param name="id">Review ID</param>
    /// <returns>No content if successful</returns>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var deleted = await _reviewService.DeleteReviewAsync(id, userId);
            
            if (!deleted)
            {
                return NotFound(new { message = "Review not found" });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review {ReviewId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the review" });
        }
    }

    /// <summary>
    /// Get hotel rating statistics
    /// </summary>
    /// <param name="hotelId">Hotel ID</param>
    /// <returns>Rating statistics</returns>
    [HttpGet("hotel/{hotelId}/stats")]
    public async Task<ActionResult<object>> GetHotelRatingStats(int hotelId)
    {
        try
        {
            var averageRating = await _reviewService.CalculateHotelRatingAsync(hotelId);
            var reviewCount = await _reviewService.GetReviewCountByHotelAsync(hotelId);

            return Ok(new
            {
                hotelId,
                averageRating,
                reviewCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rating stats for hotel {HotelId}", hotelId);
            return StatusCode(500, new { message = "An error occurred while retrieving rating statistics" });
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}




