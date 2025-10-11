using FinalDestinationAPI.Data;
using FinalDestinationAPI.Interfaces;
using FinalDestinationAPI.Models;
using FinalDestinationAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinalDestinationAPI.Services;

public class MockPaymentService : IPaymentService
{
    private readonly HotelContext _context;
    private readonly ILogger<MockPaymentService> _logger;

    public MockPaymentService(HotelContext context, ILogger<MockPaymentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        _logger.LogInformation("Processing payment for booking {BookingId} with amount {Amount}", 
            request.BookingId, request.Amount);

        // Simulate payment processing delay
        await Task.Delay(1000);

        // Simulate 90% success rate
        var isSuccess = Random.Shared.NextDouble() > 0.1;

        var payment = new Payment
        {
            BookingId = request.BookingId,
            Amount = request.Amount,
            Currency = request.Currency,
            PaymentMethod = request.PaymentMethod,
            Status = isSuccess ? PaymentStatus.Completed : PaymentStatus.Failed,
            TransactionId = GenerateTransactionId(),
            ProcessedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var result = new PaymentResult
        {
            PaymentId = payment.Id,
            Status = payment.Status,
            TransactionId = payment.TransactionId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            ProcessedAt = payment.ProcessedAt ?? DateTime.UtcNow,
            ErrorMessage = isSuccess ? null : "Payment processing failed - insufficient funds or card declined"
        };

        _logger.LogInformation("Payment {TransactionId} processed with status {Status}", 
            result.TransactionId, result.Status);

        return result;
    }

    public async Task<PaymentResult> RefundPaymentAsync(int paymentId, decimal amount)
    {
        _logger.LogInformation("Processing refund for payment {PaymentId} with amount {Amount}", 
            paymentId, amount);

        var payment = await _context.Payments.FindAsync(paymentId);
        if (payment == null)
        {
            return new PaymentResult
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Failed,
                ErrorMessage = "Payment not found"
            };
        }

        if (payment.Status != PaymentStatus.Completed)
        {
            return new PaymentResult
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Failed,
                ErrorMessage = "Cannot refund a payment that is not completed"
            };
        }

        if (amount > payment.Amount)
        {
            return new PaymentResult
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Failed,
                ErrorMessage = "Refund amount cannot exceed original payment amount"
            };
        }

        // Simulate refund processing delay
        await Task.Delay(500);

        // Simulate 95% success rate for refunds
        var isSuccess = Random.Shared.NextDouble() > 0.05;

        if (isSuccess)
        {
            payment.Status = PaymentStatus.Refunded;
            payment.ProcessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var result = new PaymentResult
        {
            PaymentId = payment.Id,
            Status = isSuccess ? PaymentStatus.Refunded : PaymentStatus.Failed,
            TransactionId = payment.TransactionId,
            Amount = amount,
            Currency = payment.Currency,
            ProcessedAt = DateTime.UtcNow,
            ErrorMessage = isSuccess ? null : "Refund processing failed - please try again later"
        };

        _logger.LogInformation("Refund for payment {PaymentId} processed with status {Status}", 
            paymentId, result.Status);

        return result;
    }

    public async Task<Payment?> GetPaymentAsync(int paymentId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.Id == paymentId);
    }

    private static string GenerateTransactionId()
    {
        // Generate a 12-character alphanumeric transaction ID
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}




