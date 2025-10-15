namespace FinalDestinationAPI.Interfaces;

/// <summary>
/// Interface for caching operations with configurable expiration and pattern-based removal
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Retrieves a cached value by key
    /// </summary>
    /// <typeparam name="T">Type of the cached object</typeparam>
    /// <param name="key">Cache key</param>
    /// <returns>Cached value or null if not found</returns>
    Task<T?> GetAsync<T>(string key) where T : class;

    /// <summary>
    /// Sets a value in cache with optional expiration
    /// </summary>
    /// <typeparam name="T">Type of the object to cache</typeparam>
    /// <param name="key">Cache key</param>
    /// <param name="value">Value to cache</param>
    /// <param name="expiration">Optional expiration time (defaults to 30 minutes)</param>
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;

    /// <summary>
    /// Removes a specific cache entry by key
    /// </summary>
    /// <param name="key">Cache key to remove</param>
    Task RemoveAsync(string key);

    /// <summary>
    /// Removes cache entries matching a pattern (e.g., "hotels:*")
    /// </summary>
    /// <param name="pattern">Pattern to match cache keys</param>
    Task RemoveByPatternAsync(string pattern);

    /// <summary>
    /// Checks if a cache key exists
    /// </summary>
    /// <param name="key">Cache key to check</param>
    /// <returns>True if key exists, false otherwise</returns>
    Task<bool> ExistsAsync(string key);
}




