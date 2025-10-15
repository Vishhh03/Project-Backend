using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateReviewAsync(int userId, ReviewRequest request);
    Task<ReviewResponse?> GetReviewAsync(int id);
    Task<IEnumerable<ReviewResponse>> GetReviewsByHotelAsync(int hotelId, int page = 1, int pageSize = 10);
    Task<IEnumerable<ReviewResponse>> GetReviewsByUserAsync(int userId);
    Task<ReviewResponse?> UpdateReviewAsync(int id, int userId, UpdateReviewRequest request);
    Task<bool> DeleteReviewAsync(int id, int userId);
    Task<decimal> CalculateHotelRatingAsync(int hotelId);
    Task<int> GetReviewCountByHotelAsync(int hotelId);
}




