using System.ComponentModel.DataAnnotations;

namespace FinalDestinationAPI.DTOs;

/// <summary>
/// Request DTO for creating or updating a hotel review with comprehensive validation
/// </summary>
public class ReviewRequest
{
    /// <summary>
    /// ID of the hotel being reviewed
    /// </summary>
    [Required(ErrorMessage = "Hotel ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Hotel ID must be a positive number")]
    public int HotelId { get; set; }
    
    /// <summary>
    /// Rating from 1 (poor) to 5 (excellent)
    /// </summary>
    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 (poor) and 5 (excellent)")]
    public int Rating { get; set; }
    
    /// <summary>
    /// Optional review comment
    /// </summary>
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Comment must be between 10 and 1000 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s\.\,\!\?\-\(\)\'\""\:;]+$", 
        ErrorMessage = "Comment contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed")]
    public string Comment { get; set; } = string.Empty;
}




