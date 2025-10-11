using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Filters;

/// <summary>
/// Action filter to handle model validation errors consistently
/// </summary>
public class ValidationFilter : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var validationErrors = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );

            var errorResponse = new ErrorResponse
            {
                Message = "Validation failed",
                Details = "One or more validation errors occurred",
                StatusCode = 400,
                ValidationErrors = validationErrors
            };

            context.Result = new BadRequestObjectResult(errorResponse);
        }
    }
}




