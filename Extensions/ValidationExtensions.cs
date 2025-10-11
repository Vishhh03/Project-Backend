using Microsoft.AspNetCore.Mvc;
using FinalDestinationAPI.Models;
using FinalDestinationAPI.Services;

namespace FinalDestinationAPI.Extensions;

/// <summary>
/// Extension methods for validation and error handling
/// </summary>
public static class ValidationExtensions
{
    /// <summary>
    /// Creates a standardized BadRequest response with validation errors
    /// </summary>
    public static BadRequestObjectResult ValidationError(this ControllerBase controller, string message, params string[] errors)
    {
        var errorResponse = new ErrorResponse
        {
            Message = message,
            Details = errors.Length > 0 ? string.Join("; ", errors) : null,
            StatusCode = 400,
            ValidationErrors = errors.Length > 0 ? new Dictionary<string, string[]> { { "ValidationErrors", errors } } : null
        };

        return controller.BadRequest(errorResponse);
    }

    /// <summary>
    /// Creates a standardized BadRequest response from ValidationResult
    /// </summary>
    public static BadRequestObjectResult ValidationError(this ControllerBase controller, Services.ValidationResult validationResult)
    {
        var errorResponse = new ErrorResponse
        {
            Message = "Validation failed",
            Details = string.Join("; ", validationResult.Errors),
            StatusCode = 400,
            ValidationErrors = new Dictionary<string, string[]> { { "ValidationErrors", validationResult.Errors.ToArray() } }
        };

        return controller.BadRequest(errorResponse);
    }

    /// <summary>
    /// Creates a standardized NotFound response
    /// </summary>
    public static NotFoundObjectResult NotFoundError(this ControllerBase controller, string message, string? details = null)
    {
        var errorResponse = new ErrorResponse
        {
            Message = message,
            Details = details,
            StatusCode = 404
        };

        return controller.NotFound(errorResponse);
    }

    /// <summary>
    /// Creates a standardized Unauthorized response
    /// </summary>
    public static UnauthorizedObjectResult UnauthorizedError(this ControllerBase controller, string message, string? details = null)
    {
        var errorResponse = new ErrorResponse
        {
            Message = message,
            Details = details,
            StatusCode = 401
        };

        return controller.Unauthorized(errorResponse);
    }

    /// <summary>
    /// Creates a standardized Forbidden response
    /// </summary>
    public static ObjectResult ForbiddenError(this ControllerBase controller, string message, string? details = null)
    {
        var errorResponse = new ErrorResponse
        {
            Message = message,
            Details = details,
            StatusCode = 403
        };

        return controller.StatusCode(403, errorResponse);
    }

    /// <summary>
    /// Creates a standardized Conflict response
    /// </summary>
    public static ConflictObjectResult ConflictError(this ControllerBase controller, string message, string? details = null)
    {
        var errorResponse = new ErrorResponse
        {
            Message = message,
            Details = details,
            StatusCode = 409
        };

        return controller.Conflict(errorResponse);
    }
}




