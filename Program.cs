using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Reflection;
using SimpleHotelAPI.Data;
using SimpleHotelAPI.Services;
using SimpleHotelAPI.Middleware;
using SimpleHotelAPI.Filters;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers(options =>
{
    // Add global validation filter
    options.Filters.Add<ValidationFilter>();
});

// Database Configuration - SQL Server LocalDB or In-Memory for testing
if (builder.Environment.IsDevelopment() && !builder.Configuration.GetValue<bool>("UseLocalDb", true))
{
    // Use In-Memory database for testing when LocalDB is not available
    builder.Services.AddDbContext<HotelContext>(options =>
        options.UseInMemoryDatabase("SimpleHotelSystemDB"));
}
else
{
    // Use SQL Server LocalDB for production-like development
    builder.Services.AddDbContext<HotelContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// Authentication Configuration - JWT Bearer
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
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Memory Cache for simple caching
builder.Services.AddMemoryCache();

// AutoMapper for object mapping
builder.Services.AddAutoMapper(typeof(Program));

// Register application services
builder.Services.AddScoped<SimpleHotelAPI.Interfaces.IJwtService, SimpleHotelAPI.Services.JwtService>();
builder.Services.AddScoped<SimpleHotelAPI.Interfaces.ICacheService, SimpleHotelAPI.Services.CacheService>();
builder.Services.AddScoped<SimpleHotelAPI.Interfaces.IPaymentService, SimpleHotelAPI.Services.MockPaymentService>();
builder.Services.AddScoped<SimpleHotelAPI.Interfaces.IReviewService, SimpleHotelAPI.Services.ReviewService>();
builder.Services.AddScoped<SimpleHotelAPI.Interfaces.ILoyaltyService, SimpleHotelAPI.Services.LoyaltyService>();
builder.Services.AddScoped<SimpleHotelAPI.Services.IValidationService, SimpleHotelAPI.Services.ValidationService>();

// Swagger Configuration with JWT Authentication
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Simple Hotel System API",
        Version = "v1",
        Description = "A learning-focused hotel booking API with JWT authentication",
        Contact = new OpenApiContact
        {
            Name = "Simple Hotel System",
            Email = "support@simplehotel.com"
        }
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments for better documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// CORS Configuration for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentPolicy");
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Simple Hotel System API v1");
        c.RoutePrefix = string.Empty; // Makes Swagger UI the default page
        c.DocumentTitle = "Simple Hotel System API";
        c.DefaultModelsExpandDepth(-1); // Hide schemas section by default
    });
}

app.UseHttpsRedirection();

// Global error handling middleware (must be early in pipeline)
app.UseMiddleware<ErrorHandlingMiddleware>();

// Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Database initialization and seeding
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

app.Run();