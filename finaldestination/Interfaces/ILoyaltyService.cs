using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Interfaces;

public interface ILoyaltyService
{
    Task<LoyaltyAccountResponse?> GetLoyaltyAccountAsync(int userId);
    Task<LoyaltyAccountResponse> CreateLoyaltyAccountAsync(int userId);
    Task<LoyaltyAccountResponse> AwardPointsAsync(int userId, int bookingId, decimal bookingAmount);
    Task<List<PointsTransactionResponse>> GetPointsHistoryAsync(int userId, int pageNumber = 1, int pageSize = 10);
    Task<int> CalculatePointsAsync(decimal bookingAmount);
    Task<bool> HasLoyaltyAccountAsync(int userId);
}




