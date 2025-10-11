# Components Directory

This directory will contain all the UI components for the FinalDestination frontend application.

## Directory Structure

The components are organized by feature area:

### Authentication Components (Task 3.2)
- `auth/LoginComponent.js` - User login form
- `auth/RegisterComponent.js` - User registration form

### Hotel Components (Task 4.2-4.3)
- `hotels/HotelListComponent.js` - Hotel listing and search
- `hotels/HotelDetailComponent.js` - Individual hotel details

### Booking Components (Task 5.2-5.3)
- `bookings/BookingFormComponent.js` - Booking creation form
- `bookings/BookingListComponent.js` - User bookings management

### Review Components (Task 7.2-7.3)
- `reviews/ReviewComponent.js` - Review submission form
- `reviews/ReviewListComponent.js` - Review display and management

### Payment Components (Task 6.2-6.3)
- `payments/PaymentComponent.js` - Payment form
- `payments/PaymentHistoryComponent.js` - Payment history display

### Loyalty Components (Task 8.2)
- `loyalty/LoyaltyDashboardComponent.js` - Loyalty points dashboard

### Admin Components (Task 9.1-9.2)
- `admin/AdminDashboardComponent.js` - Administrative interface
- `admin/HotelManagementComponent.js` - Hotel management for managers

### Shared Components
- `shared/ModalComponent.js` - Reusable modal dialog
- `shared/LoadingComponent.js` - Loading spinner
- `shared/PaginationComponent.js` - Pagination controls
- `shared/SearchComponent.js` - Search form

## Component Architecture

Each component will follow a consistent pattern:
- Constructor with element binding
- `render(data)` method for displaying content
- `bindEvents()` method for event handling
- `destroy()` method for cleanup
- `show()` and `hide()` methods for visibility
- Data validation and error handling

## Base Component

All components will extend from a base `Component` class that provides:
- Common lifecycle methods
- Event handling utilities
- DOM manipulation helpers
- State management integration




