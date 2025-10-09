// Models/Availability.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace SmartHotelManagement.Models
{
    public class Availability
    {
        public int Id { get; set; }

        [Required]
        public int RoomId { get; set; }

        [Required]
        public DateTime Date { get; set; } // date only; treat time component as 00:00 UTC

        public bool IsAvailable { get; set; } = true;

        [Range(0, double.MaxValue)]
        public decimal? PriceOverride { get; set; } // null means use room.Price or roomType default

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Room? Room { get; set; }
    }
}