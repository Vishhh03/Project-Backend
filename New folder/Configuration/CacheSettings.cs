namespace FinalDestinationAPI.Configuration;

/// <summary>
/// Cache configuration settings
/// </summary>
public class CacheSettings
{
    public const string SectionName = "Cache";
    
    public int DefaultExpirationMinutes { get; set; } = 30;
    public int HotelCacheExpirationMinutes { get; set; } = 10;
}




