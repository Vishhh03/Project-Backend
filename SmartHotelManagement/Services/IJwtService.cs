using SmartHotelManagement.Models;

namespace SmartHotelManagement.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        bool ValidateToken(string token);
    }
}