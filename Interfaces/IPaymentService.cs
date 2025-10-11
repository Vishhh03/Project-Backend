using SimpleHotelAPI.Models;
using SimpleHotelAPI.DTOs;

namespace SimpleHotelAPI.Interfaces;

public interface IPaymentService
{
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request);
    Task<PaymentResult> RefundPaymentAsync(int paymentId, decimal amount);
    Task<Payment?> GetPaymentAsync(int paymentId);
}