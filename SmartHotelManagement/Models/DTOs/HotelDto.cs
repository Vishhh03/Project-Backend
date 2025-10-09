using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SmartHotelManagement.Models;

namespace SmartHotelManagement.Models.DTOs
{
    public class HotelDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string? City { get; set; }

        public string? Country { get; set; }

        public int? ManagerId { get; set; }
    }

    public class HotelWithRoomsDto : HotelDto
    {
        public List<RoomDto> Rooms { get; set; } = new List<RoomDto>();
    }

    public class RoomDto
    {
        public int Id { get; set; }

        public string RoomNumber { get; set; } = string.Empty;

        public int RoomTypeId { get; set; }

        public string? RoomTypeName { get; set; }

        public decimal Price { get; set; }

        public bool IsAvailable { get; set; }

        public string? Amenities { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class CreateRoomRequestDto
    {
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
    }

    public class UpdateRoomRequestDto
    {
        [StringLength(50)]
        public string? RoomNumber { get; set; }

        public int? RoomTypeId { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }

        public bool? IsAvailable { get; set; }

        [StringLength(2000)]
        public string? Amenities { get; set; }
    }

    public class RoomTypeDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal DefaultPrice { get; set; }
    }

    public class CreateRoomTypeDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DefaultPrice { get; set; }
    }

    public class UpdateRoomTypeDto
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DefaultPrice { get; set; }
    }

    public class AmenityDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool IsActive { get; set; }
    }

    public class CreateAmenityDto
    {
        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }
    }

    public class UpdateAmenityDto
    {
        [StringLength(150)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public bool? IsActive { get; set; }
    }
}
