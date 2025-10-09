using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartHotelManagement.Models;
using SmartHotelManagement.Models.DTOs;

namespace SmartHotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "HotelManager,Admin")]
    public class HotelsController : ControllerBase
    {
        private readonly HotelDBContext _context;
        private readonly ILogger<HotelsController> _logger;

        public HotelsController(HotelDBContext context, ILogger<HotelsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // List hotels visible to manager (optionally filter by manager id or pagination)
        [HttpGet]
        public async Task<IActionResult> GetHotels(int page = 1, int pageSize = 20)
        {
            var skip = (Math.Max(page, 1) - 1) * Math.Max(pageSize, 1);

            var hotels = await _context.Hotels
                .AsNoTracking()
                .OrderBy(h => h.Name)
                .Skip(skip)
                .Take(pageSize)
                .Select(h => new HotelDto
                {
                    Id = h.Id,
                    Name = h.Name,
                    Address = h.Address,
                    City = h.City,
                    Country = h.Country,
                    ManagerId = h.ManagerId
                })
                .ToListAsync();

            return Ok(hotels);
        }

        // Get single hotel with rooms
        [HttpGet("{hotelId}")]
        public async Task<IActionResult> GetHotel(int hotelId)
        {
            var hotel = await _context.Hotels
                .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomType)
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.Id == hotelId);

            if (hotel == null) return NotFound(new { message = "Hotel not found" });

            var dto = new HotelWithRoomsDto
            {
                Id = hotel.Id,
                Name = hotel.Name,
                Address = hotel.Address,
                City = hotel.City,
                Country = hotel.Country,
                ManagerId = hotel.ManagerId,
                Rooms = hotel.Rooms?.Select(r => new RoomDto
                {
                    Id = r.Id,
                    RoomNumber = r.RoomNumber,
                    RoomTypeId = r.RoomTypeId,
                    Price = r.Price,
                    IsAvailable = r.IsAvailable,
                    Amenities = r.Amenities
                }).ToList() ?? new List<RoomDto>()
            };

            return Ok(dto);
        }

        // Create room for a hotel
        [HttpPost("{hotelId}/rooms")]
        public async Task<IActionResult> CreateRoom(int hotelId, [FromBody] CreateRoomRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var hotel = await _context.Hotels.FindAsync(hotelId);
            if (hotel == null) return NotFound(new { message = "Hotel not found" });

            // Verify room type exists
            var roomType = await _context.RoomTypes.FindAsync(request.RoomTypeId);
            if (roomType == null) return BadRequest(new { message = "Invalid room type" });

            // Ensure unique room number per hotel
            var exists = await _context.Rooms
                .AnyAsync(r => r.HotelId == hotelId && r.RoomNumber == request.RoomNumber);
            if (exists) return Conflict(new { message = "Room number already exists for this hotel" });

            var room = new Room
            {
                HotelId = hotelId,
                RoomNumber = request.RoomNumber,
                RoomTypeId = request.RoomTypeId,
                Price = request.Price,
                Amenities = request.Amenities,
                IsAvailable = request.IsAvailable,
                CreatedAt = DateTime.UtcNow
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            var dto = new RoomDto
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                RoomTypeId = room.RoomTypeId,
                Price = room.Price,
                IsAvailable = room.IsAvailable,
                Amenities = room.Amenities
            };

            return CreatedAtAction(nameof(GetRoom), new { hotelId = hotelId, roomId = room.Id }, dto);
        }

        // Get a single room
        [HttpGet("{hotelId}/rooms/{roomId}")]
        public async Task<IActionResult> GetRoom(int hotelId, int roomId)
        {
            var room = await _context.Rooms
                .AsNoTracking()
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId);

            if (room == null) return NotFound(new { message = "Room not found" });

            var dto = new RoomDto
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                RoomTypeId = room.RoomTypeId,
                RoomTypeName = room.RoomType?.Name,
                Price = room.Price,
                IsAvailable = room.IsAvailable,
                Amenities = room.Amenities
            };

            return Ok(dto);
        }

        // Update room (pricing, type, amenities, availability)
        [HttpPut("{hotelId}/rooms/{roomId}")]
        public async Task<IActionResult> UpdateRoom(int hotelId, int roomId, [FromBody] UpdateRoomRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId);
            if (room == null) return NotFound(new { message = "Room not found" });

            if (request.RoomTypeId.HasValue)
            {
                var rt = await _context.RoomTypes.FindAsync(request.RoomTypeId.Value);
                if (rt == null) return BadRequest(new { message = "Invalid room type" });
                room.RoomTypeId = request.RoomTypeId.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.RoomNumber))
            {
                var duplicate = await _context.Rooms
                    .AnyAsync(r => r.HotelId == hotelId && r.RoomNumber == request.RoomNumber && r.Id != roomId);
                if (duplicate) return Conflict(new { message = "Another room with same number exists" });
                room.RoomNumber = request.RoomNumber;
            }

            if (request.Price.HasValue) room.Price = request.Price.Value;
            if (request.IsAvailable.HasValue) room.IsAvailable = request.IsAvailable.Value;
            if (request.Amenities != null) room.Amenities = request.Amenities;

            room.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Delete room
        [HttpDelete("{hotelId}/rooms/{roomId}")]
        public async Task<IActionResult> DeleteRoom(int hotelId, int roomId)
        {
            var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HotelId == hotelId);
            if (room == null) return NotFound(new { message = "Room not found" });

            // Consider preventing delete if active bookings exist; simple check example:
            var hasBookings = await _context.Bookings.AnyAsync(b => b.RoomId == roomId && b.Status == BookingStatus.Confirmed);
            if (hasBookings) return BadRequest(new { message = "Cannot delete room with active bookings" });

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Manage room types (list, create, update, delete) - managers may configure types for their hotels
        [HttpGet("roomtypes")]
        public async Task<IActionResult> GetRoomTypes()
        {
            var types = await _context.RoomTypes
                .AsNoTracking()
                .OrderBy(t => t.Name)
                .Select(t => new RoomTypeDto { Id = t.Id, Name = t.Name, Description = t.Description, DefaultPrice = t.DefaultPrice })
                .ToListAsync();

            return Ok(types);
        }

        [HttpPost("roomtypes")]
        public async Task<IActionResult> CreateRoomType([FromBody] CreateRoomTypeDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var exists = await _context.RoomTypes.AnyAsync(t => t.Name == request.Name);
            if (exists) return Conflict(new { message = "Room type with same name exists" });

            var rt = new RoomType
            {
                Name = request.Name,
                Description = request.Description,
                DefaultPrice = request.DefaultPrice,
                CreatedAt = DateTime.UtcNow
            };

            _context.RoomTypes.Add(rt);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRoomTypes), new { id = rt.Id }, new RoomTypeDto { Id = rt.Id, Name = rt.Name, Description = rt.Description, DefaultPrice = rt.DefaultPrice });
        }

        [HttpPut("roomtypes/{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, [FromBody] UpdateRoomTypeDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var rt = await _context.RoomTypes.FindAsync(id);
            if (rt == null) return NotFound(new { message = "Room type not found" });

            rt.Name = request.Name ?? rt.Name;
            rt.Description = request.Description ?? rt.Description;
            if (request.DefaultPrice.HasValue) rt.DefaultPrice = request.DefaultPrice.Value;
            rt.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("roomtypes/{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var rt = await _context.RoomTypes.FindAsync(id);
            if (rt == null) return NotFound(new { message = "Room type not found" });

            var used = await _context.Rooms.AnyAsync(r => r.RoomTypeId == id);
            if (used) return BadRequest(new { message = "Cannot delete room type in use by rooms" });

            _context.RoomTypes.Remove(rt);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
