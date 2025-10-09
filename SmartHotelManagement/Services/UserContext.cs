// Services/UserContext.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _http;
    public UserContext(IHttpContextAccessor http) => _http = http;

    public int? GetUserId()
    {
        var id = _http.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(id, out var i)) return i;
        return null;
    }

    public string? GetUserEmail() => _http.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;
    public bool IsInRole(string role) => _http.HttpContext?.User?.IsInRole(role) ?? false;
}