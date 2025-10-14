# Requirements Document

## Introduction

The FinalDestination System is a beginner-friendly ASP.NET Core 8 Web API designed for developers new to .NET as part of their company training for the ASP.NET track. This system provides core hotel booking functionality while maintaining simplicity and readability. The system focuses on essential features from the original Smart Hotel Booking System requirements but removes complex enterprise patterns to make it accessible for learning purposes.

## Requirements

### Requirement 1: Basic User Management

**User Story:** As a user, I want to register and manage basic user accounts, so that I can access the hotel booking system with simple role-based functionality.

#### Acceptance Criteria

1. WHEN a new user registers THEN the system SHALL create a user account with basic information (Name, Email, Role)
2. WHEN users are created THEN the system SHALL support three roles: Guest, HotelManager, and Admin
3. WHEN retrieving users THEN the system SHALL provide simple CRUD operations without complex authentication
4. WHEN managing users THEN the system SHALL use Entity Framework Core with In-Memory database for simplicity
5. IF duplicate emails are provided THEN the system SHALL prevent duplicate user creation

### Requirement 2: Hotel and Room Management

**User Story:** As a hotel manager, I want to manage hotels and rooms with simple operations, so that I can list properties and set basic room information.

#### Acceptance Criteria

1. WHEN a hotel manager adds a hotel THEN the system SHALL store basic hotel information (Name, Address, City, PricePerNight, AvailableRooms, Rating)
2. WHEN managing hotels THEN the system SHALL provide full CRUD operations with proper validation
3. WHEN searching hotels THEN the system SHALL allow filtering by city and maximum price
4. WHEN updating room availability THEN the system SHALL track available room count as a simple integer
5. IF invalid hotel data is provided THEN the system SHALL return appropriate validation errors

### Requirement 3: Simple Booking System

**User Story:** As a guest, I want to book hotel rooms with basic information, so that I can make reservations without complex workflows.

#### Acceptance Criteria

1. WHEN a guest creates a booking THEN the system SHALL store essential booking details (GuestName, GuestEmail, HotelId, CheckIn/CheckOut dates, NumberOfGuests)
2. WHEN calculating booking cost THEN the system SHALL automatically compute total amount based on nights stayed and hotel price
3. WHEN processing bookings THEN the system SHALL check room availability and update available room count
4. WHEN retrieving bookings THEN the system SHALL allow searching by guest email
5. IF insufficient rooms are available THEN the system SHALL prevent booking and return appropriate error

### Requirement 4: Basic Review System

**User Story:** As a guest, I want to leave simple reviews for hotels, so that I can share my experience with basic rating and comments.

#### Acceptance Criteria

1. WHEN a guest submits a review THEN the system SHALL store review with rating (1-5), comment, and guest information
2. WHEN calculating hotel ratings THEN the system SHALL compute average rating from all reviews
3. WHEN retrieving reviews THEN the system SHALL show all reviews for a specific hotel
4. WHEN managing reviews THEN the system SHALL provide basic CRUD operations
5. IF invalid rating values are provided THEN the system SHALL validate rating is between 1 and 5

### Requirement 5: Simple Loyalty Points

**User Story:** As a guest, I want to earn and track basic loyalty points, so that I can see rewards for my bookings in a simple format.

#### Acceptance Criteria

1. WHEN a guest completes a booking THEN the system SHALL award points equal to 10% of booking amount (rounded)
2. WHEN viewing loyalty account THEN the system SHALL display current points balance and total earned
3. WHEN managing loyalty accounts THEN the system SHALL automatically create accounts for new users
4. WHEN calculating points THEN the system SHALL use simple integer arithmetic without complex tiers
5. IF loyalty data is requested THEN the system SHALL provide points history with booking references

### Requirement 6: API Documentation and Testing

**User Story:** As a developer learning ASP.NET Core, I want comprehensive API documentation and easy testing capabilities, so that I can understand and experiment with the system.

#### Acceptance Criteria

1. WHEN accessing the API THEN the system SHALL provide Swagger UI as the default page for easy testing
2. WHEN documenting endpoints THEN the system SHALL include clear descriptions and example requests/responses
3. WHEN running the application THEN the system SHALL use In-Memory database requiring no setup
4. WHEN testing the API THEN the system SHALL include sample data for immediate experimentation
5. IF the application starts THEN the system SHALL automatically seed the database with example hotels and bookings

### Requirement 7: Simple Data Models

**User Story:** As a developer new to Entity Framework, I want straightforward data models with clear relationships, so that I can understand database concepts without complexity.

#### Acceptance Criteria

1. WHEN defining models THEN the system SHALL use simple properties with basic data annotations
2. WHEN establishing relationships THEN the system SHALL use clear navigation properties (Hotel has many Bookings)
3. WHEN configuring database THEN the system SHALL use Fluent API for basic relationship configuration
4. WHEN handling data THEN the system SHALL demonstrate LINQ queries for filtering and searching
5. IF model validation fails THEN the system SHALL provide clear error messages

### Requirement 8: Error Handling and Validation

**User Story:** As a user of the API, I want clear error messages and proper validation, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN validation fails THEN the system SHALL return HTTP 400 with descriptive error messages
2. WHEN resources are not found THEN the system SHALL return HTTP 404 with appropriate messages
3. WHEN operations succeed THEN the system SHALL return proper HTTP status codes (200, 201, 204)
4. WHEN handling exceptions THEN the system SHALL prevent application crashes with graceful error responses
5. IF business rules are violated THEN the system SHALL return meaningful validation messages

### Requirement 9: RESTful API Design

**User Story:** As a developer learning web APIs, I want properly designed REST endpoints, so that I can understand API best practices and conventions.

#### Acceptance Criteria

1. WHEN designing endpoints THEN the system SHALL follow REST conventions (/api/hotels, /api/bookings, /api/reviews)
2. WHEN using HTTP methods THEN the system SHALL properly implement GET, POST, PUT, DELETE operations
3. WHEN structuring responses THEN the system SHALL return consistent JSON format
4. WHEN handling requests THEN the system SHALL accept and validate JSON input
5. IF endpoints are accessed THEN the system SHALL demonstrate proper use of HTTP status codes

### Requirement 10: Learning-Focused Implementation

**User Story:** As a developer in training, I want clean, well-commented code with clear examples, so that I can learn ASP.NET Core concepts effectively.

#### Acceptance Criteria

1. WHEN reviewing code THEN the system SHALL include helpful comments explaining key concepts
2. WHEN structuring the project THEN the system SHALL follow standard ASP.NET Core folder organization
3. WHEN implementing features THEN the system SHALL demonstrate core concepts without over-engineering
4. WHEN providing examples THEN the system SHALL include realistic sample data and use cases
5. IF learning resources are needed THEN the system SHALL include comprehensive README with next steps

