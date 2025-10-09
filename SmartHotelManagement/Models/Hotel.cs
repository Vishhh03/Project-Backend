using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SmartHotelManagement.Models
{
    public class Hotel
    {
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Address { get; set; } = string.Empty;

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        public int? ManagerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Room>? Rooms { get; set; }
    }

    public class Room
    {
        public int Id { get; set; }

        [Required]
        public int HotelId { get; set; }

        [Required]
        [StringLength(50)]
        public string RoomNumber { get; set; } = string.Empty;

        [Required]
        public int RoomTypeId { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [StringLength(2000)]
        public string? Amenities { get; set; }

        public bool IsAvailable { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public RoomType? RoomType { get; set; }
        public Hotel? Hotel { get; set; }
    }

    public class RoomType
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DefaultPrice { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Room>? Rooms { get; set; }
        public ICollection<RoomTypeAmenity>? RoomTypeAmenities { get; set; }
    }

    public class Amenity
    {
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<RoomTypeAmenity>? RoomTypeAmenities { get; set; }
    }

    public class RoomTypeAmenity
    {
        public int RoomTypeId { get; set; }
        public RoomType? RoomType { get; set; }

        public int AmenityId { get; set; }
        public Amenity? Amenity { get; set; }
    }
}
