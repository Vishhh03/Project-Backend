using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.DTOs;

public class BookingResponse
{
    public int Id { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool PaymentRequired { get; set; }
    public int? PaymentId { get; set; }
    public int? LoyaltyPointsEarned { get; set; }
}




