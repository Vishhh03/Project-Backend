using Microsoft.EntityFrameworkCore;
using FinalDestinationAPI.Data;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Services;

public static class DataSeeder
{
    public static async Task SeedAsync(HotelContext context)
    {
        // Check if data already exists
        if (await context.Users.AnyAsync())
        {
            return; // Database has been seeded
        }

        await SeedUsersAsync(context);
        await SeedHotelsAsync(context);
        await SeedBookingsAsync(context);
        await SeedReviewsAsync(context);
        await SeedLoyaltyAccountsAsync(context);
        await SeedPaymentsAsync(context);
        await SeedPointsTransactionsAsync(context);
        
        await context.SaveChangesAsync();
        
        // Update hotel ratings based on reviews
        await UpdateHotelRatingsAsync(context);
    }

    private static async Task SeedUsersAsync(HotelContext context)
    {
        var users = new List<User>
        {
            // Admin Users
            new User
            {
                Id = 1,
                Name = "John Admin",
                Email = "admin@hotel.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                ContactNumber = "+1-555-0101",
                CreatedAt = DateTime.UtcNow.AddDays(-90),
                LastLoginAt = DateTime.UtcNow.AddHours(-2),
                IsActive = true
            },
            
            // Hotel Managers
            new User
            {
                Id = 2,
                Name = "Jane Manager",
                Email = "manager@hotel.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
                Role = UserRole.HotelManager,
                ContactNumber = "+1-555-0102",
                CreatedAt = DateTime.UtcNow.AddDays(-85),
                LastLoginAt = DateTime.UtcNow.AddHours(-4),
                IsActive = true
            },
            new User
            {
                Id = 3,
                Name = "Mike Wilson",
                Email = "mike.wilson@hotelgroup.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager456!"),
                Role = UserRole.HotelManager,
                ContactNumber = "+1-555-0103",
                CreatedAt = DateTime.UtcNow.AddDays(-80),
                LastLoginAt = DateTime.UtcNow.AddDays(-1),
                IsActive = true
            },
            
            // Guest Users
            new User
            {
                Id = 4,
                Name = "Bob Guest",
                Email = "guest@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Guest123!"),
                Role = UserRole.Guest,
                ContactNumber = "+1-555-0104",
                CreatedAt = DateTime.UtcNow.AddDays(-75),
                LastLoginAt = DateTime.UtcNow.AddHours(-6),
                IsActive = true
            },
            new User
            {
                Id = 5,
                Name = "Alice Johnson",
                Email = "alice.johnson@email.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Alice789!"),
                Role = UserRole.Guest,
                ContactNumber = "+1-555-0105",
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                LastLoginAt = DateTime.UtcNow.AddDays(-3),
                IsActive = true
            },
            new User
            {
                Id = 6,
                Name = "Charlie Brown",
                Email = "charlie.brown@email.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Charlie456!"),
                Role = UserRole.Guest,
                ContactNumber = "+1-555-0106",
                CreatedAt = DateTime.UtcNow.AddDays(-45),
                LastLoginAt = DateTime.UtcNow.AddDays(-7),
                IsActive = true
            },
            new User
            {
                Id = 7,
                Name = "Diana Prince",
                Email = "diana.prince@email.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Diana123!"),
                Role = UserRole.Guest,
                ContactNumber = "+1-555-0107",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                LastLoginAt = DateTime.UtcNow.AddHours(-12),
                IsActive = true
            },
            new User
            {
                Id = 8,
                Name = "Edward Smith",
                Email = "edward.smith@email.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Edward789!"),
                Role = UserRole.Guest,
                ContactNumber = "+1-555-0108",
                CreatedAt = DateTime.UtcNow.AddDays(-25),
                LastLoginAt = DateTime.UtcNow.AddDays(-2),
                IsActive = true
            }
        };

        context.Users.AddRange(users);
        await context.SaveChangesAsync();
    }

    private static async Task SeedHotelsAsync(HotelContext context)
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
                AvailableRooms = 48, // Reduced from 50 due to bookings
                Rating = 0, // Will be calculated from reviews
                ReviewCount = 0,
                ManagerId = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-90)
            },
            new Hotel
            {
                Id = 2,
                Name = "Ocean View Resort",
                Address = "456 Beach Ave",
                City = "Miami",
                PricePerNight = 200.00m,
                AvailableRooms = 28, // Reduced from 30 due to bookings
                Rating = 0, // Will be calculated from reviews
                ReviewCount = 0,
                ManagerId = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-85)
            },
            new Hotel
            {
                Id = 3,
                Name = "Mountain Lodge",
                Address = "789 Pine Rd",
                City = "Denver",
                PricePerNight = 120.00m,
                AvailableRooms = 24, // Reduced from 25 due to bookings
                Rating = 0, // Will be calculated from reviews
                ReviewCount = 0,
                ManagerId = 3,
                CreatedAt = DateTime.UtcNow.AddDays(-80)
            },
            new Hotel
            {
                Id = 4,
                Name = "Downtown Business Hotel",
                Address = "321 Corporate Blvd",
                City = "Chicago",
                PricePerNight = 180.00m,
                AvailableRooms = 35,
                Rating = 0, // Will be calculated from reviews
                ReviewCount = 0,
                ManagerId = 3,
                CreatedAt = DateTime.UtcNow.AddDays(-70)
            },
            new Hotel
            {
                Id = 5,
                Name = "Sunset Beach Resort",
                Address = "789 Sunset Blvd",
                City = "Los Angeles",
                PricePerNight = 250.00m,
                AvailableRooms = 40,
                Rating = 0, // Will be calculated from reviews
                ReviewCount = 0,
                ManagerId = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-65)
            },
            new Hotel
            {
                Id = 6,
                Name = "Historic Inn",
                Address = "456 Heritage St",
                City = "Boston",
                PricePerNight = 130.00m,
                AvailableRooms = 20,
                Rating = 0, // Will be calculated from reviews
                ReviewCount = 0,
                ManagerId = 3,
                CreatedAt = DateTime.UtcNow.AddDays(-60)
            }
        };

        context.Hotels.AddRange(hotels);
        await context.SaveChangesAsync();
    }

    private static async Task SeedBookingsAsync(HotelContext context)
    {
        var bookings = new List<Booking>
        {
            // Completed bookings (past dates)
            new Booking
            {
                Id = 1,
                GuestName = "Bob Guest",
                GuestEmail = "guest@example.com",
                HotelId = 1,
                UserId = 4,
                CheckInDate = DateTime.UtcNow.AddDays(-30),
                CheckOutDate = DateTime.UtcNow.AddDays(-28),
                NumberOfGuests = 2,
                TotalAmount = 300.00m, // 2 nights * $150
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Booking
            {
                Id = 2,
                GuestName = "Alice Johnson",
                GuestEmail = "alice.johnson@email.com",
                HotelId = 2,
                UserId = 5,
                CheckInDate = DateTime.UtcNow.AddDays(-25),
                CheckOutDate = DateTime.UtcNow.AddDays(-22),
                NumberOfGuests = 1,
                TotalAmount = 600.00m, // 3 nights * $200
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new Booking
            {
                Id = 3,
                GuestName = "Charlie Brown",
                GuestEmail = "charlie.brown@email.com",
                HotelId = 3,
                UserId = 6,
                CheckInDate = DateTime.UtcNow.AddDays(-20),
                CheckOutDate = DateTime.UtcNow.AddDays(-19),
                NumberOfGuests = 2,
                TotalAmount = 120.00m, // 1 night * $120
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            },
            new Booking
            {
                Id = 4,
                GuestName = "Diana Prince",
                GuestEmail = "diana.prince@email.com",
                HotelId = 1,
                UserId = 7,
                CheckInDate = DateTime.UtcNow.AddDays(-15),
                CheckOutDate = DateTime.UtcNow.AddDays(-12),
                NumberOfGuests = 1,
                TotalAmount = 450.00m, // 3 nights * $150
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Booking
            {
                Id = 5,
                GuestName = "Edward Smith",
                GuestEmail = "edward.smith@email.com",
                HotelId = 2,
                UserId = 8,
                CheckInDate = DateTime.UtcNow.AddDays(-10),
                CheckOutDate = DateTime.UtcNow.AddDays(-8),
                NumberOfGuests = 2,
                TotalAmount = 400.00m, // 2 nights * $200
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },
            
            // Current/Future bookings
            new Booking
            {
                Id = 6,
                GuestName = "Alice Johnson",
                GuestEmail = "alice.johnson@email.com",
                HotelId = 4,
                UserId = 5,
                CheckInDate = DateTime.UtcNow.AddDays(5),
                CheckOutDate = DateTime.UtcNow.AddDays(7),
                NumberOfGuests = 1,
                TotalAmount = 360.00m, // 2 nights * $180
                Status = BookingStatus.Confirmed,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Booking
            {
                Id = 7,
                GuestName = "Charlie Brown",
                GuestEmail = "charlie.brown@email.com",
                HotelId = 5,
                UserId = 6,
                CheckInDate = DateTime.UtcNow.AddDays(10),
                CheckOutDate = DateTime.UtcNow.AddDays(14),
                NumberOfGuests = 2,
                TotalAmount = 1000.00m, // 4 nights * $250
                Status = BookingStatus.Confirmed,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            
            // Cancelled booking
            new Booking
            {
                Id = 8,
                GuestName = "Diana Prince",
                GuestEmail = "diana.prince@email.com",
                HotelId = 6,
                UserId = 7,
                CheckInDate = DateTime.UtcNow.AddDays(15),
                CheckOutDate = DateTime.UtcNow.AddDays(17),
                NumberOfGuests = 1,
                TotalAmount = 260.00m, // 2 nights * $130
                Status = BookingStatus.Cancelled,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            }
        };

        context.Bookings.AddRange(bookings);
        await context.SaveChangesAsync();
    }

    private static async Task SeedReviewsAsync(HotelContext context)
    {
        var reviews = new List<Review>
        {
            // Reviews for Grand Plaza Hotel (Hotel ID: 1)
            new Review
            {
                Id = 1,
                UserId = 4,
                HotelId = 1,
                Rating = 5,
                Comment = "Excellent service and beautiful rooms! The staff was incredibly helpful and the location is perfect for exploring the city.",
                CreatedAt = DateTime.UtcNow.AddDays(-28)
            },
            new Review
            {
                Id = 2,
                UserId = 7,
                HotelId = 1,
                Rating = 4,
                Comment = "Great hotel with comfortable beds and good amenities. The breakfast was delicious. Only minor issue was the Wi-Fi speed.",
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            
            // Reviews for Ocean View Resort (Hotel ID: 2)
            new Review
            {
                Id = 3,
                UserId = 5,
                HotelId = 2,
                Rating = 5,
                Comment = "Amazing ocean views from every room! The resort facilities are top-notch and the beach access is fantastic. Highly recommended!",
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Review
            {
                Id = 4,
                UserId = 8,
                HotelId = 2,
                Rating = 5,
                Comment = "Perfect vacation spot! The pool area is beautiful and the restaurant serves excellent seafood. Will definitely come back.",
                CreatedAt = DateTime.UtcNow.AddDays(-6)
            },
            
            // Reviews for Mountain Lodge (Hotel ID: 3)
            new Review
            {
                Id = 5,
                UserId = 6,
                HotelId = 3,
                Rating = 4,
                Comment = "Cozy mountain retreat with stunning views. Great for hiking enthusiasts. The fireplace in the lobby creates a wonderful atmosphere.",
                CreatedAt = DateTime.UtcNow.AddDays(-18)
            },
            
            // Reviews for Downtown Business Hotel (Hotel ID: 4)
            new Review
            {
                Id = 6,
                UserId = 4,
                HotelId = 4,
                Rating = 4,
                Comment = "Perfect for business trips. Close to the financial district and conference centers. Rooms are modern and well-equipped.",
                CreatedAt = DateTime.UtcNow.AddDays(-40)
            },
            new Review
            {
                Id = 7,
                UserId = 5,
                HotelId = 4,
                Rating = 3,
                Comment = "Good location and clean rooms, but the service could be improved. The gym facilities are adequate for a quick workout.",
                CreatedAt = DateTime.UtcNow.AddDays(-35)
            },
            
            // Reviews for Sunset Beach Resort (Hotel ID: 5)
            new Review
            {
                Id = 8,
                UserId = 7,
                HotelId = 5,
                Rating = 5,
                Comment = "Luxury at its finest! The sunset views are breathtaking and the spa services are world-class. Worth every penny!",
                CreatedAt = DateTime.UtcNow.AddDays(-50)
            },
            new Review
            {
                Id = 9,
                UserId = 8,
                HotelId = 5,
                Rating = 4,
                Comment = "Beautiful resort with excellent amenities. The only downside is it can get quite busy during peak season.",
                CreatedAt = DateTime.UtcNow.AddDays(-45)
            },
            
            // Reviews for Historic Inn (Hotel ID: 6)
            new Review
            {
                Id = 10,
                UserId = 6,
                HotelId = 6,
                Rating = 4,
                Comment = "Charming historic property with lots of character. The rooms have a vintage feel but with modern comforts. Great location in the historic district.",
                CreatedAt = DateTime.UtcNow.AddDays(-55)
            }
        };

        context.Reviews.AddRange(reviews);
        await context.SaveChangesAsync();
    }

    private static async Task SeedLoyaltyAccountsAsync(HotelContext context)
    {
        var loyaltyAccounts = new List<LoyaltyAccount>
        {
            new LoyaltyAccount
            {
                Id = 1,
                UserId = 4, // Bob Guest
                PointsBalance = 75, // 30 + 45 from bookings
                TotalPointsEarned = 75,
                LastUpdated = DateTime.UtcNow.AddDays(-10)
            },
            new LoyaltyAccount
            {
                Id = 2,
                UserId = 5, // Alice Johnson
                PointsBalance = 96, // 60 + 40 - 4 (used some points)
                TotalPointsEarned = 100,
                LastUpdated = DateTime.UtcNow.AddDays(-5)
            },
            new LoyaltyAccount
            {
                Id = 3,
                UserId = 6, // Charlie Brown
                PointsBalance = 112, // 12 + 100 from bookings
                TotalPointsEarned = 112,
                LastUpdated = DateTime.UtcNow.AddDays(-2)
            },
            new LoyaltyAccount
            {
                Id = 4,
                UserId = 7, // Diana Prince
                PointsBalance = 45, // 45 from one booking
                TotalPointsEarned = 45,
                LastUpdated = DateTime.UtcNow.AddDays(-10)
            },
            new LoyaltyAccount
            {
                Id = 5,
                UserId = 8, // Edward Smith
                PointsBalance = 40, // 40 from one booking
                TotalPointsEarned = 40,
                LastUpdated = DateTime.UtcNow.AddDays(-6)
            }
        };

        context.LoyaltyAccounts.AddRange(loyaltyAccounts);
        await context.SaveChangesAsync();
    }

    private static async Task SeedPaymentsAsync(HotelContext context)
    {
        var payments = new List<Payment>
        {
            new Payment
            {
                Id = 1,
                BookingId = 1,
                Amount = 300.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.CreditCard,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN001234567",
                ProcessedAt = DateTime.UtcNow.AddDays(-35),
                CreatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Payment
            {
                Id = 2,
                BookingId = 2,
                Amount = 600.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.DebitCard,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN002345678",
                ProcessedAt = DateTime.UtcNow.AddDays(-30),
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new Payment
            {
                Id = 3,
                BookingId = 3,
                Amount = 120.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.PayPal,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN003456789",
                ProcessedAt = DateTime.UtcNow.AddDays(-25),
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            },
            new Payment
            {
                Id = 4,
                BookingId = 4,
                Amount = 450.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.CreditCard,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN004567890",
                ProcessedAt = DateTime.UtcNow.AddDays(-20),
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Payment
            {
                Id = 5,
                BookingId = 5,
                Amount = 400.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.CreditCard,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN005678901",
                ProcessedAt = DateTime.UtcNow.AddDays(-15),
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },
            new Payment
            {
                Id = 6,
                BookingId = 6,
                Amount = 360.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.DebitCard,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN006789012",
                ProcessedAt = DateTime.UtcNow.AddDays(-5),
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Payment
            {
                Id = 7,
                BookingId = 7,
                Amount = 1000.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.CreditCard,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN007890123",
                ProcessedAt = DateTime.UtcNow.AddDays(-2),
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            // Refunded payment for cancelled booking
            new Payment
            {
                Id = 8,
                BookingId = 8,
                Amount = 260.00m,
                Currency = "USD",
                PaymentMethod = PaymentMethod.CreditCard,
                Status = PaymentStatus.Refunded,
                TransactionId = "TXN008901234",
                ProcessedAt = DateTime.UtcNow.AddDays(-3),
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            }
        };

        context.Payments.AddRange(payments);
        await context.SaveChangesAsync();
    }

    private static async Task SeedPointsTransactionsAsync(HotelContext context)
    {
        var pointsTransactions = new List<PointsTransaction>
        {
            // Bob Guest transactions
            new PointsTransaction
            {
                Id = 1,
                LoyaltyAccountId = 1,
                BookingId = 1,
                PointsEarned = 30, // 10% of $300
                Description = "Points earned from booking at Grand Plaza Hotel",
                CreatedAt = DateTime.UtcNow.AddDays(-28)
            },
            new PointsTransaction
            {
                Id = 2,
                LoyaltyAccountId = 1,
                BookingId = 4,
                PointsEarned = 45, // 10% of $450
                Description = "Points earned from booking at Grand Plaza Hotel",
                CreatedAt = DateTime.UtcNow.AddDays(-12)
            },
            
            // Alice Johnson transactions
            new PointsTransaction
            {
                Id = 3,
                LoyaltyAccountId = 2,
                BookingId = 2,
                PointsEarned = 60, // 10% of $600
                Description = "Points earned from booking at Ocean View Resort",
                CreatedAt = DateTime.UtcNow.AddDays(-22)
            },
            new PointsTransaction
            {
                Id = 4,
                LoyaltyAccountId = 2,
                BookingId = 6,
                PointsEarned = 36, // 10% of $360
                Description = "Points earned from booking at Downtown Business Hotel",
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new PointsTransaction
            {
                Id = 5,
                LoyaltyAccountId = 2,
                BookingId = null,
                PointsEarned = 4, // Bonus points
                Description = "Bonus points for being a loyal customer",
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            
            // Charlie Brown transactions
            new PointsTransaction
            {
                Id = 6,
                LoyaltyAccountId = 3,
                BookingId = 3,
                PointsEarned = 12, // 10% of $120
                Description = "Points earned from booking at Mountain Lodge",
                CreatedAt = DateTime.UtcNow.AddDays(-19)
            },
            new PointsTransaction
            {
                Id = 7,
                LoyaltyAccountId = 3,
                BookingId = 7,
                PointsEarned = 100, // 10% of $1000
                Description = "Points earned from booking at Sunset Beach Resort",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            
            // Diana Prince transactions
            new PointsTransaction
            {
                Id = 8,
                LoyaltyAccountId = 4,
                BookingId = 4,
                PointsEarned = 45, // 10% of $450
                Description = "Points earned from booking at Grand Plaza Hotel",
                CreatedAt = DateTime.UtcNow.AddDays(-12)
            },
            
            // Edward Smith transactions
            new PointsTransaction
            {
                Id = 9,
                LoyaltyAccountId = 5,
                BookingId = 5,
                PointsEarned = 40, // 10% of $400
                Description = "Points earned from booking at Ocean View Resort",
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            }
        };

        context.PointsTransactions.AddRange(pointsTransactions);
        await context.SaveChangesAsync();
    }

    private static async Task UpdateHotelRatingsAsync(HotelContext context)
    {
        var hotels = await context.Hotels.Include(h => h.Reviews).ToListAsync();
        
        foreach (var hotel in hotels)
        {
            if (hotel.Reviews.Any())
            {
                hotel.Rating = Math.Round((decimal)hotel.Reviews.Average(r => r.Rating), 2);
                hotel.ReviewCount = hotel.Reviews.Count;
            }
        }
        
        await context.SaveChangesAsync();
    }
}




