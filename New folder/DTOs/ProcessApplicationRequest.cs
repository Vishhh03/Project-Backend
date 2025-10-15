using System.ComponentModel.DataAnnotations;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for processing (approving/rejecting) hotel manager application
/// </summary>
public class ProcessApplicationRequest
{
    /// <summary>
    /// Decision on the application
    /// </summary>
    [Required(ErrorMessage = "Status is required")]
    public ApplicationStatus Status { get; set; }

    /// <summary>
    /// Admin notes or reason for decision
    /// </summary>
    [StringLength(1000, ErrorMessage = "Admin notes cannot exceed 1000 characters")]
    public string? AdminNotes { get; set; }
}
