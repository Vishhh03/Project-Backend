# Data Layer Module Documentation

**Team**: Database Team  
**Module Owner**: Entity Framework & Data Management  
**Last Updated**: December 2024

## 📋 Module Overview

The Data Layer module manages all database operations, entity relationships, and data persistence using Entity Framework Core 9. This module provides the foundation for all data access across the application, ensuring data integrity, performance, and maintainability through proper entity configuration and database design.

## 🎯 Module Responsibilities

- Entity Framework Core configuration and setup
- Database context management
- Entity model definitions and relationships
- Database migrations and schema management
- Data seeding and initialization
- Query optimization and performance
- Database connection management
- Data validation and constraints

## 🏗️ Module Architecture

```
Data Layer Module
├── Data/
│   └── HotelContext.cs          # Main database context
├── Models/
│   ├── User.cs                  # User entity
│   ├── Hotel.cs                 # Hotel entity
│   ├── Booking.cs               # Booking entity
│   ├── Review.cs                # Review entity
│   ├── Payment.cs               # Payment entity
│   ├── LoyaltyAccount.cs        # Loyalty account entity
│   └── PointsTransaction.cs     # Points transaction entity
├── Services/
│   └── DataSeeder.cs           # Database seeding service
└── Migrations/
    └── (Auto-generated EF migrations)
```

## 🔧 Key Components

### 1. HotelContext.cs

**Purpose**: Main Entity Framework database context with complete entity configuration

```csharp
public class HotelContext : DbContext
{
    public HotelContext(DbContextOptions<HotelContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; }
    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<LoyaltyAccount> LoyaltyAccounts { get; set; }
    public DbSet<PointsTransaction> PointsTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configuration
        ConfigureUserEntity(modelBuilder);
        
        // Hotel Configuration
        ConfigureHotelEntity(modelBuilder);
        
        // Booking Configuration
        ConfigureBookingEntity(modelBuilder);
        
        // Review Configuration
        ConfigureReviewEntity(modelBuilder);
        
        // Payment Configuration
        ConfigurePaymentEntity(modelBuilder);
        
        // Loyalty Configuration
        ConfigureLoyaltyEntities(modelBuilder);
    }

    private void ConfigureUserEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Unique constraints
            entity.HasIndex(e => e.Email)
                  .IsUnique()
                  .HasDatabaseName("IX_Users_Email");

            // Property configurations
            entity.Property(e => e.Name)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.Email)
                  .IsRequired()
                  .HasMaxLength(255);

            entity.Property(e => e.PasswordHash)
                  .IsRequired()
                  .HasMaxLength(255);

            entity.Property(e => e.ContactNumber)
                  .HasMaxLength(20);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.IsActive)
                  .HasDefaultValue(true);

            // Enum configuration
            entity.Property(e => e.Role)
                  .HasConversion<int>();
        });
    }

    private void ConfigureHotelEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Hotel>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes for search optimization
            entity.HasIndex(e => e.City)
                  .HasDatabaseName("IX_Hotels_City");

            entity.HasIndex(e => e.PricePerNight)
                  .HasDatabaseName("IX_Hotels_Price");

            entity.HasIndex(e => e.Rating)
                  .HasDatabaseName("IX_Hotels_Rating");

            // Composite index for common search patterns
            entity.HasIndex(e => new { e.City, e.PricePerNight })
                  .HasDatabaseName("IX_Hotels_City_Price");

            // Property configurations
            entity.Property(e => e.Name)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(e => e.Address)
                  .IsRequired()
                  .HasMaxLength(500);

            entity.Property(e => e.City)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.PricePerNight)
                  .HasPrecision(10, 2)
                  .IsRequired();

            entity.Property(e => e.Rating)
                  .HasPrecision(3, 2)
                  .HasDefaultValue(0.0m);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Foreign key relationships
            entity.HasOne(e => e.Manager)
                  .WithMany()
                  .HasForeignKey(e => e.ManagerId)
                  .OnDelete(DeleteBehavior.SetNull);

            // One-to-many relationships
            entity.HasMany(e => e.Bookings)
                  .WithOne(b => b.Hotel)
                  .HasForeignKey(b => b.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Reviews)
                  .WithOne(r => r.Hotel)
                  .HasForeignKey(r => r.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureBookingEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes for performance
            entity.HasIndex(e => e.UserId)
                  .HasDatabaseName("IX_Bookings_UserId");

            entity.HasIndex(e => e.HotelId)
                  .HasDatabaseName("IX_Bookings_HotelId");

            entity.HasIndex(e => new { e.CheckInDate, e.CheckOutDate })
                  .HasDatabaseName("IX_Bookings_Dates");

            entity.HasIndex(e => e.Status)
                  .HasDatabaseName("IX_Bookings_Status");

            // Property configurations
            entity.Property(e => e.GuestName)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(e => e.GuestEmail)
                  .IsRequired()
                  .HasMaxLength(255);

            entity.Property(e => e.TotalAmount)
                  .HasPrecision(10, 2)
                  .IsRequired();

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Enum configuration
            entity.Property(e => e.Status)
                  .HasConversion<int>()
                  .HasDefaultValue(BookingStatus.Confirmed);

            // Foreign key relationships
            entity.HasOne(e => e.Hotel)
                  .WithMany(h => h.Bookings)
                  .HasForeignKey(e => e.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Bookings)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Check constraints
            entity.HasCheckConstraint("CK_Booking_Dates", 
                "[CheckOutDate] > [CheckInDate]");

            entity.HasCheckConstraint("CK_Booking_Guests", 
                "[NumberOfGuests] > 0 AND [NumberOfGuests] <= 10");
        });
    }

    private void ConfigureReviewEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Review>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => e.HotelId)
                  .HasDatabaseName("IX_Reviews_HotelId");

            entity.HasIndex(e => e.UserId)
                  .HasDatabaseName("IX_Reviews_UserId");

            entity.HasIndex(e => new { e.HotelId, e.CreatedAt })
                  .HasDatabaseName("IX_Reviews_Hotel_Date");

            // Unique constraint - one review per user per hotel
            entity.HasIndex(e => new { e.UserId, e.HotelId })
                  .IsUnique()
                  .HasDatabaseName("IX_Reviews_User_Hotel_Unique");

            // Property configurations
            entity.Property(e => e.Comment)
                  .HasMaxLength(1000);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Foreign key relationships
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Reviews)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Hotel)
                  .WithMany(h => h.Reviews)
                  .HasForeignKey(e => e.HotelId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Check constraints
            entity.HasCheckConstraint("CK_Review_Rating", 
                "[Rating] >= 1 AND [Rating] <= 5");
        });
    }

    private void ConfigurePaymentEntity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Payment>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => e.BookingId)
                  .HasDatabaseName("IX_Payments_BookingId");

            entity.HasIndex(e => e.TransactionId)
                  .IsUnique()
                  .HasDatabaseName("IX_Payments_TransactionId");

            entity.HasIndex(e => e.Status)
                  .HasDatabaseName("IX_Payments_Status");

            // Property configurations
            entity.Property(e => e.Amount)
                  .HasPrecision(10, 2)
                  .IsRequired();

            entity.Property(e => e.Currency)
                  .HasMaxLength(3)
                  .HasDefaultValue("USD");

            entity.Property(e => e.TransactionId)
                  .HasMaxLength(100);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Enum configurations
            entity.Property(e => e.PaymentMethod)
                  .HasConversion<int>();

            entity.Property(e => e.Status)
                  .HasConversion<int>()
                  .HasDefaultValue(PaymentStatus.Pending);

            // Foreign key relationships
            entity.HasOne(e => e.Booking)
                  .WithMany()
                  .HasForeignKey(e => e.BookingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureLoyaltyEntities(ModelBuilder modelBuilder)
    {
        // Loyalty Account Configuration
        modelBuilder.Entity<LoyaltyAccount>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Unique constraint - one loyalty account per user
            entity.HasIndex(e => e.UserId)
                  .IsUnique()
                  .HasDatabaseName("IX_LoyaltyAccounts_UserId");

            // Property configurations
            entity.Property(e => e.PointsBalance)
                  .HasDefaultValue(0);

            entity.Property(e => e.TotalPointsEarned)
                  .HasDefaultValue(0);

            entity.Property(e => e.LastUpdated)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Foreign key relationships
            entity.HasOne(e => e.User)
                  .WithOne(u => u.LoyaltyAccount)
                  .HasForeignKey<LoyaltyAccount>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Transactions)
                  .WithOne(pt => pt.LoyaltyAccount)
                  .HasForeignKey(pt => pt.LoyaltyAccountId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Points Transaction Configuration
        modelBuilder.Entity<PointsTransaction>(entity =>
        {
            // Primary key
            entity.HasKey(e => e.Id);

            // Indexes
            entity.HasIndex(e => e.LoyaltyAccountId)
                  .HasDatabaseName("IX_PointsTransactions_LoyaltyAccountId");

            entity.HasIndex(e => e.BookingId)
                  .HasDatabaseName("IX_PointsTransactions_BookingId");

            entity.HasIndex(e => new { e.LoyaltyAccountId, e.CreatedAt })
                  .HasDatabaseName("IX_PointsTransactions_Account_Date");

            // Property configurations
            entity.Property(e => e.Description)
                  .IsRequired()
                  .HasMaxLength(500);

            entity.Property(e => e.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Foreign key relationships
            entity.HasOne(e => e.LoyaltyAccount)
                  .WithMany(la => la.Transactions)
                  .HasForeignKey(e => e.LoyaltyAccountId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Booking)
                  .WithMany()
                  .HasForeignKey(e => e.BookingId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
```

**Why This Design**:
- **Comprehensive configuration**: All entities properly configured with constraints
- **Performance optimization**: Strategic indexing for common query patterns
- **Data integrity**: Check constraints and foreign key relationships
- **Flexibility**: Proper nullable relationships and cascade behaviors
- **Audit trail**: Automatic timestamp management

### 2. Entity Models

**Purpose**: Complete entity definitions with proper relationships and validation

```csharp
// User.cs - Core user entity
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

// Hotel.cs - Hotel entity with relationships
public class Hotel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int AvailableRooms { get; set; }
    public decimal Rating { get; set; }
    public int? ManagerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User? Manager { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

// Booking.cs - Booking entity with business logic
public class Booking
{
    public int Id { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public int? UserId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Hotel Hotel { get; set; } = null!;
    public User? User { get; set; }

    // Calculated Properties
    public int NumberOfNights => (CheckOutDate - CheckInDate).Days;
    public bool IsActive => Status == BookingStatus.Confirmed;
    public bool CanBeCancelled => CheckInDate > DateTime.Today.AddDays(1);
}

public enum BookingStatus
{
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3
}
```

### 3. DataSeeder.cs

**Purpose**: Provides comprehensive sample data for development and testing

```csharp
public class DataSeeder
{
    private readonly HotelContext _context;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(HotelContext context, ILogger<DataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Check if data already exists
            if (await _context.Users.AnyAsync())
            {
                _logger.LogInformation("Database already contains data, skipping seeding");
                return;
            }

            _logger.LogInformation("Starting database seeding...");

            // Seed in order of dependencies
            await SeedUsersAsync();
            await SeedHotelsAsync();
            await SeedBookingsAsync();
            await SeedReviewsAsync();
            await SeedLoyaltyAccountsAsync();
            await SeedPaymentsAsync();
            await SeedPointsTransactionsAsync();

            await _context.SaveChangesAsync();

            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database seeding");
            throw;
        }
    }

    private async Task SeedUsersAsync()
    {
        var users = new List<User>
        {
            new User
            {
                Id = 1,
                Name = "John Admin",
                Email = "admin@hotel.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                ContactNumber = "+1234567890",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                IsActive = true
            },
            new User
            {
                Id = 2,
                Name = "Jane Manager",
                Email = "manager@hotel.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
                Role = UserRole.HotelManager,
                ContactNumber = "+1234567891",
                CreatedAt = DateTime.UtcNow.AddDays(-25),
                IsActive = true
            },
            new User
            {
                Id = 3,
                Name = "Bob Guest",
                Email = "guest@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guest123!"),
                Role = UserRole.Guest,
                ContactNumber = "+1234567892",
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                IsActive = true
            },
            // Additional users...
        };

        _context.Users.AddRange(users);
        _logger.LogInformation("Seeded {Count} users", users.Count);
    }

    private async Task SeedHotelsAsync()
    {
        var hotels = new List<Hotel>
        {
            new Hotel
            {
                Id = 1,
                Name = "Grand Plaza Hotel",
                Address = "123 Main St",
                City = "New York",
                PricePerNight = 150.00m,
                AvailableRooms = 48,
                Rating = 4.5m,
                ManagerId = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Hotel
            {
                Id = 2,
                Name = "Ocean View Resort",
                Address = "456 Beach Ave",
                City = "Miami",
                PricePerNight = 200.00m,
                AvailableRooms = 28,
                Rating = 5.0m,
                ManagerId = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-18)
            },
            // Additional hotels...
        };

        _context.Hotels.AddRange(hotels);
        _logger.LogInformation("Seeded {Count} hotels", hotels.Count);
    }

    private async Task SeedBookingsAsync()
    {
        var bookings = new List<Booking>
        {
            new Booking
            {
                Id = 1,
                GuestName = "Bob Guest",
                GuestEmail = "guest@example.com",
                HotelId = 1,
                UserId = 3,
                CheckInDate = DateTime.Today.AddDays(-10),
                CheckOutDate = DateTime.Today.AddDays(-8),
                NumberOfGuests = 2,
                TotalAmount = 300.00m,
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },
            // Additional bookings...
        };

        _context.Bookings.AddRange(bookings);
        _logger.LogInformation("Seeded {Count} bookings", bookings.Count);
    }

    // Additional seeding methods for Reviews, Payments, Loyalty, etc.
}
```

## 🗄️ Database Schema Design

### Entity Relationship Diagram

```
┌─────────────┐    1:N     ┌─────────────┐    N:1     ┌─────────────┐
│    User     │◄──────────►│   Booking   │◄──────────►│    Hotel    │
│             │            │             │            │             │
│ - Id (PK)   │            │ - Id (PK)   │            │ - Id (PK)   │
│ - Name      │            │ - UserId(FK)│            │ - Name      │
│ - Email     │            │ - HotelId   │            │ - City      │
│ - Role      │            │ - Dates     │            │ - Price     │
└─────────────┘            │ - Amount    │            │ - Rating    │
       │                   └─────────────┘            └─────────────┘
       │ 1:1                      │                          │
       ▼                          │ 1:N                      │ 1:N
┌─────────────┐                   ▼                          ▼
│LoyaltyAccnt │            ┌─────────────┐            ┌─────────────┐
│             │            │   Payment   │            │   Review    │
│ - Id (PK)   │            │             │            │             │
│ - UserId(FK)│            │ - Id (PK)   │            │ - Id (PK)   │
│ - Points    │            │ - BookingId │            │ - UserId(FK)│
└─────────────┘            │ - Amount    │            │ - HotelId   │
       │ 1:N                │ - Status    │            │ - Rating    │
       ▼                    └─────────────┘            └─────────────┘
┌─────────────┐
│PointsTxn    │
│             │
│ - Id (PK)   │
│ - AcctId(FK)│
│ - Points    │
└─────────────┘
```

### Key Database Features

1. **Referential Integrity**: Proper foreign key relationships with cascade rules
2. **Performance Indexes**: Strategic indexing for common query patterns
3. **Data Validation**: Check constraints for business rules
4. **Audit Trail**: Automatic timestamp management
5. **Unique Constraints**: Prevent duplicate data (email, reviews per user/hotel)

## 🔗 Integration Points

### With All Application Modules

```csharp
// Repository Pattern Implementation (Optional Enhancement)
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly HotelContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(HotelContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    public virtual async Task<bool> ExistsAsync(int id)
    {
        return await _dbSet.FindAsync(id) != null;
    }
}
```

### Connection String Management

```csharp
// Program.cs - Database configuration
public static void ConfigureDatabase(WebApplicationBuilder builder)
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    var useLocalDb = builder.Configuration.GetValue<bool>("UseLocalDb", true);

    if (useLocalDb && !string.IsNullOrEmpty(connectionString))
    {
        // SQL Server LocalDB
        builder.Services.AddDbContext<HotelContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            }));
    }
    else
    {
        // In-Memory Database for testing
        builder.Services.AddDbContext<HotelContext>(options =>
            options.UseInMemoryDatabase("HotelBookingDB"));
    }
}
```

## ⚙️ Configuration

### Database Connection Configuration

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "UseLocalDb": true,
  "Database": {
    "EnableSensitiveDataLogging": false,
    "EnableDetailedErrors": false,
    "CommandTimeout": 30,
    "MaxRetryCount": 3,
    "MaxRetryDelay": "00:00:30"
  }
}
```

### Entity Framework Configuration

```csharp
// Program.cs - EF Core configuration
builder.Services.AddDbContext<HotelContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        
        sqlOptions.CommandTimeout(30);
    });

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }

    options.LogTo(Console.WriteLine, LogLevel.Information);
});
```

## 🧪 Testing

### Unit Test Examples

```csharp
[Test]
public async Task HotelContext_AddHotel_SavesSuccessfully()
{
    // Arrange
    using var context = CreateInMemoryContext();
    var hotel = new Hotel
    {
        Name = "Test Hotel",
        Address = "123 Test St",
        City = "Test City",
        PricePerNight = 100.00m,
        AvailableRooms = 10
    };

    // Act
    context.Hotels.Add(hotel);
    await context.SaveChangesAsync();

    // Assert
    var savedHotel = await context.Hotels.FindAsync(hotel.Id);
    Assert.NotNull(savedHotel);
    Assert.Equal("Test Hotel", savedHotel.Name);
}

[Test]
public async Task UserHotelRelationship_LoadsCorrectly()
{
    // Arrange
    using var context = CreateInMemoryContext();
    var user = new User { Name = "Manager", Email = "manager@test.com", Role = UserRole.HotelManager };
    var hotel = new Hotel { Name = "Test Hotel", City = "Test City", Manager = user };

    context.Users.Add(user);
    context.Hotels.Add(hotel);
    await context.SaveChangesAsync();

    // Act
    var loadedHotel = await context.Hotels
        .Include(h => h.Manager)
        .FirstAsync(h => h.Id == hotel.Id);

    // Assert
    Assert.NotNull(loadedHotel.Manager);
    Assert.Equal("Manager", loadedHotel.Manager.Name);
}

private HotelContext CreateInMemoryContext()
{
    var options = new DbContextOptionsBuilder<HotelContext>()
        .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
        .Options;
    
    return new HotelContext(options);
}
```

### Migration Testing

```csharp
[Test]
public async Task DatabaseMigration_AppliesSuccessfully()
{
    // Arrange
    var connectionString = "Server=(localdb)\\mssqllocaldb;Database=TestDB;Trusted_Connection=true";
    var options = new DbContextOptionsBuilder<HotelContext>()
        .UseSqlServer(connectionString)
        .Options;

    // Act
    using var context = new HotelContext(options);
    await context.Database.MigrateAsync();

    // Assert
    var canConnect = await context.Database.CanConnectAsync();
    Assert.True(canConnect);

    // Cleanup
    await context.Database.EnsureDeletedAsync();
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection string problems**
   - Verify LocalDB is installed and running
   - Check connection string format
   - Ensure database permissions

2. **Migration issues**
   - Check for conflicting migrations
   - Verify model changes are valid
   - Ensure proper migration order

3. **Performance problems**
   - Check for missing indexes
   - Review query execution plans
   - Monitor connection pool usage

### Debug Logging

```csharp
// Enhanced EF Core logging
builder.Services.AddDbContext<HotelContext>(options =>
{
    options.UseSqlServer(connectionString);
    
    if (builder.Environment.IsDevelopment())
    {
        options.LogTo(Console.WriteLine, new[]
        {
            DbLoggerCategory.Database.Command.Name,
            DbLoggerCategory.Database.Connection.Name,
            DbLoggerCategory.Database.Transaction.Name
        }, LogLevel.Information);
        
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});
```

### Performance Monitoring

```csharp
// Query performance monitoring
public class QueryPerformanceInterceptor : DbCommandInterceptor
{
    private readonly ILogger<QueryPerformanceInterceptor> _logger;

    public QueryPerformanceInterceptor(ILogger<QueryPerformanceInterceptor> logger)
    {
        _logger = logger;
    }

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken cancellationToken = default)
    {
        var elapsed = eventData.Duration.TotalMilliseconds;
        
        if (elapsed > 1000) // Log slow queries
        {
            _logger.LogWarning("Slow query detected: {ElapsedMs}ms - {CommandText}",
                elapsed, command.CommandText);
        }

        return await base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
    }
}
```

## 📈 Performance Optimization

### Query Optimization

```csharp
// Efficient queries with proper includes
public async Task<List<Booking>> GetBookingsWithDetailsAsync(int userId)
{
    return await _context.Bookings
        .Include(b => b.Hotel)
        .Include(b => b.User)
        .Where(b => b.UserId == userId)
        .OrderByDescending(b => b.CreatedAt)
        .ToListAsync();
}

// Projection for better performance
public async Task<List<BookingSummary>> GetBookingSummariesAsync(int userId)
{
    return await _context.Bookings
        .Where(b => b.UserId == userId)
        .Select(b => new BookingSummary
        {
            Id = b.Id,
            HotelName = b.Hotel.Name,
            CheckInDate = b.CheckInDate,
            TotalAmount = b.TotalAmount,
            Status = b.Status
        })
        .ToListAsync();
}
```

### Connection Pool Configuration

```csharp
// Optimized connection string
"Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true;Pooling=true;Min Pool Size=5;Max Pool Size=100;Connection Timeout=30;Command Timeout=30"
```

### Bulk Operations

```csharp
// Efficient bulk operations
public async Task BulkInsertHotelsAsync(List<Hotel> hotels)
{
    _context.Hotels.AddRange(hotels);
    await _context.SaveChangesAsync();
}

// Batch updates
public async Task UpdateHotelRatingsAsync(Dictionary<int, decimal> ratings)
{
    var hotelIds = ratings.Keys.ToList();
    var hotels = await _context.Hotels
        .Where(h => hotelIds.Contains(h.Id))
        .ToListAsync();

    foreach (var hotel in hotels)
    {
        if (ratings.TryGetValue(hotel.Id, out var rating))
        {
            hotel.Rating = rating;
        }
    }

    await _context.SaveChangesAsync();
}
```

## 🔮 Future Enhancements

1. **Advanced Database Features**
   - Read/write database splitting
   - Database sharding for scalability
   - Temporal tables for audit history
   - Full-text search capabilities

2. **Performance Improvements**
   - Query result caching
   - Connection pooling optimization
   - Lazy loading strategies
   - Bulk operation optimizations

3. **Data Management**
   - Automated backup strategies
   - Data archiving policies
   - Database monitoring and alerting
   - Performance baseline tracking

4. **Advanced Relationships**
   - Many-to-many relationships for amenities
   - Hierarchical data for hotel chains
   - Geospatial data for location services
   - Document storage for flexible data

## 📚 Related Documentation

- [HOTEL_MODULE.md](HOTEL_MODULE.md) - Hotel entity usage
- [BOOKING_MODULE.md](BOOKING_MODULE.md) - Booking entity relationships
- [AUTH_MODULE.md](AUTH_MODULE.md) - User entity and authentication
- [SETUP_GUIDE.md](../finaldestination/SETUP_GUIDE.md) - Database setup instructions