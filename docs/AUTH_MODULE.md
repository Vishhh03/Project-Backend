# Authentication & Security Module Documentation

**Team**: Security Team  
**Module Owner**: Authentication & Authorization System  
**Last Updated**: December 2024

## 📋 Module Overview

The Authentication module provides secure user management, JWT-based authentication, and role-based authorization for the Smart Hotel Booking System. This module ensures that only authenticated users can access protected resources and that users can only perform actions appropriate to their role.

## 🎯 Module Responsibilities

- User registration and login
- JWT token generation and validation
- Password hashing and security
- Role-based authorization
- Session management
- Security middleware

## 🏗️ Module Architecture

```
Authentication Module
├── Controllers/
│   └── AuthController.cs          # Authentication endpoints
├── Services/
│   └── JwtService.cs             # JWT token management
├── Models/
│   └── User.cs                   # User entity
├── DTOs/
│   ├── LoginRequest.cs           # Login input
│   ├── RegisterRequest.cs        # Registration input
│   └── AuthResponse.cs           # Authentication response
├── Configuration/
│   └── JwtSettings.cs            # JWT configuration
└── Middleware/
    └── ErrorHandlingMiddleware.cs # Global error handling
```

## 🔧 Key Components

### 1. AuthController.cs

**Purpose**: Handles authentication HTTP requests

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly HotelContext _context;
    private readonly IJwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    
    // POST /api/auth/login  
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    
    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<User>> GetCurrentUser()
}
```

**Why This Design**:
- **RESTful endpoints**: Standard HTTP methods for authentication operations
- **DTO validation**: Separates API contracts from internal models
- **Async operations**: Non-blocking database operations for better performance
- **Proper HTTP status codes**: 200 for success, 400 for validation errors, 401 for unauthorized

### 2. JwtService.cs

**Purpose**: Manages JWT token creation and validation

```csharp
public class JwtService : IJwtService
{
    private readonly JwtSettings _jwtSettings;
    
    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_jwtSettings.ExpiryInHours),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

**Why JWT**:
- **Stateless**: No server-side session storage required
- **Scalable**: Works across multiple server instances
- **Secure**: Cryptographically signed tokens
- **Standard**: Industry-standard authentication method

### 3. User Model

**Purpose**: Represents user entity with authentication properties

```csharp
public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? ContactNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation Properties
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public LoyaltyAccount? LoyaltyAccount { get; set; }
}

public enum UserRole
{
    Guest = 1,
    HotelManager = 2,
    Admin = 3
}
```

**Design Decisions**:
- **Email as username**: Unique identifier for login
- **BCrypt password hashing**: Industry-standard secure hashing
- **Role enumeration**: Simple but effective role-based access
- **Audit fields**: CreatedAt, LastLoginAt for tracking
- **Soft delete**: IsActive flag instead of hard deletion

## 🔐 Security Implementation

### Password Security

```csharp
// Password hashing during registration
public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
{
    // Hash password using BCrypt
    var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
    
    var user = new User
    {
        Name = request.Name,
        Email = request.Email,
        PasswordHash = passwordHash,
        Role = request.Role,
        ContactNumber = request.ContactNumber
    };
    
    _context.Users.Add(user);
    await _context.SaveChangesAsync();
}

// Password verification during login
var isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
```

**Why BCrypt**:
- **Adaptive**: Can increase complexity over time
- **Salt included**: Each hash is unique even for same password
- **Proven security**: Widely used and tested
- **Slow by design**: Resistant to brute force attacks

### JWT Configuration

```json
{
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!",
    "Issuer": "FinalDestination",
    "Audience": "FinalDestinationUsers",
    "ExpiryInHours": 24
  }
}
```

**Security Considerations**:
- **Strong secret key**: At least 32 characters for HMAC256
- **Appropriate expiry**: 24 hours balances security and usability
- **Issuer/Audience validation**: Prevents token misuse

## 🔗 Integration Points

### With Other Modules

1. **Hotel Module**: Role-based access for hotel management
2. **Booking Module**: User identification for bookings
3. **Review Module**: User authentication for reviews
4. **Loyalty Module**: User identification for points
5. **Payment Module**: User authentication for payments

### Authorization Attributes

```csharp
// Require authentication
[Authorize]
public async Task<ActionResult<IEnumerable<Booking>>> GetMyBookings()

// Require specific role
[Authorize(Roles = "Admin")]
public async Task<ActionResult<IEnumerable<Booking>>> GetAllBookings()

// Multiple roles
[Authorize(Roles = "HotelManager,Admin")]
public async Task<ActionResult<Hotel>> CreateHotel(CreateHotelRequest request)
```

## ⚙️ Configuration

### JWT Settings Class

```csharp
public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryInHours { get; set; } = 24;
}
```

### Service Registration

```csharp
// Program.cs
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<IJwtService, JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task Register_ValidUser_ReturnsAuthResponse()
{
    // Arrange
    var request = new RegisterRequest
    {
        Name = "Test User",
        Email = "test@example.com",
        Password = "SecurePass123!",
        Role = UserRole.Guest
    };
    
    // Act
    var result = await _authController.Register(request);
    
    // Assert
    Assert.IsType<ActionResult<AuthResponse>>(result);
    var authResponse = result.Value;
    Assert.NotNull(authResponse.Token);
    Assert.Equal("Test User", authResponse.User.Name);
}

[Test]
public void GenerateToken_ValidUser_ReturnsValidJwt()
{
    // Arrange
    var user = new User { Id = 1, Email = "test@example.com", Role = UserRole.Guest };
    
    // Act
    var token = _jwtService.GenerateToken(user);
    
    // Assert
    Assert.NotNull(token);
    Assert.Contains(".", token); // JWT format check
}
```

### Integration Testing

```csharp
[Test]
public async Task Login_ValidCredentials_ReturnsToken()
{
    // Arrange
    var client = _factory.CreateClient();
    var loginRequest = new LoginRequest
    {
        Email = "admin@hotel.com",
        Password = "Admin123!"
    };
    
    // Act
    var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);
    
    // Assert
    response.EnsureSuccessStatusCode();
    var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
    Assert.NotNull(authResponse.Token);
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid token" errors**
   - Check JWT secret key length (minimum 32 characters)
   - Verify Issuer and Audience configuration
   - Ensure system clock synchronization

2. **"Unauthorized" responses**
   - Verify Authorization header format: `Bearer <token>`
   - Check token expiration
   - Confirm user role permissions

3. **Password validation failures**
   - Ensure password meets complexity requirements
   - Check BCrypt hashing implementation
   - Verify password comparison logic

### Debug Tips

```csharp
// Add logging to JWT service
_logger.LogInformation("Generating token for user {UserId}", user.Id);

// Log authentication attempts
_logger.LogWarning("Failed login attempt for email {Email}", request.Email);

// Debug token validation
_logger.LogDebug("Token validation parameters: Issuer={Issuer}, Audience={Audience}", 
    _jwtSettings.Issuer, _jwtSettings.Audience);
```

## 📈 Performance Considerations

1. **Password Hashing**: BCrypt is intentionally slow - consider async operations
2. **Token Validation**: JWT validation is fast but cache user data if needed
3. **Database Queries**: Use indexes on Email field for login lookups
4. **Memory Usage**: JWT tokens are stateless, no server-side storage needed

## 🔮 Future Enhancements

1. **Refresh Tokens**: Implement token refresh mechanism
2. **Two-Factor Authentication**: Add 2FA support
3. **OAuth Integration**: Support Google/Facebook login
4. **Account Lockout**: Implement brute force protection
5. **Password Reset**: Email-based password reset flow
6. **Audit Logging**: Detailed authentication event logging

## 📚 Related Documentation

- [API_DOCUMENTATION.md](../finaldestination/API_DOCUMENTATION.md) - API endpoint details
- [SETUP_GUIDE.md](../finaldestination/SETUP_GUIDE.md) - Environment setup
- [DATA_MODULE.md](DATA_MODULE.md) - User entity relationships