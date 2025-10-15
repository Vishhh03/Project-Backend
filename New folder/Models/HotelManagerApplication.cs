namespace FinalDestinationAPI.Models;

/// <summary>
/// Represents an application from a user to become a hotel manager
/// </summary>
public class HotelManagerApplication
{
    public int Id { get; set; }
    
    /// <summary>
    /// User who submitted the application
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// Business/Hotel name
    /// </summary>
    public string BusinessName { get; set; } = string.Empty;
    
    /// <summary>
    /// Business address
    /// </summary>
    public string BusinessAddress { get; set; } = string.Empty;
    
    /// <summary>
    /// Business license or registration number
    /// </summary>
    public string BusinessLicense { get; set; } = string.Empty;
    
    /// <summary>
    /// Contact person name
    /// </summary>
    public string ContactPerson { get; set; } = string.Empty;
    
    /// <summary>
    /// Business phone number
    /// </summary>
    public string BusinessPhone { get; set; } = string.Empty;
    
    /// <summary>
    /// Business email address
    /// </summary>
    public string BusinessEmail { get; set; } = string.Empty;
    
    /// <summary>
    /// Additional information or notes from applicant
    /// </summary>
    public string? AdditionalInfo { get; set; }
    
    /// <summary>
    /// Date application was submitted
    /// </summary>
    public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Current status of the application
    /// </summary>
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
    
    /// <summary>
    /// Date application was processed
    /// </summary>
    public DateTime? ProcessedDate { get; set; }
    
    /// <summary>
    /// Admin user who processed the application
    /// </summary>
    public int? ProcessedBy { get; set; }
    
    /// <summary>
    /// Admin notes or reason for approval/rejection
    /// </summary>
    public string? AdminNotes { get; set; }
    
    // Navigation Properties
    public User User { get; set; } = null!;
    public User? ProcessedByUser { get; set; }
}

/// <summary>
/// Status of hotel manager application
/// </summary>
public enum ApplicationStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    RequiresMoreInfo = 4
}
