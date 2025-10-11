# FinalDestination API - Complete Documentation

## Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [Hotel Management Endpoints](#hotel-management-endpoints)
- [Booking Management Endpoints](#booking-management-endpoints)
- [Review System Endpoints](#review-system-endpoints)
- [Loyalty Program Endpoints](#loyalty-program-endpoints)
- [Payment Processing Endpoints](#payment-processing-endpoints)
- [Error Responses](#error-responses)
- [Data Models](#data-models)

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "contactNumber": "+1234567890",
  "role": "Guest"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Guest",
    "contactNumber": "+1234567890",
    "createdAt": "2024-01-01T10:00:00Z",
    "isActive": true
  },
  "expiresAt": "2024-01-02T10:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Validation failed",
  "details": "Email already exists",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "admin@hotel.com",
  "password": "Admin123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Admin",
    "email": "admin@hotel.com",
    "role": "Admin",
    "contactNumber": "+1234567890",
    "createdAt": "2024-01-01T10:00:00Z",
    "isActive": true
  },
  "expiresAt": "2024-01-02T10:00:00Z"
}
```

### GET /api/auth/me
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Guest",
  "contactNumber": "+1234567890",
  "createdAt": "2024-01-01T10:00:00Z",
  "isActive": true
}
```

## Hotel Management Endpoints

### GET /api/hotels
Get all hotels (cached for 10 minutes).

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Grand Plaza Hotel",
    "address": "123 Main St",
    "city": "New York",
    "pricePerNight": 150.00,
    "availableRooms": 48,
    "rating": 4.5,
    "managerId": 2,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Ocean View Resort",
    "address": "456 Beach Ave",
    "city": "Miami",
    "pricePerNight": 200.00,
    "availableRooms": 28,
    "rating": 5.0,
    "managerId": 2,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /api/hotels/{id}
Get hotel by ID.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Grand Plaza Hotel",
  "address": "123 Main St",
  "city": "New York",
  "pricePerNight": 150.00,
  "availableRooms": 48,
  "rating": 4.5,
  "managerId": 2,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Hotel not found",
  "details": "Hotel with ID 999 does not exist",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### GET /api/hotels/search
Search hotels by city, price range, and rating.

**Query Parameters:**
- `city` (optional): Filter by city name
- `maxPrice` (optional): Maximum price per night
- `minPrice` (optional): Minimum price per night
- `minRating` (optional): Minimum rating (1-5)

**Example Request:**
```
GET /api/hotels/search?city=Miami&maxPrice=250&minRating=4.0
```

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "name": "Ocean View Resort",
    "address": "456 Beach Ave",
    "city": "Miami",
    "pricePerNight": 200.00,
    "availableRooms": 28,
    "rating": 5.0,
    "managerId": 2,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/hotels
Create a new hotel (requires HotelManager or Admin role).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Luxury Resort",
  "address": "123 Beach Ave",
  "city": "Miami",
  "pricePerNight": 299.99,
  "availableRooms": 50
}
```

**Response (201 Created):**
```json
{
  "id": 7,
  "name": "Luxury Resort",
  "address": "123 Beach Ave",
  "city": "Miami",
  "pricePerNight": 299.99,
  "availableRooms": 50,
  "rating": 0.0,
  "managerId": 2,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### PUT /api/hotels/{id}
Update an existing hotel (requires HotelManager or Admin role).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Hotel Name",
  "address": "456 New Address",
  "city": "Miami",
  "pricePerNight": 199.99,
  "availableRooms": 45
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Hotel Name",
  "address": "456 New Address",
  "city": "Miami",
  "pricePerNight": 199.99,
  "availableRooms": 45,
  "rating": 4.5,
  "managerId": 2,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### DELETE /api/hotels/{id}
Delete a hotel (requires Admin role).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (204 No Content)**

## Booking Management Endpoints

### GET /api/bookings
Get all bookings (Admin only).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "guestName": "Bob Guest",
    "guestEmail": "guest@example.com",
    "hotelId": 1,
    "hotelName": "Grand Plaza Hotel",
    "userId": 3,
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "numberOfGuests": 2,
    "totalAmount": 300.00,
    "status": "Confirmed",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

### GET /api/bookings/my
Get current user's bookings.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "guestName": "Bob Guest",
    "guestEmail": "guest@example.com",
    "hotelId": 1,
    "hotelName": "Grand Plaza Hotel",
    "userId": 3,
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "numberOfGuests": 2,
    "totalAmount": 300.00,
    "status": "Confirmed",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

### GET /api/bookings/search
Search bookings by guest email.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `email` (required): Guest email address

**Example Request:**
```
GET /api/bookings/search?email=guest@example.com
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "guestName": "Bob Guest",
    "guestEmail": "guest@example.com",
    "hotelId": 1,
    "hotelName": "Grand Plaza Hotel",
    "userId": 3,
    "checkInDate": "2024-01-15",
    "checkOutDate": "2024-01-17",
    "numberOfGuests": 2,
    "totalAmount": 300.00,
    "status": "Confirmed",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

### POST /api/bookings
Create a new booking.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "hotelId": 1,
  "checkInDate": "2024-12-01",
  "checkOutDate": "2024-12-03",
  "numberOfGuests": 2,
  "guestName": "John Doe",
  "guestEmail": "john@example.com"
}
```

**Response (201 Created):**
```json
{
  "id": 9,
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "hotelId": 1,
  "hotelName": "Grand Plaza Hotel",
  "userId": 1,
  "checkInDate": "2024-12-01",
  "checkOutDate": "2024-12-03",
  "numberOfGuests": 2,
  "totalAmount": 300.00,
  "status": "Confirmed",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### POST /api/bookings/{id}/payment
Process payment for a booking.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 300.00,
  "currency": "USD",
  "paymentMethod": "CreditCard",
  "cardNumber": "4111111111111111",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "cvv": "123",
  "cardHolderName": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "paymentId": 9,
  "status": "Completed",
  "transactionId": "TXN123456789",
  "amount": 300.00,
  "currency": "USD",
  "paymentMethod": "CreditCard",
  "processedAt": "2024-01-01T10:00:00Z",
  "errorMessage": null
}
```

**Error Response (400 Bad Request):**
```json
{
  "paymentId": 0,
  "status": "Failed",
  "transactionId": null,
  "amount": 300.00,
  "currency": "USD",
  "paymentMethod": "CreditCard",
  "processedAt": "2024-01-01T10:00:00Z",
  "errorMessage": "Payment processing failed"
}
```

### PUT /api/bookings/{id}/cancel
Cancel a booking.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "guestName": "Bob Guest",
  "guestEmail": "guest@example.com",
  "hotelId": 1,
  "hotelName": "Grand Plaza Hotel",
  "userId": 3,
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "numberOfGuests": 2,
  "totalAmount": 300.00,
  "status": "Cancelled",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

## Review System Endpoints

### GET /api/reviews/hotel/{hotelId}
Get all reviews for a specific hotel.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "userId": 3,
    "userName": "Bob Guest",
    "hotelId": 1,
    "rating": 5,
    "comment": "Excellent service and beautiful rooms! The staff was very friendly and helpful.",
    "createdAt": "2024-01-01T10:00:00Z"
  },
  {
    "id": 2,
    "userId": 4,
    "userName": "Alice Johnson",
    "hotelId": 1,
    "rating": 4,
    "comment": "Great location and comfortable stay. Would recommend to others.",
    "createdAt": "2024-01-02T10:00:00Z"
  }
]
```

### POST /api/reviews
Submit a new review.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "hotelId": 1,
  "rating": 5,
  "comment": "Amazing experience! The hotel exceeded all expectations."
}
```

**Response (201 Created):**
```json
{
  "id": 11,
  "userId": 1,
  "userName": "John Doe",
  "hotelId": 1,
  "rating": 5,
  "comment": "Amazing experience! The hotel exceeded all expectations.",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### PUT /api/reviews/{id}
Update an existing review (own reviews only).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated review: Good experience overall, but room service could be improved."
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": 1,
  "userName": "John Doe",
  "hotelId": 1,
  "rating": 4,
  "comment": "Updated review: Good experience overall, but room service could be improved.",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### DELETE /api/reviews/{id}
Delete a review (own reviews only or Admin).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (204 No Content)**

## Loyalty Program Endpoints

### GET /api/loyalty/account
Get current user's loyalty account information.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": 3,
  "pointsBalance": 150,
  "totalPointsEarned": 200,
  "lastUpdated": "2024-01-01T10:00:00Z"
}
```

### GET /api/loyalty/transactions
Get current user's points transaction history.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "loyaltyAccountId": 1,
    "bookingId": 1,
    "pointsEarned": 30,
    "description": "Points earned from booking at Grand Plaza Hotel",
    "createdAt": "2024-01-01T10:00:00Z"
  },
  {
    "id": 2,
    "loyaltyAccountId": 1,
    "bookingId": null,
    "pointsEarned": 50,
    "description": "Welcome bonus points",
    "createdAt": "2024-01-01T09:00:00Z"
  }
]
```

## Payment Processing Endpoints

### GET /api/payments/{id}
Get payment details by ID.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "bookingId": 1,
  "amount": 300.00,
  "currency": "USD",
  "paymentMethod": "CreditCard",
  "status": "Completed",
  "transactionId": "TXN123456789",
  "processedAt": "2024-01-01T10:00:00Z",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### POST /api/payments/{id}/refund
Process a refund for a payment (Admin only).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 300.00,
  "reason": "Booking cancelled by customer"
}
```

**Response (200 OK):**
```json
{
  "paymentId": 1,
  "status": "Refunded",
  "transactionId": "REF123456789",
  "amount": 300.00,
  "currency": "USD",
  "paymentMethod": "CreditCard",
  "processedAt": "2024-01-01T10:00:00Z",
  "errorMessage": null
}
```

## Error Responses

### Standard Error Response Format
```json
{
  "message": "Brief error description",
  "details": "Detailed error information",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### Common HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Validation errors, invalid data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data, business rule violation |
| 500 | Internal Server Error | Unexpected server error |

### Validation Error Response
```json
{
  "message": "Validation failed",
  "details": {
    "Email": ["Email is required", "Email format is invalid"],
    "Password": ["Password must be at least 8 characters long"]
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Data Models

### User Model
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Guest", // Guest, HotelManager, Admin
  "contactNumber": "+1234567890",
  "createdAt": "2024-01-01T10:00:00Z",
  "lastLoginAt": "2024-01-01T10:00:00Z",
  "isActive": true
}
```

### Hotel Model
```json
{
  "id": 1,
  "name": "Grand Plaza Hotel",
  "address": "123 Main St",
  "city": "New York",
  "pricePerNight": 150.00,
  "availableRooms": 48,
  "rating": 4.5,
  "managerId": 2,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Booking Model
```json
{
  "id": 1,
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "hotelId": 1,
  "userId": 1,
  "checkInDate": "2024-12-01",
  "checkOutDate": "2024-12-03",
  "numberOfGuests": 2,
  "totalAmount": 300.00,
  "status": "Confirmed", // Confirmed, Cancelled, Completed
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Review Model
```json
{
  "id": 1,
  "userId": 1,
  "hotelId": 1,
  "rating": 5, // 1-5 scale
  "comment": "Excellent service and beautiful rooms!",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Payment Model
```json
{
  "id": 1,
  "bookingId": 1,
  "amount": 300.00,
  "currency": "USD",
  "paymentMethod": "CreditCard", // CreditCard, DebitCard, PayPal, BankTransfer
  "status": "Completed", // Pending, Completed, Failed, Refunded
  "transactionId": "TXN123456789",
  "processedAt": "2024-01-01T10:00:00Z",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Loyalty Account Model
```json
{
  "id": 1,
  "userId": 1,
  "pointsBalance": 150,
  "totalPointsEarned": 200,
  "lastUpdated": "2024-01-01T10:00:00Z"
}
```

### Points Transaction Model
```json
{
  "id": 1,
  "loyaltyAccountId": 1,
  "bookingId": 1,
  "pointsEarned": 30,
  "description": "Points earned from booking at Grand Plaza Hotel",
  "createdAt": "2024-01-01T10:00:00Z"
}
```




