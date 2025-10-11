# Services Directory

This directory will contain all the business logic services for the FinalDestination frontend application.

## Planned Services

The following services will be implemented in future tasks:

### Core Services (Task 2)
- **ApiClient** (Task 2.1) - HTTP communication service
- **Router** (Task 2.2) - SPA navigation service  
- **StorageService** (Task 2.3) - Client-side data persistence

### Authentication Services (Task 3)
- **AuthService** (Task 3.1) - User authentication and authorization

### Business Logic Services (Tasks 4-8)
- **HotelService** (Task 4.1) - Hotel operations
- **BookingService** (Task 5.1) - Booking management
- **PaymentService** (Task 6.1) - Payment processing
- **ReviewService** (Task 7.1) - Review and rating operations
- **LoyaltyService** (Task 8.1) - Loyalty program management

### Utility Services (Task 11)
- **NotificationService** (Task 11.2) - User feedback and notifications

## Architecture

Each service will follow a consistent pattern:
- Constructor with dependency injection
- Public methods for business operations
- Private methods for internal logic
- Error handling and validation
- Event emission for state changes

## Usage

Services will be instantiated and managed by the main application and made available to components as needed.




