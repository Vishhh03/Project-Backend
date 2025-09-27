using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SmartHotelManagement.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace SmartHotelManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HotelController : ControllerBase
    {
        private readonly ILogger<HotelController> _logger;
        private readonly HotelDBContext _context;

        public HotelController(HotelDBContext context, ILogger<HotelController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("hotels")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHotels()
        {
            try
            {
                var hotels = await _context.Hotels
                    .Include(h => h.Rooms)
                    .Include(h => h.Reviews)
                    .ToListAsync();

                return Ok(hotels);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching hotels");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHotel(int id)
        {
            try
            {
                var hotel = await _context.Hotels
                    .Include(h => h.Rooms)
                    .Include(h => h.Reviews)
                    .ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(h => h.Id == id);

                if (hotel == null)
                {
                    return NotFound(new { message = "Hotel not found" });
                }

                return Ok(hotel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching hotel with id {HotelId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("createHotel")]
        [Authorize(Policy = "AdminOrHotelManager")]
        public async Task<IActionResult> CreateHotel([FromBody] Hotel hotel)
        {
            try
            {
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");

                // If user is a hotel manager, set them as the manager
                if (userRole == "HotelManager")
                {
                    hotel.ManagerId = userId;
                }

                hotel.CreatedAt = DateTime.UtcNow;
                
                await _context.Hotels.AddAsync(hotel);
                await _context.SaveChangesAsync();

                return Ok(hotel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating hotel");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOrHotelManager")]
        public async Task<IActionResult> UpdateHotel(int id, [FromBody] Hotel updatedHotel)
        {
            try
            {
                var hotel = await _context.Hotels.FindAsync(id);
                if (hotel == null)
                {
                    return NotFound(new { message = "Hotel not found" });
                }

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");

                // Hotel managers can only update their own hotels
                if (userRole == "HotelManager" && hotel.ManagerId != userId)
                {
                    return Forbid("You can only update your own hotels");
                }

                hotel.Name = updatedHotel.Name;
                hotel.Location = updatedHotel.Location;
                hotel.Amenities = updatedHotel.Amenities;
                hotel.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(hotel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating hotel with id {HotelId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteHotel(int id)
        {
            try
            {
                var hotel = await _context.Hotels.FindAsync(id);
                if (hotel == null)
                {
                    return NotFound(new { message = "Hotel not found" });
                }

                _context.Hotels.Remove(hotel);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Hotel deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting hotel with id {HotelId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}

