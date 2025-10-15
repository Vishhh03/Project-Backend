using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinalDestinationAPI.Data;
using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Interfaces;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly HotelContext _context;
    private readonly ICacheService _cache;
    private readonly ILogger<HotelsController> _logger;

    // Cache keys and expiration settings
    private const string HOTELS_CACHE_KEY = "hotels:all";
    private const string HOTEL_CACHE_KEY_PREFIX = "hotel:";
    private const string SEARCH_CACHE_KEY_PREFIX = "hotels:search:";
    private static readonly TimeSpan CacheExpiration = TimeSpan.FromMinutes(10);

    public HotelsController(HotelContext context, ICacheService cache, ILogger<HotelsController> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Gets all hotels with caching (10-minute expiration)
    /// </summary>
    /// <returns>List of all hotels</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Hotel>>> GetHotels()
    {
        _logger.LogInformation("Retrieving all hotels");

        // Try to get from cache first
        var cachedHotels = await _cache.GetAsync<List<Hotel>>(HOTELS_CACHE_KEY);
        if (cachedHotels != null)
        {
            _logger.LogInformation("Hotels retrieved from cache");
            return Ok(cachedHotels);
        }

        // If not in cache, get from database
        var hotels = await _context.Hotels
            .Include(h => h.Manager)
            .ToListAsync();

        // Cache the results
        await _cache.SetAsync(HOTELS_CACHE_KEY, hotels, CacheExpiration);
        _logger.LogInformation("Hotels retrieved from database and cached");

        return Ok(hotels);
    }

    /// <summary>
    /// Gets a specific hotel by ID with caching
    /// </summary>
    /// <param name="id">Hotel ID</param>
    /// <returns>Hotel details</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Hotel>> GetHotel(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Hotel ID must be a positive number.");
        }

        _logger.LogInformation("Retrieving hotel with ID: {HotelId}", id);

        var cacheKey = $"{HOTEL_CACHE_KEY_PREFIX}{id}";
        
        // Try to get from cache first
        var cachedHotel = await _cache.GetAsync<Hotel>(cacheKey);
        if (cachedHotel != null)
        {
            _logger.LogInformation("Hotel {HotelId} retrieved from cache", id);
            return Ok(cachedHotel);
        }

        // If not in cache, get from database
        var hotel = await _context.Hotels
            .Include(h => h.Manager)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (hotel == null)
        {
            _logger.LogWarning("Hotel with ID {HotelId} not found", id);
            return NotFound($"Hotel with ID {id} not found.");
        }

        // Cache the result
        await _cache.SetAsync(cacheKey, hotel, CacheExpiration);
        _logger.LogInformation("Hotel {HotelId} retrieved from database and cached", id);

        return Ok(hotel);
    }

    /// <summary>
    /// Searches hotels by city and/or maximum price with caching
    /// </summary>
    /// <param name="city">City to search in (optional)</param>
    /// <param name="maxPrice">Maximum price per night (optional)</param>
    /// <returns>List of matching hotels</returns>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Hotel>>> SearchHotels(
        [FromQuery] string? city = null, 
        [FromQuery] decimal? maxPrice = null)
    {
        // Validate maxPrice if provided
        if (maxPrice.HasValue && maxPrice.Value < 0)
        {
            return BadRequest("Maximum price cannot be negative.");
        }

        _logger.LogInformation("Searching hotels with city: {City}, maxPrice: {MaxPrice}", city, maxPrice);

        // Create cache key based on search parameters
        var cacheKey = $"{SEARCH_CACHE_KEY_PREFIX}{city?.ToLower() ?? "all"}:{maxPrice?.ToString() ?? "any"}";
        
        // Try to get from cache first
        var cachedResults = await _cache.GetAsync<List<Hotel>>(cacheKey);
        if (cachedResults != null)
        {
            _logger.LogInformation("Search results retrieved from cache");
            return Ok(cachedResults);
        }

        // If not in cache, search in database
        var query = _context.Hotels
            .Include(h => h.Manager)
            .AsQueryable();

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(h => h.City.ToLower().Contains(city.ToLower()));
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(h => h.PricePerNight <= maxPrice.Value);
        }

        var results = await query.ToListAsync();

        // Cache the search results
        await _cache.SetAsync(cacheKey, results, CacheExpiration);
        _logger.LogInformation("Search completed, {Count} hotels found and cached", results.Count);

        return Ok(results);
    }

    /// <summary>
    /// Creates a new hotel (requires HotelManager or Admin role)
    /// </summary>
    /// <param name="request">Hotel creation request</param>
    /// <returns>Created hotel</returns>
    [HttpPost]
    [Authorize(Roles = "HotelManager,Admin")]
    public async Task<ActionResult<Hotel>> CreateHotel([FromBody] CreateHotelRequest request)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid model state for hotel creation: {Errors}", 
                string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            return BadRequest(ModelState);
        }

        _logger.LogInformation("Creating new hotel: {HotelName} in {City}", request.Name, request.City);

        // Check if manager exists if ManagerId is provided
        if (request.ManagerId.HasValue)
        {
            var managerExists = await _context.Users
                .AnyAsync(u => u.Id == request.ManagerId.Value && u.Role == UserRole.HotelManager);
            
            if (!managerExists)
            {
                return BadRequest($"Manager with ID {request.ManagerId} not found or is not a HotelManager.");
            }
        }

        // Create hotel entity from request
        var hotel = new Hotel
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            PricePerNight = request.PricePerNight,
            AvailableRooms = request.AvailableRooms,
            Rating = request.Rating,
            ManagerId = request.ManagerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();

        // Invalidate relevant caches
        await InvalidateHotelCaches();

        _logger.LogInformation("Hotel created successfully with ID: {HotelId}", hotel.Id);

        return CreatedAtAction(nameof(GetHotel), new { id = hotel.Id }, hotel);
    }

    /// <summary>
    /// Updates an existing hotel (requires HotelManager or Admin role)
    /// </summary>
    /// <param name="id">Hotel ID</param>
    /// <param name="request">Hotel update request</param>
    /// <returns>No content on success</returns>
    [HttpPut("{id}")]
    [Authorize(Roles = "HotelManager,Admin")]
    public async Task<IActionResult> UpdateHotel(int id, [FromBody] UpdateHotelRequest request)
    {
        if (id <= 0)
        {
            return BadRequest("Hotel ID must be a positive number.");
        }

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Invalid model state for hotel update: {Errors}", 
                string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
            return BadRequest(ModelState);
        }

        _logger.LogInformation("Updating hotel with ID: {HotelId}", id);

        // Check if hotel exists
        var existingHotel = await _context.Hotels.FindAsync(id);
        if (existingHotel == null)
        {
            _logger.LogWarning("Hotel with ID {HotelId} not found for update", id);
            return NotFound($"Hotel with ID {id} not found.");
        }

        // Check if manager exists if ManagerId is provided
        if (request.ManagerId.HasValue)
        {
            var managerExists = await _context.Users
                .AnyAsync(u => u.Id == request.ManagerId.Value && u.Role == UserRole.HotelManager);
            
            if (!managerExists)
            {
                return BadRequest($"Manager with ID {request.ManagerId} not found or is not a HotelManager.");
            }
        }

        // Update hotel properties
        existingHotel.Name = request.Name.Trim();
        existingHotel.Address = request.Address.Trim();
        existingHotel.City = request.City.Trim();
        existingHotel.PricePerNight = request.PricePerNight;
        existingHotel.AvailableRooms = request.AvailableRooms;
        existingHotel.Rating = request.Rating;
        existingHotel.ManagerId = request.ManagerId;

        try
        {
            await _context.SaveChangesAsync();
            
            // Invalidate relevant caches
            await InvalidateHotelCaches();
            await _cache.RemoveAsync($"{HOTEL_CACHE_KEY_PREFIX}{id}");

            _logger.LogInformation("Hotel {HotelId} updated successfully", id);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await HotelExistsAsync(id))
            {
                return NotFound($"Hotel with ID {id} not found.");
            }
            throw;
        }

        return NoContent();
    }

    /// <summary>
    /// Deletes a hotel (requires Admin role)
    /// </summary>
    /// <param name="id">Hotel ID</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHotel(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Hotel ID must be a positive number.");
        }

        _logger.LogInformation("Attempting to delete hotel with ID: {HotelId}", id);

        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null)
        {
            _logger.LogWarning("Hotel with ID {HotelId} not found for deletion", id);
            return NotFound($"Hotel with ID {id} not found.");
        }

        // Check if hotel has active bookings
        var hasActiveBookings = await _context.Bookings
            .AnyAsync(b => b.HotelId == id && b.Status == BookingStatus.Confirmed);

        if (hasActiveBookings)
        {
            _logger.LogWarning("Cannot delete hotel {HotelId} - has active bookings", id);
            return BadRequest("Cannot delete hotel with active bookings. Please cancel all bookings first.");
        }

        _context.Hotels.Remove(hotel);
        await _context.SaveChangesAsync();

        // Invalidate relevant caches
        await InvalidateHotelCaches();
        await _cache.RemoveAsync($"{HOTEL_CACHE_KEY_PREFIX}{id}");

        _logger.LogInformation("Hotel {HotelId} deleted successfully", id);

        return NoContent();
    }

    /// <summary>
    /// Invalidates all hotel-related caches
    /// </summary>
    private async Task InvalidateHotelCaches()
    {
        await _cache.RemoveAsync(HOTELS_CACHE_KEY);
        await _cache.RemoveByPatternAsync($"{SEARCH_CACHE_KEY_PREFIX}*");
        _logger.LogInformation("Hotel caches invalidated");
    }

    /// <summary>
    /// Checks if a hotel exists asynchronously
    /// </summary>
    /// <param name="id">Hotel ID</param>
    /// <returns>True if hotel exists, false otherwise</returns>
    private async Task<bool> HotelExistsAsync(int id)
    {
        return await _context.Hotels.AnyAsync(e => e.Id == id);
    }
}




