using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Response DTO for hotel manager application
/// </summary>
public class HotelManagerApplicationResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessAddress { get; set; } = string.Empty;
    public string BusinessLicense { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string BusinessPhone { get; set; } = string.Empty;
    public string BusinessEmail { get; set; } = string.Empty;
    public string? AdditionalInfo { get; set; }
    public DateTime ApplicationDate { get; set; }
    public ApplicationStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public DateTime? ProcessedDate { get; set; }
    public string? ProcessedByName { get; set; }
    public string? AdminNotes { get; set; }
}
