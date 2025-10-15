using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinalDestinationAPI.DTOs;
using FinalDestinationAPI.Interfaces;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Process a payment for a booking
    /// </summary>
    /// <param name="request">Payment details</param>
    /// <returns>Payment result with transaction details</returns>
    [HttpPost]
    public async Task<ActionResult<PaymentResult>> ProcessPayment([FromBody] PaymentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Processing payment for booking {BookingId}", request.BookingId);

            var result = await _paymentService.ProcessPaymentAsync(request);

            if (result.Status == PaymentStatus.Completed)
            {
                _logger.LogInformation("Payment {TransactionId} completed successfully", result.TransactionId);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Payment failed for booking {BookingId}: {ErrorMessage}", 
                    request.BookingId, result.ErrorMessage);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for booking {BookingId}", request.BookingId);
            return StatusCode(500, new { message = "An error occurred while processing the payment" });
        }
    }

    /// <summary>
    /// Get payment details by payment ID
    /// </summary>
    /// <param name="id">Payment ID</param>
    /// <returns>Payment details</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Payment>> GetPayment(int id)
    {
        try
        {
            var payment = await _paymentService.GetPaymentAsync(id);

            if (payment == null)
            {
                return NotFound(new { message = $"Payment with ID {id} not found" });
            }

            return Ok(payment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving payment {PaymentId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the payment" });
        }
    }

    /// <summary>
    /// Process a refund for a payment
    /// </summary>
    /// <param name="id">Payment ID</param>
    /// <param name="request">Refund details</param>
    /// <returns>Refund result</returns>
    [HttpPost("{id}/refund")]
    public async Task<ActionResult<PaymentResult>> RefundPayment(int id, [FromBody] RefundRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Processing refund for payment {PaymentId} with amount {Amount}", 
                id, request.Amount);

            var result = await _paymentService.RefundPaymentAsync(id, request.Amount);

            if (result.Status == PaymentStatus.Refunded)
            {
                _logger.LogInformation("Refund for payment {PaymentId} completed successfully", id);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Refund failed for payment {PaymentId}: {ErrorMessage}", 
                    id, result.ErrorMessage);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for payment {PaymentId}", id);
            return StatusCode(500, new { message = "An error occurred while processing the refund" });
        }
    }
}




