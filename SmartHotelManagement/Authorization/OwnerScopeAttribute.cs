// Authorization/OwnerScopeAttribute.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace SmartHotelManagement.Authorization
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class OwnerScopeAttribute : ActionFilterAttribute
    {
        private readonly string _hotelIdRouteKey;

        public OwnerScopeAttribute(string hotelIdRouteKey = "hotelId")
        {
            _hotelIdRouteKey = hotelIdRouteKey;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var user = context.HttpContext.User;
            if (!user.Identity?.IsAuthenticated ?? false)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Admin bypass
            if (user.IsInRole("Admin")) return;

            // If not manager, deny
            if (!user.IsInRole("HotelManager"))
            {
                context.Result = new ForbidResult();
                return;
            }

            // Ensure route contains hotel id
            if (!context.ActionArguments.TryGetValue(_hotelIdRouteKey, out var hotelIdObj) || hotelIdObj == null)
            {
                context.Result = new BadRequestObjectResult(new { message = "Hotel id required" });
                return;
            }

            var hotelId = Convert.ToInt32(hotelIdObj);

            // Manager id stored in claim "userId" (ensure JwtService adds it)
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                context.Result = new ForbidResult();
                return;
            }

            var managerId = int.Parse(userIdClaim);

            // Check DB for ownership
            var db = context.HttpContext.RequestServices.GetService(typeof(HotelDBContext)) as HotelDBContext;
            var hotel = db?.Hotels.Find(hotelId);
            if (hotel == null)
            {
                context.Result = new NotFoundObjectResult(new { message = "Hotel not found" });
                return;
            }

            if (hotel.ManagerId != managerId)
            {
                context.Result = new ForbidResult();
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}

