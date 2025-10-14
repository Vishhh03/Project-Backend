# Hotel Management Module Documentation

**Team**: Hotel Management Team  
**Module Owner**: Hotel Operations & Search System  
**Last Updated**: December 2024

## 📋 Module Overview

The Hotel Management module handles all hotel-related operations including CRUD operations, search functionality, caching, and hotel data management. This module serves as the core business logic for hotel inventory management and provides optimized search capabilities for guests.

## 🎯 Module Responsibilities

- Hotel CRUD operations (Create, Read, Update, Delete)
- Advanced hotel search and filtering
- Hotel data caching for performance
- Hotel rating calculations
- Manager-specific hotel access control
- Hotel availability management

## 🏗️ Module Architecture

```
Hotel Management Module
├── Controllers/
│   └── HotelsController.cs       # Hotel API endpoints
├── Services/
│   └── CacheService.cs          # Caching implementation
├── Models/
│   └── Hotel.cs                 # Hotel entity
├── DTOs/
│   ├── CreateHotelRequest.cs    # Hotel creation input
│   ├── UpdateHotelRequest.cs    # Hotel update input
│   └── HotelResponse.cs         # Hotel output (implicit)
├── Configuration/
│   └── CacheSettings.cs         # Cache configuration
└── Data/
    └── HotelContext.cs          # Database context (shared)
```

## 🔧 Key Components

### 1. HotelsController.cs

**Purpose**: Handles all hotel-related HTTP requests with caching and authorization

```csharp
[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly HotelContext _context;
    private readonly ICacheService _cache;
    private readonly ILogger<HotelsController> _logger;

    // GET /api/hotels - Cached for 10 minutes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Hotel>>> GetHotels()
    {
        const string cacheKey = "hotels_all";
        
        var cachedHotels = await _cache.GetAsync<List<Hotel>>(cacheKey);
        if (cachedHotels != null)
        {
            _logger.LogInformation("Returning cached hotels");
            return Ok(cachedHotels);
        }

        var hotels = await _context.Hotels.ToListAsync();
        await _cache.SetAsync(cacheKey, hotels, TimeSpan.FromMinutes(10));
        
        _logger.LogInformation("Fetched {Count} hotels from database", hotels.Count);
        return Ok(hotels);
    }

    // GET /api/hotels/search?city=Miami&maxPrice=200&minRating=4.0
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Hotel>>> SearchHotels(
        [FromQuery] string? city,
        [FromQuery] decimal? maxPrice,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? minRating)
    {
        var cacheKey = $"hotels_search_{city}_{maxPrice}_{minPrice}_{minRating}";
        
        var cachedResults = await _cache.GetAsync<List<Hotel>>(cacheKey);
        if (cachedResults != null)
        {
            return Ok(cachedResults);
        }

        var query = _context.Hotels.AsQueryable();

        if (!string.IsNullOrEmpty(city))
            query = query.Where(h => h.City.ToLower().Contains(city.ToLower()));

        if (maxPrice.HasValue)
            query = query.Where(h => h.PricePerNight <= maxPrice.Value);

        if (minPrice.HasValue)
            query = query.Where(h => h.PricePerNight >= minPrice.Value);

        if (minRating.HasValue)
            query = query.Where(h => h.Rating >= minRating.Value);

        var results = await query.ToListAsync();
        await _cache.SetAsync(cacheKey, results, TimeSpan.FromMinutes(5));

        return Ok(results);
    }

    // POST /api/hotels - Requires HotelManager or Admin role
    [HttpPost]
    [Authorize(Roles = "HotelManager,Admin")]
    public async Task<ActionResult<Hotel>> CreateHotel(CreateHotelRequest request)
    
    // PUT /api/hotels/{id} - Requires HotelManager or Admin role
    [HttpPut("{id}")]
    [Authorize(Roles = "HotelManager,Admin")]
    public async Task<IActionResult> UpdateHotel(int id, UpdateHotelRequest request)
    
    // DELETE /api/hotels/{id} - Requires Admin role only
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHotel(int id)
}
```

**Why This Design**:
- **Caching Strategy**: Reduces database load for frequently accessed data
- **Search Optimization**: Efficient LINQ queries with proper indexing
- **Role-based Security**: Different permissions for different operations
- **Cache Invalidation**: Automatic cache clearing on data modifications

### 2. Hotel Model

**Purpose**: Represents hotel entity with all business properties

```csharp
public class Hotel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int AvailableRooms { get; set; }
    public decimal Rating { get; set; }
    public int? ManagerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User? Manager { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
```

**Design Decisions**:
- **Decimal for pricing**: Precise financial calculations
- **City-based search**: Optimized for location-based queries
- **Manager relationship**: Links hotels to managing users
- **Navigation properties**: EF Core relationships for related data
- **Available rooms**: Simple integer for room inventory

### 3. CacheService.cs

**Purpose**: Provides high-performance caching for hotel data

```csharp
public class CacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _settings;
    private readonly ILogger<CacheService> _logger;

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        var value = _cache.Get<T>(key);
        _logger.LogDebug("Cache {Action} for key: {Key}", 
            value != null ? "HIT" : "MISS", key);
        return value;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) 
        where T : class
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? 
                TimeSpan.FromMinutes(_settings.DefaultExpirationMinutes),
            SlidingExpiration = TimeSpan.FromMinutes(5),
            Priority = CacheItemPriority.Normal
        };

        _cache.Set(key, value, options);
        _logger.LogDebug("Cache SET for key: {Key}, Expiration: {Expiration}", 
            key, options.AbsoluteExpirationRelativeToNow);
    }

    public async Task RemoveAsync(string key)
    {
        _cache.Remove(key);
        _logger.LogDebug("Cache REMOVE for key: {Key}", key);
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        // Implementation for pattern-based cache invalidation
        // Used when hotels are modified to clear related caches
    }
}
```

**Why Memory Caching**:
- **Performance**: Sub-millisecond access times
- **Simplicity**: No external dependencies
- **Cost-effective**: No additional infrastructure
- **Automatic cleanup**: Built-in expiration and memory management

## 🔍 Search Implementation

### Advanced Search Logic

```csharp
public async Task<ActionResult<IEnumerable<Hotel>>> SearchHotels(
    string? city, decimal? maxPrice, decimal? minPrice, decimal? minRating)
{
    // Build cache key from all parameters
    var cacheKey = $"hotels_search_{city}_{maxPrice}_{minPrice}_{minRating}";
    
    // Try cache first
    var cachedResults = await _cache.GetAsync<List<Hotel>>(cacheKey);
    if (cachedResults != null)
    {
        _logger.LogInformation("Returning cached search results for: {CacheKey}", cacheKey);
        return Ok(cachedResults);
    }

    // Build dynamic query
    var query = _context.Hotels.AsQueryable();

    // City filter (case-insensitive partial match)
    if (!string.IsNullOrEmpty(city))
    {
        query = query.Where(h => h.City.ToLower().Contains(city.ToLower()));
    }

    // Price range filters
    if (maxPrice.HasValue)
    {
        query = query.Where(h => h.PricePerNight <= maxPrice.Value);
    }

    if (minPrice.HasValue)
    {
        query = query.Where(h => h.PricePerNight >= minPrice.Value);
    }

    // Rating filter
    if (minRating.HasValue)
    {
        query = query.Where(h => h.Rating >= minRating.Value);
    }

    // Execute query and cache results
    var results = await query.OrderBy(h => h.PricePerNight).ToListAsync();
    
    // Cache search results for 5 minutes (shorter than full list)
    await _cache.SetAsync(cacheKey, results, TimeSpan.FromMinutes(5));

    _logger.LogInformation("Search returned {Count} hotels for city: {City}, " +
        "price range: {MinPrice}-{MaxPrice}, min rating: {MinRating}", 
        results.Count, city, minPrice, maxPrice, minRating);

    return Ok(results);
}
```

**Search Features**:
- **Flexible filtering**: Multiple optional parameters
- **Case-insensitive**: City search works with any case
- **Range queries**: Price and rating ranges
- **Caching**: Search results cached separately
- **Sorting**: Results ordered by price

### Database Indexing Strategy

```csharp
// In HotelContext.OnModelCreating()
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Hotel>(entity =>
    {
        // Primary key index (automatic)
        entity.HasKey(e => e.Id);
        
        // Search optimization indexes
        entity.HasIndex(e => e.City)
              .HasDatabaseName("IX_Hotels_City");
              
        entity.HasIndex(e => e.PricePerNight)
              .HasDatabaseName("IX_Hotels_Price");
              
        entity.HasIndex(e => e.Rating)
              .HasDatabaseName("IX_Hotels_Rating");
              
        // Composite index for common search combinations
        entity.HasIndex(e => new { e.City, e.PricePerNight })
              .HasDatabaseName("IX_Hotels_City_Price");

        // Property configurations
        entity.Property(e => e.PricePerNight)
              .HasPrecision(10, 2);
              
        entity.Property(e => e.Rating)
              .HasPrecision(3, 2);
              
        entity.Property(e => e.Name)
              .HasMaxLength(200)
              .IsRequired();
              
        entity.Property(e => e.City)
              .HasMaxLength(100)
              .IsRequired();
    });
}
```

## 🔗 Integration Points

### With Other Modules

1. **Authentication Module**: Role-based access control
2. **Booking Module**: Hotel availability and booking relationships
3. **Review Module**: Hotel rating calculations
4. **Data Module**: Entity Framework relationships

### Rating Calculation Integration

```csharp
// Automatic rating update when reviews change
public async Task UpdateHotelRating(int hotelId)
{
    var hotel = await _context.Hotels
        .Include(h => h.Reviews)
        .FirstOrDefaultAsync(h => h.Id == hotelId);
        
    if (hotel != null && hotel.Reviews.Any())
    {
        hotel.Rating = hotel.Reviews.Average(r => r.Rating);
        await _context.SaveChangesAsync();
        
        // Invalidate hotel caches
        await _cache.RemoveByPatternAsync($"hotels_");
        
        _logger.LogInformation("Updated rating for hotel {HotelId} to {Rating}", 
            hotelId, hotel.Rating);
    }
}
```

### Cache Invalidation Strategy

```csharp
// Called after hotel modifications
private async Task InvalidateHotelCaches()
{
    // Clear all hotel-related caches
    await _cache.RemoveAsync("hotels_all");
    await _cache.RemoveByPatternAsync("hotels_search_");
    
    _logger.LogInformation("Invalidated hotel caches after data modification");
}

// In CreateHotel, UpdateHotel, DeleteHotel methods
await _context.SaveChangesAsync();
await InvalidateHotelCaches();
```

## ⚙️ Configuration

### Cache Settings

```csharp
public class CacheSettings
{
    public int DefaultExpirationMinutes { get; set; } = 30;
    public int HotelCacheExpirationMinutes { get; set; } = 10;
    public int SearchCacheExpirationMinutes { get; set; } = 5;
    public bool EnableCaching { get; set; } = true;
}
```

### Configuration in appsettings.json

```json
{
  "Cache": {
    "DefaultExpirationMinutes": 30,
    "HotelCacheExpirationMinutes": 10,
    "SearchCacheExpirationMinutes": 5,
    "EnableCaching": true
  }
}
```

### Service Registration

```csharp
// Program.cs
builder.Services.Configure<CacheSettings>(
    builder.Configuration.GetSection("Cache"));
    
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ICacheService, CacheService>();
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task GetHotels_WithCache_ReturnsCachedData()
{
    // Arrange
    var cachedHotels = new List<Hotel> { new Hotel { Id = 1, Name = "Test Hotel" } };
    _mockCache.Setup(c => c.GetAsync<List<Hotel>>("hotels_all"))
             .ReturnsAsync(cachedHotels);

    // Act
    var result = await _controller.GetHotels();

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result.Result);
    var hotels = Assert.IsType<List<Hotel>>(okResult.Value);
    Assert.Single(hotels);
    Assert.Equal("Test Hotel", hotels[0].Name);
}

[Test]
public async Task SearchHotels_ByCity_ReturnsFilteredResults()
{
    // Arrange
    var hotels = new List<Hotel>
    {
        new Hotel { Id = 1, Name = "Miami Hotel", City = "Miami" },
        new Hotel { Id = 2, Name = "New York Hotel", City = "New York" }
    };
    
    _context.Hotels.AddRange(hotels);
    await _context.SaveChangesAsync();

    // Act
    var result = await _controller.SearchHotels("Miami", null, null, null);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result.Result);
    var filteredHotels = Assert.IsType<List<Hotel>>(okResult.Value);
    Assert.Single(filteredHotels);
    Assert.Equal("Miami Hotel", filteredHotels[0].Name);
}
```

### Performance Testing

```csharp
[Test]
public async Task SearchHotels_LargeDataset_PerformsWithinTimeout()
{
    // Arrange - Create 10,000 test hotels
    var hotels = Enumerable.Range(1, 10000)
        .Select(i => new Hotel 
        { 
            Id = i, 
            Name = $"Hotel {i}", 
            City = $"City {i % 100}",
            PricePerNight = i % 500 + 50
        }).ToList();
    
    _context.Hotels.AddRange(hotels);
    await _context.SaveChangesAsync();

    // Act & Assert
    var stopwatch = Stopwatch.StartNew();
    var result = await _controller.SearchHotels("City 1", 200, 50, null);
    stopwatch.Stop();

    Assert.True(stopwatch.ElapsedMilliseconds < 1000, 
        $"Search took {stopwatch.ElapsedMilliseconds}ms, expected < 1000ms");
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Slow search performance**
   - Check database indexes on City, PricePerNight, Rating
   - Verify cache is enabled and working
   - Monitor query execution plans

2. **Cache not working**
   - Check CacheSettings configuration
   - Verify IMemoryCache is registered
   - Check cache key generation logic

3. **Stale data in cache**
   - Verify cache invalidation after updates
   - Check cache expiration settings
   - Monitor cache hit/miss ratios

### Debug Logging

```csharp
// Add to appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "HotelsController": "Debug",
      "CacheService": "Debug",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

### Performance Monitoring

```csharp
// Add performance logging
[HttpGet("search")]
public async Task<ActionResult<IEnumerable<Hotel>>> SearchHotels(...)
{
    using var activity = _logger.BeginScope("Hotel search operation");
    var stopwatch = Stopwatch.StartNew();
    
    try
    {
        // ... search logic
        
        _logger.LogInformation("Hotel search completed in {ElapsedMs}ms, " +
            "returned {Count} results", stopwatch.ElapsedMilliseconds, results.Count);
            
        return Ok(results);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Hotel search failed after {ElapsedMs}ms", 
            stopwatch.ElapsedMilliseconds);
        throw;
    }
}
```

## 📈 Performance Optimizations

### 1. Database Query Optimization

```csharp
// Use projection for list views to reduce data transfer
public async Task<ActionResult<IEnumerable<HotelSummary>>> GetHotelSummaries()
{
    var summaries = await _context.Hotels
        .Select(h => new HotelSummary
        {
            Id = h.Id,
            Name = h.Name,
            City = h.City,
            PricePerNight = h.PricePerNight,
            Rating = h.Rating
        })
        .ToListAsync();
        
    return Ok(summaries);
}
```

### 2. Pagination for Large Results

```csharp
[HttpGet]
public async Task<ActionResult<PagedResult<Hotel>>> GetHotels(
    [FromQuery] int page = 1, 
    [FromQuery] int pageSize = 20)
{
    var totalCount = await _context.Hotels.CountAsync();
    var hotels = await _context.Hotels
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    var result = new PagedResult<Hotel>
    {
        Items = hotels,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize
    };

    return Ok(result);
}
```

### 3. Async/Await Best Practices

```csharp
// Correct: ConfigureAwait(false) for library code
public async Task<Hotel?> GetHotelByIdAsync(int id)
{
    return await _context.Hotels
        .FirstOrDefaultAsync(h => h.Id == id)
        .ConfigureAwait(false);
}

// Correct: Parallel operations where possible
public async Task<HotelStatistics> GetHotelStatisticsAsync(int hotelId)
{
    var hotelTask = _context.Hotels.FindAsync(hotelId);
    var bookingCountTask = _context.Bookings.CountAsync(b => b.HotelId == hotelId);
    var reviewCountTask = _context.Reviews.CountAsync(r => r.HotelId == hotelId);

    await Task.WhenAll(hotelTask.AsTask(), bookingCountTask, reviewCountTask);

    return new HotelStatistics
    {
        Hotel = await hotelTask,
        BookingCount = await bookingCountTask,
        ReviewCount = await reviewCountTask
    };
}
```

## 🔮 Future Enhancements

1. **Advanced Search Features**
   - Full-text search with Elasticsearch
   - Geolocation-based search
   - Amenity-based filtering
   - Availability-based search

2. **Caching Improvements**
   - Redis for distributed caching
   - Cache warming strategies
   - Smart cache invalidation

3. **Performance Enhancements**
   - Database read replicas
   - CDN for hotel images
   - Search result pre-computation

4. **Business Features**
   - Hotel image management
   - Amenity management
   - Room type management
   - Seasonal pricing

## 📚 Related Documentation

- [BOOKING_MODULE.md](BOOKING_MODULE.md) - Hotel-booking relationships
- [REVIEW_MODULE.md](REVIEW_MODULE.md) - Hotel rating calculations
- [DATA_MODULE.md](DATA_MODULE.md) - Hotel entity configuration
- [API_DOCUMENTATION.md](../finaldestination/API_DOCUMENTATION.md) - Hotel API endpoints