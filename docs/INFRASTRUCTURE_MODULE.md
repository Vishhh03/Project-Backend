# Infrastructure Module Documentation

**Team**: DevOps & Infrastructure Team  
**Module Owner**: System Configuration & Deployment  
**Last Updated**: December 2024

## 📋 Module Overview

The Infrastructure module manages system configuration, middleware, deployment settings, and overall application architecture. This module provides the foundation for application startup, configuration management, error handling, and cross-cutting concerns that support all other modules in the Smart Hotel Booking System.

## 🎯 Module Responsibilities

- **Application Startup**: Configure and initialize the ASP.NET Core application
- **Dependency Injection**: Register and configure all services and their lifetimes
- **Authentication & Authorization**: Set up JWT authentication and role-based authorization
- **Database Configuration**: Configure Entity Framework and database connections
- **Middleware Pipeline**: Set up request/response processing pipeline
- **Error Handling**: Global exception handling and error responses
- **API Documentation**: Configure Swagger/OpenAPI documentation
- **Caching**: Set up memory caching for performance optimization
- **CORS & Security**: Configure cross-origin requests and security policies
- **Environment Management**: Handle different environment configurations

## 🏗️ Module Architecture

```
Infrastructure Module
├── Program.cs                    # Application entry point & DI container setup
├── Configuration/                # Configuration classes
│   ├── JwtSettings.cs           # JWT authentication settings
│   ├── CacheSettings.cs         # Memory cache configuration
│   ├── PaymentSettings.cs       # Payment service settings
│   └── LoyaltySettings.cs       # Loyalty program settings
├── Middleware/                   # Custom middleware components
│   └── ErrorHandlingMiddleware.cs # Global error handling
├── Filters/                      # Action filters
│   └── ValidationFilter.cs      # Global model validation
├── Extensions/                   # Extension methods
│   └── ValidationExtensions.cs  # Validation helper methods
├── appsettings.json             # Base application configuration
├── appsettings.Development.json # Development environment settings
└── Properties/
    └── launchSettings.json      # Development launch profiles
```

## 🔧 Key Components

### 1. Program.cs - Application Entry Point

**Purpose**: Configures and starts the ASP.NET Core application with all required services

```csharp
var builder = WebApplication.CreateBuilder(args);

// Service Registration
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>(); // Global validation
});

// Database Configuration
if (builder.Environment.IsDevelopment() && !builder.Configuration.GetValue<bool>("UseLocalDb", true))
{
    builder.Services.AddDbContext<HotelContext>(options =>
        options.UseInMemoryDatabase("FinalDestinationDB"));
}
else
{
    builder.Services.AddDbContext<HotelContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// JWT Authentication
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

**Key Features**:

- Conditional database configuration (SQL Server LocalDB or In-Memory)
- JWT Bearer authentication with comprehensive token validation
- Service registration with proper dependency injection
- Swagger configuration with JWT authentication support
- CORS policy for development environments

### 2. ErrorHandlingMiddleware.cs - Global Error Handler

**Purpose**: Provides consistent error handling across the entire application

```csharp
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

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
            case ArgumentException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = "Invalid request parameters";
                break;
            case KeyNotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Message = "Resource not found";
                break;
            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.Message = "Unauthorized access";
                break;
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Message = "An internal server error occurred";
                break;
        }
    }
}
```

**Key Features**:

- Catches all unhandled exceptions
- Maps exceptions to appropriate HTTP status codes
- Returns consistent JSON error responses
- Logs errors for debugging and monitoring

### 3. Configuration Classes

#### JwtSettings.cs

```csharp
public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryInHours { get; set; } = 24;
}
```

#### CacheSettings.cs

```csharp
public class CacheSettings
{
    public const string SectionName = "Cache";

    public int DefaultExpirationMinutes { get; set; } = 30;
    public int HotelCacheExpirationMinutes { get; set; } = 10;
}
```

#### PaymentSettings.cs

```csharp
public class PaymentSettings
{
    public const string SectionName = "Payment";

    public double MockSuccessRate { get; set; } = 0.9;
    public int ProcessingDelayMs { get; set; } = 1000;
}
```

### 4. Application Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!",
    "Issuer": "FinalDestination",
    "Audience": "FinalDestinationUsers",
    "ExpiryInHours": 24
  },
  "Cache": {
    "DefaultExpirationMinutes": 30,
    "HotelCacheExpirationMinutes": 10
  },
  "Payment": {
    "MockSuccessRate": 0.9,
    "ProcessingDelayMs": 1000
  },
  "Loyalty": {
    "PointsPercentage": 0.1,
    "MinimumBookingAmount": 50.0
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

## 🔄 Service Registration & Dependency Injection

### Core Services

```csharp
// Database Context
builder.Services.AddDbContext<HotelContext>(options => ...);

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme);
builder.Services.AddAuthorization();

// Caching
builder.Services.AddMemoryCache();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));
```

### Business Services

```csharp
// Application Services (Scoped - per request)
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddScoped<IPaymentService, MockPaymentService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IValidationService, ValidationService>();
```

### Service Lifetimes

- **Scoped**: Business services (per HTTP request)
- **Singleton**: Configuration, logging, caching
- **Transient**: Lightweight services without state

## 🛡️ Security Configuration

### JWT Authentication

- **Algorithm**: HMAC SHA-256
- **Token Validation**: Issuer, Audience, Lifetime, Signing Key
- **Clock Skew**: Zero tolerance for token timing
- **Bearer Scheme**: Standard Authorization header format

### CORS Policy

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### Security Headers

- HTTPS redirection enforced
- Secure token transmission
- Content type validation

## 📊 Middleware Pipeline Order

The middleware pipeline is configured in the correct order for optimal security and performance:

```csharp
1. CORS (Development only)
2. Swagger UI (Development only)
3. HTTPS Redirection
4. Error Handling Middleware (Custom)
5. Authentication
6. Authorization
7. Controllers
```

## 🗄️ Database Initialization

### Automatic Database Setup

```csharp
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HotelContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();
        logger.LogInformation("Database initialized successfully");

        // Seed comprehensive sample data
        await DataSeeder.SeedAsync(context);
        logger.LogInformation("Database seeded with sample data successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");
        throw;
    }
}
```

### Database Options

- **Production**: SQL Server LocalDB with persistent storage
- **Development**: In-Memory database for testing (configurable)
- **Automatic Migration**: Database created on first run
- **Sample Data**: Comprehensive seed data for testing

## 📚 API Documentation (Swagger)

### Swagger Configuration

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FinalDestination API",
        Version = "v1",
        Description = "A comprehensive hotel booking API with JWT authentication"
    });

    // JWT Authentication in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });
});
```

### Features

- **Interactive Testing**: Test all endpoints directly from browser
- **JWT Integration**: Authenticate once, test all protected endpoints
- **Default Page**: Swagger UI serves as the application homepage
- **Comprehensive Documentation**: All endpoints documented with examples

## 🔧 Environment Configuration

### Development Environment

- **Database**: SQL Server LocalDB or In-Memory (configurable)
- **Logging**: Detailed logging including EF Core SQL queries
- **CORS**: Permissive policy for frontend development
- **Swagger**: Enabled with full documentation
- **Error Details**: Detailed error information for debugging

### Production Environment

- **Database**: SQL Server with connection pooling
- **Logging**: Warning level and above
- **CORS**: Restricted to specific origins
- **Swagger**: Disabled for security
- **Error Handling**: Generic error messages

## 🚀 Performance Optimizations

### Caching Strategy

- **Memory Cache**: In-memory caching for frequently accessed data
- **Hotel Data**: 10-minute cache expiration
- **General Data**: 30-minute default expiration
- **Cache Keys**: Structured naming convention for easy management

### Database Performance

- **Connection Pooling**: Automatic connection management
- **Lazy Loading**: Disabled for better performance control
- **Query Optimization**: Explicit includes for related data
- **Indexing**: Proper database indexes on frequently queried fields

## 🔍 Monitoring & Logging

### Logging Configuration

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

### Log Categories

- **Application Logs**: Business logic and custom events
- **ASP.NET Core**: Framework-level events
- **Entity Framework**: Database queries and operations
- **Error Logs**: Exceptions and error conditions

## 🧪 Testing Support

### Test Configuration

- **In-Memory Database**: Fast testing without external dependencies
- **Mock Services**: Configurable mock implementations
- **Test Data**: Comprehensive seed data for various scenarios
- **Environment Isolation**: Separate configurations for testing

## 🔧 Configuration Management

### Configuration Sources (Priority Order)

1. **Command Line Arguments**
2. **Environment Variables**
3. **appsettings.{Environment}.json**
4. **appsettings.json**
5. **Default Values**

### Environment-Specific Settings

- **Development**: Detailed logging, permissive CORS, Swagger enabled
- **Production**: Minimal logging, restricted CORS, Swagger disabled
- **Testing**: In-memory database, mock services, fast execution

## 🚨 Error Handling Strategy

### Exception Types & HTTP Status Codes

- **ArgumentException** → 400 Bad Request
- **KeyNotFoundException** → 404 Not Found
- **UnauthorizedAccessException** → 401 Unauthorized
- **InvalidOperationException** → 400 Bad Request
- **TimeoutException** → 408 Request Timeout
- **General Exception** → 500 Internal Server Error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid request parameters",
  "details": "Specific error details here",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

## 📋 Integration Points

### With Other Modules

- **Authentication Module**: Provides JWT configuration and validation
- **Data Module**: Configures Entity Framework and database connections
- **All Business Modules**: Registers services in DI container
- **Frontend**: Serves static files and provides API endpoints

### External Dependencies

- **SQL Server LocalDB**: Database storage
- **ASP.NET Core**: Web framework
- **Entity Framework Core**: ORM
- **JWT Bearer**: Authentication
- **Swagger/OpenAPI**: API documentation

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Problems

```bash
# Check LocalDB status
sqllocaldb info

# Start LocalDB instance
sqllocaldb start mssqllocaldb

# Verify connection string in appsettings.json
```

#### JWT Configuration Issues

```bash
# Ensure JWT key is at least 32 characters
# Verify Issuer and Audience match between generation and validation
# Check token expiration settings
```

#### Port Conflicts

```bash
# Check what's using the port
netstat -ano | findstr :7000

# Update launchSettings.json or kill conflicting process
```

#### Service Registration Errors

- Verify all interfaces have implementations
- Check service lifetime configurations
- Ensure circular dependencies are avoided

### Performance Issues

- Monitor memory cache usage
- Check database query performance
- Review logging levels in production
- Verify connection string optimization

## 📈 Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: No server-side session state
- **Database Connections**: Connection pooling for multiple instances
- **Caching**: Consider Redis for distributed caching
- **Load Balancing**: Ready for load balancer deployment

### Vertical Scaling

- **Memory Management**: Efficient object lifecycle management
- **CPU Optimization**: Async/await patterns throughout
- **I/O Performance**: Optimized database queries
- **Caching Strategy**: Reduces database load

## 🎯 Future Enhancements

### Monitoring & Observability

- **Application Insights**: Azure monitoring integration
- **Health Checks**: Detailed health monitoring endpoints
- **Metrics Collection**: Performance and usage metrics
- **Distributed Tracing**: Request tracing across services

### Security Enhancements

- **Rate Limiting**: API throttling and abuse prevention
- **Security Headers**: Additional security headers
- **Certificate Management**: Automated SSL certificate handling
- **Audit Logging**: Comprehensive audit trail

### Performance Improvements

- **Redis Caching**: Distributed caching for production
- **CDN Integration**: Static asset optimization
- **Database Optimization**: Advanced indexing and query optimization
- **Compression**: Response compression for better performance

This Infrastructure module provides a solid foundation for the entire Smart Hotel Booking System, ensuring scalability, security, and maintainability while supporting all business modules effectively.
