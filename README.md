# FinalDestination API

A comprehensive luxury hotel booking management system built with ASP.NET Core 8 Web API and JWT authentication. FinalDestination provides an elegant and complete hotel booking experience with advanced features for authentication, payment processing, reviews, and loyalty rewards.

## 🚀 Features

- **🔐 User Authentication**: JWT-based authentication with role-based authorization (Guest, HotelManager, Admin)
- **🏨 Hotel Management**: Full CRUD operations for hotels with search, filtering, and caching
- **📅 Booking System**: Complete booking workflow with room availability, payment integration, and cancellation
- **⭐ Review System**: Hotel ratings and reviews with automatic rating calculation and validation
- **🎁 Loyalty Program**: Points-based rewards system with transaction history and automatic point calculation
- **💳 Payment Processing**: Mock payment service with realistic success/failure simulation and refund support
- **⚡ Caching**: Memory-based caching for improved performance with configurable expiration
- **📚 API Documentation**: Comprehensive Swagger UI with JWT authentication support and detailed examples
- **🛡️ Error Handling**: Global error handling middleware with consistent error responses
- **✅ Data Validation**: Comprehensive input validation with custom attributes and business rule validation

## 🛠️ Technology Stack

- **Framework**: ASP.NET Core 8 Web API
- **Database**: Entity Framework Core 9 with SQL Server LocalDB
- **Authentication**: JWT Bearer tokens with role-based authorization
- **Password Hashing**: BCrypt.Net-Next for secure password storage
- **Caching**: IMemoryCache (built-in) with configurable expiration policies
- **Documentation**: Swagger/Swashbuckle with JWT support and XML comments
- **Object Mapping**: AutoMapper for DTO transformations
- **Validation**: FluentValidation with custom validation attributes
- **Logging**: Built-in ASP.NET Core logging with structured logging

## 📋 Prerequisites

- **.NET 8 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
- **SQL Server LocalDB** (included with Visual Studio or SQL Server Express)
- **Visual Studio 2022** or **VS Code** (recommended)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd FinalDestinationAPI
```

### 2. Restore Dependencies

```bash
dotnet restore
```

### 3. Database Setup

The application uses SQL Server LocalDB which will be automatically created on first run. No manual database setup required.

**Alternative: Use In-Memory Database**
```bash
# Set UseLocalDb to false in appsettings.Development.json for in-memory database
```

### 4. Run the Application

```bash
dotnet run
```

### 5. Access the API

- **🌐 Swagger UI**: `https://localhost:7000` (default page)
- **📡 API Base URL**: `https://localhost:7000/api`
- **🔍 Health Check**: `https://localhost:7000/health`

## ⚙️ Configuration

### Connection Strings

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

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

### Cache Configuration

```json
{
  "Cache": {
    "DefaultExpirationMinutes": 30,
    "HotelCacheExpirationMinutes": 10
  }
}
```

### Payment Configuration

```json
{
  "Payment": {
    "MockSuccessRate": 0.9,
    "ProcessingDelayMs": 1000
  }
}
```

### Loyalty Configuration

```json
{
  "Loyalty": {
    "PointsPercentage": 0.1,
    "MinimumBookingAmount": 50.0
  }
}
```

## 📁 Project Structure

```
FinalDestinationAPI/
├── 📁 Configuration/          # Configuration classes and settings
│   ├── CacheSettings.cs
│   ├── JwtSettings.cs
│   ├── LoyaltySettings.cs
│   └── PaymentSettings.cs
├── 📁 Controllers/           # API controllers with endpoints
│   ├── AuthController.cs     # Authentication endpoints
│   ├── BookingsController.cs # Booking management
│   ├── HotelsController.cs   # Hotel CRUD operations
│   ├── LoyaltyController.cs  # Loyalty points management
│   ├── PaymentsController.cs # Payment processing
│   └── ReviewsController.cs  # Review and rating system
├── 📁 Data/                 # Entity Framework context
│   └── HotelContext.cs      # Database context with configurations
├── 📁 DTOs/                 # Data Transfer Objects
│   ├── AuthResponse.cs      # Authentication responses
│   ├── BookingResponse.cs   # Booking data transfer
│   ├── CreateBookingRequest.cs
│   ├── PaymentRequest.cs
│   └── ... (other DTOs)
├── 📁 Extensions/           # Extension methods
│   └── ValidationExtensions.cs
├── 📁 Filters/              # Action filters
│   └── ValidationFilter.cs  # Global validation filter
├── 📁 Interfaces/           # Service interfaces
│   ├── ICacheService.cs
│   ├── IJwtService.cs
│   ├── IPaymentService.cs
│   └── ... (other interfaces)
├── 📁 Middleware/           # Custom middleware
│   └── ErrorHandlingMiddleware.cs
├── 📁 Models/              # Entity models
│   ├── User.cs             # User entity with roles
│   ├── Hotel.cs            # Hotel entity
│   ├── Booking.cs          # Booking entity
│   ├── Review.cs           # Review entity
│   ├── Payment.cs          # Payment entity
│   └── ... (other models)
├── 📁 Services/            # Business logic services
│   ├── CacheService.cs     # Memory caching implementation
│   ├── DataSeeder.cs       # Sample data seeding
│   ├── JwtService.cs       # JWT token management
│   ├── LoyaltyService.cs   # Loyalty points logic
│   ├── MockPaymentService.cs # Payment simulation
│   └── ... (other services)
├── 📁 Validation/          # Custom validation
│   └── CustomValidationAttributes.cs
├── Program.cs              # Application entry point
├── GlobalUsings.cs         # Global using statements
└── appsettings.json        # Configuration settings
```

## 🌐 API Endpoints

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/api/auth/register` | Register new user | ❌ | - |
| `POST` | `/api/auth/login` | User login | ❌ | - |
| `POST` | `/api/auth/refresh` | Refresh JWT token | ✅ | All |
| `GET` | `/api/auth/me` | Get current user info | ✅ | All |

#### Register User Example
```bash
curl -X POST "https://localhost:7000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "contactNumber": "+1234567890",
    "role": "Guest"
  }'
```

#### Login Example
```bash
curl -X POST "https://localhost:7000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hotel.com",
    "password": "Admin123!"
  }'
```

### 🏨 Hotel Management Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/hotels` | Get all hotels (cached) | ❌ | - |
| `GET` | `/api/hotels/{id}` | Get hotel by ID | ❌ | - |
| `GET` | `/api/hotels/search` | Search hotels | ❌ | - |
| `POST` | `/api/hotels` | Create hotel | ✅ | HotelManager, Admin |
| `PUT` | `/api/hotels/{id}` | Update hotel | ✅ | HotelManager, Admin |
| `DELETE` | `/api/hotels/{id}` | Delete hotel | ✅ | Admin |

#### Search Hotels Example
```bash
curl -X GET "https://localhost:7000/api/hotels/search?city=Miami&maxPrice=250&minRating=4.0"
```

#### Create Hotel Example
```bash
curl -X POST "https://localhost:7000/api/hotels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luxury Resort",
    "address": "123 Beach Ave",
    "city": "Miami",
    "pricePerNight": 299.99,
    "availableRooms": 50
  }'
```

### 📅 Booking Management Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/bookings` | Get all bookings | ✅ | Admin |
| `GET` | `/api/bookings/{id}` | Get booking by ID | ✅ | All (own bookings) |
| `GET` | `/api/bookings/my` | Get current user's bookings | ✅ | All |
| `GET` | `/api/bookings/search` | Search bookings by email | ✅ | All |
| `POST` | `/api/bookings` | Create booking | ✅ | All |
| `POST` | `/api/bookings/{id}/payment` | Process payment | ✅ | All |
| `PUT` | `/api/bookings/{id}/cancel` | Cancel booking | ✅ | All (own bookings) |

#### Create Booking Example
```bash
curl -X POST "https://localhost:7000/api/bookings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": 1,
    "checkInDate": "2024-12-01",
    "checkOutDate": "2024-12-03",
    "numberOfGuests": 2,
    "guestName": "John Doe",
    "guestEmail": "john@example.com"
  }'
```

#### Process Payment Example
```bash
curl -X POST "https://localhost:7000/api/bookings/1/payment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300.00,
    "currency": "USD",
    "paymentMethod": "CreditCard",
    "cardNumber": "4111111111111111",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123"
  }'
```

### ⭐ Review System Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/reviews/hotel/{hotelId}` | Get hotel reviews | ❌ | - |
| `POST` | `/api/reviews` | Submit review | ✅ | All |
| `PUT` | `/api/reviews/{id}` | Update review | ✅ | All (own reviews) |
| `DELETE` | `/api/reviews/{id}` | Delete review | ✅ | All (own reviews), Admin |

#### Submit Review Example
```bash
curl -X POST "https://localhost:7000/api/reviews" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": 1,
    "rating": 5,
    "comment": "Excellent service and beautiful rooms!"
  }'
```

### 🎁 Loyalty Program Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/loyalty/account` | Get loyalty account | ✅ | All |
| `GET` | `/api/loyalty/transactions` | Get points history | ✅ | All |

### 💳 Payment Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/payments/{id}` | Get payment details | ✅ | All (own payments), Admin |
| `POST` | `/api/payments/{id}/refund` | Process refund | ✅ | Admin |

## 🔐 Authentication & Authorization

The API uses **JWT Bearer token authentication** with role-based authorization:

### User Roles
- **Guest**: Can create bookings, submit reviews, view loyalty points
- **HotelManager**: Can manage hotels, view all bookings
- **Admin**: Full access to all endpoints

### Using Authentication

1. **Register or Login** to get a JWT token
2. **Include the token** in the Authorization header: `Bearer <your-token>`
3. **Use Swagger UI** "Authorize" button for easy testing

### JWT Token Structure
```json
{
  "sub": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "Guest",
  "exp": 1640995200,
  "iss": "FinalDestination",
  "aud": "FinalDestinationUsers"
}
```

## 🎯 Sample Data

The application automatically seeds comprehensive sample data on startup using the `DataSeeder` service:

### 👥 Users (8 total)
- **1 Admin**: John Admin (admin@hotel.com / Admin123!)
- **2 Hotel Managers**: Jane Manager (manager@hotel.com / Manager123!), Mike Wilson
- **5 Guests**: Bob Guest (guest@example.com / Guest123!), Alice Johnson, Charlie Brown, Diana Prince, Edward Smith

### 🏨 Hotels (6 total)
| Hotel | City | Price/Night | Rating | Available Rooms |
|-------|------|-------------|--------|-----------------|
| Grand Plaza Hotel | New York | $150 | 4.5★ | 48 |
| Ocean View Resort | Miami | $200 | 5.0★ | 28 |
| Mountain Lodge | Denver | $120 | 4.0★ | 24 |
| Downtown Business Hotel | Chicago | $180 | 3.5★ | 35 |
| Sunset Beach Resort | Los Angeles | $250 | 4.5★ | 40 |
| Historic Inn | Boston | $130 | 4.0★ | 20 |

### 📊 Complete Test Data
- **8 Bookings**: Mix of completed, confirmed, and cancelled bookings
- **10 Reviews**: Realistic reviews with detailed comments and ratings
- **5 Loyalty Accounts**: With points balances and transaction history
- **8 Payments**: Including successful payments and one refund scenario
- **9 Points Transactions**: Linked to bookings with proper calculations

### 🔑 Login Credentials for Testing
```
Admin:         admin@hotel.com / Admin123!
Hotel Manager: manager@hotel.com / Manager123!
Guest:         guest@example.com / Guest123!
```

All sample data maintains proper relationships and provides realistic scenarios for testing all API functionality.

## 📚 Learning Resources

This project demonstrates key ASP.NET Core concepts:

### 🏗️ Architecture Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **Dependency Injection**: Loose coupling and testability
- **DTO Pattern**: Data transfer and validation

### 🔧 ASP.NET Core Features
- **RESTful API Design**: HTTP methods and status codes
- **JWT Authentication**: Token-based security
- **Role-based Authorization**: Access control
- **Entity Framework Core**: ORM and database operations
- **Data Validation**: Model validation and custom attributes
- **Error Handling**: Global exception handling
- **Caching**: Performance optimization
- **Swagger Documentation**: API documentation and testing

### 🛠️ Development Practices
- **Configuration Management**: appsettings.json and environment-specific configs
- **Logging**: Structured logging with different log levels
- **Data Seeding**: Automated test data generation
- **Mock Services**: Testing without external dependencies

## 🚀 Next Steps & Enhancements

### 🧪 Testing
- Add unit tests with xUnit and Moq
- Implement integration tests with TestServer
- Add performance testing with NBomber
- Create API tests with Postman collections

### 🔧 Advanced Features
- Implement email notifications with SendGrid
- Add file upload for hotel images with Azure Blob Storage
- Implement advanced search with Elasticsearch
- Add real-time notifications with SignalR
- Implement rate limiting and throttling
- Add API versioning support

### 🌐 Deployment
- Deploy to Azure App Service
- Set up CI/CD with GitHub Actions
- Configure Application Insights for monitoring
- Implement health checks and metrics

### 🔒 Security Enhancements
- Add refresh token rotation
- Implement account lockout policies
- Add two-factor authentication
- Implement CORS policies for production

## 🐛 Troubleshooting

### 🗄️ Database Issues

**Problem**: Database connection errors
```
Solution:
1. Ensure SQL Server LocalDB is installed
2. Check connection string in appsettings.json
3. Verify LocalDB service is running: sqllocaldb info
4. Delete database and restart app to recreate
```

**Problem**: Migration errors
```bash
# Reset database
dotnet ef database drop
dotnet ef database update
```

### 🔐 JWT Issues

**Problem**: 401 Unauthorized errors
```
Solution:
1. Verify JWT key is at least 32 characters
2. Check token expiration time
3. Ensure proper Authorization header format: "Bearer <token>"
4. Verify token is not expired
```

**Problem**: Token validation errors
```
Solution:
1. Check Issuer and Audience configuration
2. Verify JWT key matches between generation and validation
3. Ensure system clock is synchronized
```

### 🌐 Port Conflicts

**Problem**: Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :7000

# Update launchSettings.json to use different ports
# Or kill the process using the port
```

### 🚀 Performance Issues

**Problem**: Slow API responses
```
Solution:
1. Check if caching is working properly
2. Review database queries in logs
3. Ensure database indexes are created
4. Monitor memory usage
```

### 📝 Logging and Debugging

**Enable detailed logging in appsettings.Development.json:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful GET requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful PUT/DELETE requests
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server errors

## 📚 Additional Documentation

This project includes comprehensive documentation to help you learn and work with the API:

- **[📖 Complete API Documentation](API_DOCUMENTATION.md)** - Detailed endpoint documentation with request/response examples
- **[🚀 Setup Guide](SETUP_GUIDE.md)** - Step-by-step setup instructions for different environments
- **[🐛 Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[🎓 Learning Resources](LEARNING_RESOURCES.md)** - Learning path, exercises, and next steps for developers

## 📞 Support

For questions or issues:
1. **Check the [Troubleshooting Guide](TROUBLESHOOTING.md)** for common solutions
2. **Review the [API Documentation](API_DOCUMENTATION.md)** for endpoint details
3. **Follow the [Setup Guide](SETUP_GUIDE.md)** for installation help
4. **Use the Swagger UI** documentation at `https://localhost:7000`
5. **Check application logs** for detailed error information
6. **Examine the sample data** seeding process in `DataSeeder.cs`

## 🎯 Quick Start

1. **Prerequisites**: .NET 8 SDK, SQL Server LocalDB
2. **Clone**: `git clone <repository-url>`
3. **Run**: `dotnet run`
4. **Access**: `https://localhost:7000` (Swagger UI)
5. **Login**: Use `admin@hotel.com / Admin123!` for testing

For detailed setup instructions, see the [Setup Guide](SETUP_GUIDE.md).

## 📄 License

This project is designed for educational purposes and learning ASP.NET Core development.

---

**Happy Learning! 🚀** This FinalDestination API provides a solid foundation for understanding ASP.NET Core concepts. Use the comprehensive documentation to guide your learning journey and build upon this foundation to create more advanced applications.




