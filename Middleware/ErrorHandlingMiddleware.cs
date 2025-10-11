using System.Net;
using System.Text.Json;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Middleware;

/// <summary>
/// Global error handling middleware for consistent error responses
/// </summary>
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new ErrorResponse();

        switch (exception)
        {
            case ArgumentException argEx:
                // Bad request - invalid arguments
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Invalid request parameters";
                errorResponse.Details = argEx.Message;
                break;

            case KeyNotFoundException:
                // Not found
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Resource not found";
                errorResponse.Details = exception.Message;
                break;

            case UnauthorizedAccessException:
                // Unauthorized
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Unauthorized access";
                errorResponse.Details = exception.Message;
                break;

            case InvalidOperationException invOpEx:
                // Business logic error
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Invalid operation";
                errorResponse.Details = invOpEx.Message;
                break;

            case TimeoutException:
                // Request timeout
                response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Request timeout";
                errorResponse.Details = "The request took too long to process";
                break;

            default:
                // Internal server error
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "An internal server error occurred";
                errorResponse.Details = "Please try again later or contact support if the problem persists";
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(jsonResponse);
    }
}




