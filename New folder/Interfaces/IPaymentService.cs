using FinalDestinationAPI.Models;
using FinalDestinationAPI.DTOs;

namespace FinalDestinationAPI.Interfaces;

public interface IPaymentService
{
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request);
    Task<PaymentResult> RefundPaymentAsync(int paymentId, decimal amount);
    Task<Payment?> GetPaymentAsync(int paymentId);
}




