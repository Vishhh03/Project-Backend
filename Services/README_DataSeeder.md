# DataSeeder Service Documentation

## Overview

The `DataSeeder` service provides comprehensive sample data for the FinalDestination API, making it easy for developers to test and explore the system's functionality without manually creating data.

## Sample Data Included

### Users (8 total)
- **1 Admin**: John Admin (admin@hotel.com)
- **2 Hotel Managers**: Jane Manager, Mike Wilson
- **5 Guests**: Bob Guest, Alice Johnson, Charlie Brown, Diana Prince, Edward Smith

All users have secure BCrypt-hashed passwords following the pattern: `[Name]123!`

### Hotels (6 total)
- **Grand Plaza Hotel** (New York) - $150/night, 48 available rooms
- **Ocean View Resort** (Miami) - $200/night, 28 available rooms  
- **Mountain Lodge** (Denver) - $120/night, 24 available rooms
- **Downtown Business Hotel** (Chicago) - $180/night, 35 available rooms
- **Sunset Beach Resort** (Los Angeles) - $250/night, 40 available rooms
- **Historic Inn** (Boston) - $130/night, 20 available rooms

### Bookings (8 total)
- **5 Completed bookings** (past dates) - for testing reviews and loyalty points
- **2 Confirmed bookings** (future dates) - for testing current reservations
- **1 Cancelled booking** - for testing cancellation and refund scenarios

### Reviews (10 total)
- Realistic reviews with ratings from 3-5 stars
- Distributed across different hotels
- Written by guests who actually stayed at the hotels
- Includes detailed comments about experiences

### Loyalty Accounts (5 total)
- All guest users have loyalty accounts
- Points calculated at 10% of booking amounts
- Realistic point balances and transaction histories
- Includes bonus point transactions

### Payments (8 total)
- Payments for all bookings (including cancelled ones)
- Various payment methods: Credit Card, Debit Card, PayPal
- Realistic transaction IDs
- Includes one refunded payment for cancelled booking

### Points Transactions (9 total)
- Points earned from completed bookings
- Bonus point transactions
- Proper linking to bookings and loyalty accounts

## Hotel Ratings

Hotel ratings are automatically calculated based on reviews:
- **Ocean View Resort**: 5.0 stars (2 reviews)
- **Grand Plaza Hotel**: 4.5 stars (2 reviews) 
- **Sunset Beach Resort**: 4.5 stars (2 reviews)
- **Mountain Lodge**: 4.0 stars (1 review)
- **Downtown Business Hotel**: 3.5 stars (2 reviews)
- **Historic Inn**: 4.0 stars (1 review)

## Usage

The DataSeeder automatically runs when the application starts and checks if data already exists to avoid duplicates:

```csharp
// In Program.cs
await DataSeeder.SeedAsync(context);
```

## Testing Scenarios

The sample data supports various testing scenarios:

1. **Authentication Testing**
   - Login with different user roles
   - Test role-based authorization

2. **Hotel Management**
   - Search hotels by city and price
   - View hotel details and reviews
   - Test caching functionality

3. **Booking System**
   - Create new bookings
   - View booking history
   - Test room availability updates

4. **Review System**
   - View existing reviews
   - Add new reviews (affects hotel ratings)
   - Test rating calculations

5. **Loyalty Program**
   - View points balance and history
   - Test points earning from bookings
   - Verify points calculations

6. **Payment Processing**
   - Test payment workflows
   - View payment history
   - Test refund scenarios

## Sample Login Credentials

For testing purposes, you can use these credentials:

- **Admin**: admin@hotel.com / Admin123!
- **Hotel Manager**: manager@hotel.com / Manager123!
- **Guest**: guest@example.com / Guest123!

## Data Relationships

The seeded data maintains proper relationships:
- Hotels have managers (hotel managers)
- Bookings link to hotels and users
- Reviews link to users and hotels
- Loyalty accounts belong to guest users
- Points transactions link to bookings
- Payments link to bookings

This comprehensive dataset allows developers to test all aspects of the hotel booking system without needing to manually create test data.




