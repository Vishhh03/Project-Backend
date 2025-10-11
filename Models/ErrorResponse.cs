namespace FinalDestinationAPI.Models;

/// <summary>
/// Standard error response format for the API
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// Main error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Additional error details (optional)
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// Timestamp when the error occurred
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// HTTP status code
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// Validation errors (for model validation failures)
    /// </summary>
    public Dictionary<string, string[]>? ValidationErrors { get; set; }
}




