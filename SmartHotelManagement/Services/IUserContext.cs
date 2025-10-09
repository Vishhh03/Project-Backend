
// Helper to extract current user id
// Services/IUserContext.cs
public interface IUserContext
{
    int? GetUserId();
    string? GetUserEmail();
    bool IsInRole(string role);
}