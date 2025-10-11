# FinalDestination API - Troubleshooting Guide

## Table of Contents
- [Database Issues](#database-issues)
- [Authentication & JWT Issues](#authentication--jwt-issues)
- [API Request Issues](#api-request-issues)
- [Performance Issues](#performance-issues)
- [Development Environment Issues](#development-environment-issues)
- [Common Error Messages](#common-error-messages)
- [Debugging Tips](#debugging-tips)

## Database Issues

### Problem: "Cannot open database" or Connection String Errors

**Symptoms:**
- Application fails to start
- Error messages about database connection
- "A network-related or instance-specific error occurred"

**Solutions:**

1. **Check SQL Server LocalDB Installation:**
   ```bash
   # Check if LocalDB is installed
   sqllocaldb info
   
   # If not installed, download SQL Server Express with LocalDB
   # https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   ```

2. **Verify LocalDB Service:**
   ```bash
   # Start LocalDB instance
   sqllocaldb start mssqllocaldb
   
   # Check instance status
   sqllocaldb info mssqllocaldb
   ```

3. **Reset Database:**
   ```bash
   # Delete existing database
   sqllocaldb delete mssqllocaldb
   
   # Create new instance
   sqllocaldb create mssqllocaldb
   
   # Restart application to recreate database
   dotnet run
   ```

4. **Alternative: Use In-Memory Database:**
   ```json
   // In appsettings.Development.json
   {
     "UseLocalDb": false
   }
   ```

### Problem: Database Migration Errors

**Symptoms:**
- "Pending model changes" errors
- Database schema mismatch
- Entity Framework errors

**Solutions:**

1. **Reset Database:**
   ```bash
   # Drop database
   dotnet ef database drop
   
   # Update database
   dotnet ef database update
   ```

2. **Clear EF Cache:**
   ```bash
   # Clear Entity Framework cache
   dotnet ef migrations remove
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

### Problem: Sample Data Not Loading

**Symptoms:**
- Empty database after startup
- No sample users/hotels available
- Login credentials don't work

**Solutions:**

1. **Check DataSeeder Logs:**
   ```json
   // Enable detailed logging in appsettings.Development.json
   {
     "Logging": {
       "LogLevel": {
         "FinalDestinationAPI.Services.DataSeeder": "Debug"
       }
     }
   }
   ```

2. **Manual Data Seeding:**
   ```bash
   # Delete database and restart
   sqllocaldb delete mssqllocaldb
   dotnet run
   ```

3. **Verify Database Connection:**
   - Check connection string in appsettings.json
   - Ensure database name is correct
   - Verify LocalDB is running

## Authentication & JWT Issues

### Problem: 401 Unauthorized Errors

**Symptoms:**
- "Unauthorized" responses from protected endpoints
- JWT token not being accepted
- Authentication header issues

**Solutions:**

1. **Check Token Format:**
   ```bash
   # Correct format
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Common mistakes
   Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Missing "Bearer "
   Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Extra colon
   ```

2. **Verify Token Expiration:**
   ```bash
   # Decode JWT token to check expiration
   # Use https://jwt.io/ or similar tool
   # Check 'exp' claim (Unix timestamp)
   ```

3. **Check JWT Configuration:**
   ```json
   // Verify appsettings.json
   {
     "Jwt": {
       "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!",
       "Issuer": "FinalDestination",
       "Audience": "FinalDestinationUsers",
       "ExpiryInHours": 24
     }
   }
   ```

4. **Login Again:**
   ```bash
   # Get fresh token
   curl -X POST "https://localhost:7000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@hotel.com", "password": "Admin123!"}'
   ```

### Problem: JWT Key Validation Errors

**Symptoms:**
- "SecurityTokenInvalidSignatureException"
- "IDX10503: Signature validation failed"
- Token validation errors in logs

**Solutions:**

1. **Verify JWT Key Length:**
   ```csharp
   // Key must be at least 32 characters (256 bits)
   "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!"
   ```

2. **Check Key Consistency:**
   - Ensure same key used for generation and validation
   - Verify no extra spaces or characters
   - Check environment-specific configurations

3. **Reset JWT Configuration:**
   ```json
   {
     "Jwt": {
       "Key": "NewSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!",
       "Issuer": "FinalDestination",
       "Audience": "FinalDestinationUsers",
       "ExpiryInHours": 24
     }
   }
   ```

### Problem: Role-Based Authorization Failures

**Symptoms:**
- 403 Forbidden errors
- "Insufficient permissions" messages
- Role-based endpoints not accessible

**Solutions:**

1. **Check User Role:**
   ```bash
   # Get current user info
   curl -X GET "https://localhost:7000/api/auth/me" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify Role Requirements:**
   ```csharp
   // Check controller/action role requirements
   [Authorize(Roles = "Admin")]           // Admin only
   [Authorize(Roles = "HotelManager,Admin")] // HotelManager or Admin
   ```

3. **Use Correct Test Accounts:**
   ```
   Admin:         admin@hotel.com / Admin123!
   Hotel Manager: manager@hotel.com / Manager123!
   Guest:         guest@example.com / Guest123!
   ```

## API Request Issues

### Problem: 400 Bad Request - Validation Errors

**Symptoms:**
- "Validation failed" error messages
- Model binding errors
- Required field errors

**Solutions:**

1. **Check Request Format:**
   ```json
   // Correct JSON format
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "SecurePass123!"
   }
   
   // Common mistakes
   {
     name: "John Doe",        // Missing quotes
     "email": john@example.com, // Missing quotes
     "password": ""           // Empty required field
   }
   ```

2. **Verify Content-Type Header:**
   ```bash
   Content-Type: application/json
   ```

3. **Check Field Requirements:**
   ```json
   // Registration example with all required fields
   {
     "name": "John Doe",                    // Required, max 100 chars
     "email": "john@example.com",           // Required, valid email format
     "password": "SecurePass123!",          // Required, min 8 chars
     "contactNumber": "+1234567890",        // Optional
     "role": "Guest"                        // Required: Guest, HotelManager, Admin
   }
   ```

### Problem: 404 Not Found Errors

**Symptoms:**
- "Resource not found" messages
- Incorrect endpoint URLs
- ID-based endpoints failing

**Solutions:**

1. **Verify Endpoint URLs:**
   ```bash
   # Correct endpoints
   GET /api/hotels
   GET /api/hotels/1
   POST /api/bookings
   
   # Common mistakes
   GET /api/hotel          # Missing 's'
   GET /api/hotels/id/1    # Extra 'id/'
   POST /api/booking       # Missing 's'
   ```

2. **Check Resource IDs:**
   ```bash
   # Verify resource exists
   GET /api/hotels/999     # May not exist
   GET /api/hotels/1       # Use valid ID
   ```

3. **Use Swagger UI:**
   - Navigate to `https://localhost:7000`
   - Browse available endpoints
   - Test with provided examples

### Problem: CORS Errors (Browser Requests)

**Symptoms:**
- "CORS policy" errors in browser console
- Cross-origin request blocked
- Preflight request failures

**Solutions:**

1. **Development Environment:**
   ```csharp
   // CORS is enabled for development
   // Check Program.cs configuration
   app.UseCors("DevelopmentPolicy");
   ```

2. **Production Configuration:**
   ```csharp
   // Add specific origins for production
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("ProductionPolicy", policy =>
       {
           policy.WithOrigins("https://yourdomain.com")
                 .AllowAnyMethod()
                 .AllowAnyHeader();
       });
   });
   ```

## Performance Issues

### Problem: Slow API Responses

**Symptoms:**
- Long response times
- Timeout errors
- Poor user experience

**Solutions:**

1. **Check Caching:**
   ```bash
   # Verify cache is working
   # First request should be slower (database)
   # Subsequent requests should be faster (cache)
   curl -w "%{time_total}" "https://localhost:7000/api/hotels"
   ```

2. **Enable Query Logging:**
   ```json
   // In appsettings.Development.json
   {
     "Logging": {
       "LogLevel": {
         "Microsoft.EntityFrameworkCore.Database.Command": "Information"
       }
     }
   }
   ```

3. **Monitor Database Queries:**
   - Check logs for slow queries
   - Verify indexes are being used
   - Look for N+1 query problems

4. **Clear Cache:**
   ```bash
   # Restart application to clear memory cache
   dotnet run
   ```

### Problem: Memory Issues

**Symptoms:**
- OutOfMemoryException
- Application crashes
- High memory usage

**Solutions:**

1. **Check Cache Configuration:**
   ```json
   // Reduce cache expiration times
   {
     "Cache": {
       "DefaultExpirationMinutes": 10,
       "HotelCacheExpirationMinutes": 5
     }
   }
   ```

2. **Monitor Memory Usage:**
   ```bash
   # Use performance counters or profiling tools
   # Check for memory leaks in custom code
   ```

## Development Environment Issues

### Problem: Port Conflicts

**Symptoms:**
- "Port already in use" errors
- Application fails to start
- Connection refused errors

**Solutions:**

1. **Check Port Usage:**
   ```bash
   # Windows
   netstat -ano | findstr :7000
   
   # Kill process using port
   taskkill /PID <process_id> /F
   ```

2. **Change Port Configuration:**
   ```json
   // In Properties/launchSettings.json
   {
     "profiles": {
       "https": {
         "applicationUrl": "https://localhost:7001;http://localhost:5001"
       }
     }
   }
   ```

### Problem: SSL Certificate Issues

**Symptoms:**
- SSL certificate warnings
- HTTPS connection errors
- Certificate trust issues

**Solutions:**

1. **Trust Development Certificate:**
   ```bash
   dotnet dev-certs https --trust
   ```

2. **Regenerate Certificate:**
   ```bash
   dotnet dev-certs https --clean
   dotnet dev-certs https --trust
   ```

### Problem: Hot Reload Not Working

**Symptoms:**
- Changes not reflected without restart
- Development experience issues
- File watching problems

**Solutions:**

1. **Enable Hot Reload:**
   ```bash
   dotnet watch run
   ```

2. **Check File Permissions:**
   - Ensure files are not read-only
   - Check antivirus software interference
   - Verify file system permissions

## Common Error Messages

### "The ConnectionString property has not been initialized"

**Cause:** Missing or incorrect connection string configuration.

**Solution:**
```json
// Check appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

### "Unable to resolve service for type"

**Cause:** Dependency injection configuration missing.

**Solution:**
```csharp
// Check Program.cs service registration
builder.Services.AddScoped<IServiceInterface, ServiceImplementation>();
```

### "Sequence contains no elements"

**Cause:** Database query returning no results when expecting at least one.

**Solution:**
- Use `FirstOrDefault()` instead of `First()`
- Check if data exists before querying
- Verify sample data is seeded correctly

### "A task was canceled"

**Cause:** Request timeout or cancellation token triggered.

**Solution:**
- Check for long-running operations
- Verify database connectivity
- Increase timeout values if necessary

## Debugging Tips

### Enable Detailed Logging

```json
// In appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information",
      "FinalDestinationAPI": "Debug"
    }
  }
}
```

### Use Swagger UI for Testing

1. Navigate to `https://localhost:7000`
2. Click "Authorize" button
3. Enter JWT token: `Bearer <your-token>`
4. Test endpoints with provided examples

### Check Application Logs

```bash
# View console output for errors
# Look for stack traces and error messages
# Check Entity Framework query logs
```

### Verify Sample Data

```bash
# Check if sample data is loaded
curl "https://localhost:7000/api/hotels"

# Should return 6 hotels
# If empty, check DataSeeder logs
```

### Test Authentication Flow

```bash
# 1. Register new user
curl -X POST "https://localhost:7000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "Test123!", "role": "Guest"}'

# 2. Login to get token
curl -X POST "https://localhost:7000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'

# 3. Use token for protected endpoints
curl -X GET "https://localhost:7000/api/auth/me" \
  -H "Authorization: Bearer <token-from-step-2>"
```

### Database Inspection

```bash
# Connect to LocalDB using SQL Server Management Studio
# Server name: (localdb)\mssqllocaldb
# Database: FinalDestinationDB

# Or use command line
sqlcmd -S "(localdb)\mssqllocaldb" -d FinalDestinationDB -E
```

### Performance Monitoring

```bash
# Monitor response times
curl -w "Time: %{time_total}s\n" "https://localhost:7000/api/hotels"

# Check memory usage in Task Manager
# Monitor CPU usage during requests
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs** for detailed error messages
2. **Review the API documentation** for correct request formats
3. **Test with Swagger UI** to isolate the problem
4. **Verify your environment** meets the prerequisites
5. **Try the sample requests** provided in this guide

Remember to include relevant error messages, logs, and steps to reproduce when seeking help.




