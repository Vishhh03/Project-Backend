using Microsoft.Extensions.Caching.Memory;
using FinalDestinationAPI.Interfaces;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace FinalDestinationAPI.Services;

/// <summary>
/// Memory cache service implementation with configurable expiration and pattern-based removal
/// </summary>
public class CacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CacheService> _logger;
    
    // Thread-safe collection to track cache keys for pattern-based removal
    private readonly ConcurrentDictionary<string, byte> _cacheKeys = new();

    public CacheService(IMemoryCache cache, ILogger<CacheService> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves a cached value by key
    /// </summary>
    public Task<T?> GetAsync<T>(string key) where T : class
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            _logger.LogWarning("Cache GET attempted with null or empty key");
            return Task.FromResult<T?>(null);
        }

        var value = _cache.Get<T>(key);
        var hitOrMiss = value != null ? "HIT" : "MISS";
        
        _logger.LogDebug("Cache {Action} for key: {Key}", hitOrMiss, key);
        
        return Task.FromResult(value);
    }

    /// <summary>
    /// Sets a value in cache with optional expiration
    /// </summary>
    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            _logger.LogWarning("Cache SET attempted with null or empty key");
            return Task.CompletedTask;
        }

        if (value == null)
        {
            _logger.LogWarning("Cache SET attempted with null value for key: {Key}", key);
            return Task.CompletedTask;
        }

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(30),
            SlidingExpiration = TimeSpan.FromMinutes(5),
            Priority = CacheItemPriority.Normal
        };

        // Add callback to remove key from tracking when item is evicted
        options.RegisterPostEvictionCallback((evictedKey, evictedValue, reason, state) =>
        {
            if (evictedKey is string keyStr)
            {
                _cacheKeys.TryRemove(keyStr, out _);
                _logger.LogDebug("Cache key {Key} evicted due to {Reason}", keyStr, reason);
            }
        });

        _cache.Set(key, value, options);
        _cacheKeys.TryAdd(key, 0); // Track the key for pattern-based removal
        
        _logger.LogDebug("Cache SET for key: {Key} with expiration: {Expiration}", 
            key, expiration?.ToString() ?? "30 minutes (default)");
        
        return Task.CompletedTask;
    }

    /// <summary>
    /// Removes a specific cache entry by key
    /// </summary>
    public Task RemoveAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            _logger.LogWarning("Cache REMOVE attempted with null or empty key");
            return Task.CompletedTask;
        }

        _cache.Remove(key);
        _cacheKeys.TryRemove(key, out _);
        
        _logger.LogDebug("Cache REMOVE for key: {Key}", key);
        
        return Task.CompletedTask;
    }

    /// <summary>
    /// Removes cache entries matching a pattern (e.g., "hotels:*")
    /// </summary>
    public Task RemoveByPatternAsync(string pattern)
    {
        if (string.IsNullOrWhiteSpace(pattern))
        {
            _logger.LogWarning("Cache REMOVE BY PATTERN attempted with null or empty pattern");
            return Task.CompletedTask;
        }

        try
        {
            // Convert wildcard pattern to regex
            var regexPattern = "^" + Regex.Escape(pattern).Replace("\\*", ".*") + "$";
            var regex = new Regex(regexPattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);

            var keysToRemove = _cacheKeys.Keys.Where(key => regex.IsMatch(key)).ToList();
            var removedCount = 0;

            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
                _cacheKeys.TryRemove(key, out _);
                removedCount++;
            }

            _logger.LogDebug("Cache REMOVE BY PATTERN '{Pattern}' removed {Count} keys", pattern, removedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entries by pattern: {Pattern}", pattern);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Checks if a cache key exists
    /// </summary>
    public Task<bool> ExistsAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return Task.FromResult(false);
        }

        var exists = _cache.TryGetValue(key, out _);
        
        _logger.LogDebug("Cache EXISTS check for key: {Key} - {Result}", key, exists);
        
        return Task.FromResult(exists);
    }
}




