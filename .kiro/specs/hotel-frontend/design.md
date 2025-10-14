# Design Document

## Overview

The frontend will be a Single Page Application (SPA) built with vanilla JavaScript, HTML5, and CSS3. The architecture follows modern web development patterns with clear separation of concerns, making it ready for future Angular migration. The application will consume the FinalDestinationAPI REST endpoints and provide a responsive, accessible user interface for hotel booking management.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (Views/Components)                     │
│  ├── Authentication Views                                  │
│  ├── Hotel Management Views                                │
│  ├── Booking Management Views                              │
│  ├── Review Management Views                               │
│  ├── Loyalty Dashboard Views                               │
│  └── Admin Dashboard Views                                 │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services)                           │
│  ├── AuthService (JWT management)                          │
│  ├── HotelService (hotel operations)                       │
│  ├── BookingService (booking operations)                   │
│  ├── ReviewService (review operations)                     │
│  ├── LoyaltyService (loyalty operations)                   │
│  ├── PaymentService (payment operations)                   │
│  └── NotificationService (user feedback)                   │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer                                         │
│  ├── ApiClient (HTTP client wrapper)                       │
│  ├── StorageService (localStorage/sessionStorage)          │
│  └── CacheService (client-side caching)                    │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                      │
│  ├── Router (SPA routing)                                  │
│  ├── EventBus (component communication)                    │
│  ├── Validator (form validation)                           │
│  └── Utils (helper functions)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FinalDestinationAPI                          │
│  REST Endpoints (Authentication, Hotels, Bookings, etc.)   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
FinalDestinationAPI/
├── wwwroot/                    # Static web files
│   ├── index.html             # Main HTML file
│   ├── css/                   # Stylesheets
│   │   ├── main.css          # Main styles
│   │   ├── components.css    # Component-specific styles
│   │   └── responsive.css    # Responsive design
│   ├── js/                   # JavaScript files
│   │   ├── app.js           # Application entry point
│   │   ├── config/          # Configuration
│   │   │   └── api-config.js
│   │   ├── services/        # Business logic services
│   │   │   ├── auth-service.js
│   │   │   ├── hotel-service.js
│   │   │   ├── booking-service.js
│   │   │   ├── review-service.js
│   │   │   ├── loyalty-service.js
│   │   │   └── payment-service.js
│   │   ├── components/      # UI components
│   │   │   ├── auth/
│   │   │   ├── hotels/
│   │   │   ├── bookings/
│   │   │   ├── reviews/
│   │   │   └── shared/
│   │   ├── utils/           # Utility functions
│   │   │   ├── api-client.js
│   │   │   ├── router.js
│   │   │   ├── validator.js
│   │   │   └── helpers.js
│   │   └── models/          # Data models/interfaces
│   │       ├── user.js
│   │       ├── hotel.js
│   │       └── booking.js
│   └── assets/              # Static assets
│       ├── images/
│       └── icons/
```

## Components and Interfaces

### Core Services

#### AuthService
```javascript
class AuthService {
  async login(email, password)
  async register(userData)
  async logout()
  async getCurrentUser()
  isAuthenticated()
  getToken()
  hasRole(role)
  refreshToken()
}
```

#### HotelService
```javascript
class HotelService {
  async getAllHotels()
  async getHotelById(id)
  async searchHotels(criteria)
  async createHotel(hotelData)
  async updateHotel(id, hotelData)
  async deleteHotel(id)
}
```

#### BookingService
```javascript
class BookingService {
  async createBooking(bookingData)
  async getUserBookings()
  async getAllBookings()
  async cancelBooking(id)
  async searchBookings(email)
  async processPayment(bookingId, paymentData)
}
```

### UI Components

#### Component Base Class
```javascript
class Component {
  constructor(element)
  render(data)
  bindEvents()
  destroy()
  show()
  hide()
}
```

#### Key Components

1. **AuthComponent**: Login/Register forms
2. **HotelListComponent**: Hotel grid/list display
3. **HotelDetailComponent**: Individual hotel details
4. **BookingFormComponent**: Booking creation form
5. **BookingListComponent**: User bookings display
6. **ReviewComponent**: Review submission and display
7. **PaymentComponent**: Payment processing form
8. **LoyaltyDashboard**: Points and rewards display
9. **AdminDashboard**: Administrative interface

### Routing System

```javascript
class Router {
  constructor(routes)
  navigate(path)
  back()
  forward()
  getCurrentRoute()
  addRoute(path, handler)
  removeRoute(path)
}

// Route Configuration
const routes = {
  '/': 'HomeComponent',
  '/hotels': 'HotelListComponent',
  '/hotels/:id': 'HotelDetailComponent',
  '/login': 'LoginComponent',
  '/register': 'RegisterComponent',
  '/bookings': 'BookingListComponent',
  '/bookings/new': 'BookingFormComponent',
  '/profile': 'ProfileComponent',
  '/loyalty': 'LoyaltyDashboardComponent',
  '/admin': 'AdminDashboardComponent'
}
```

## Data Models

### User Model
```javascript
class User {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.email = data.email
    this.role = data.role
    this.contactNumber = data.contactNumber
    this.createdAt = data.createdAt
    this.isActive = data.isActive
  }
}
```

### Hotel Model
```javascript
class Hotel {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.address = data.address
    this.city = data.city
    this.pricePerNight = data.pricePerNight
    this.availableRooms = data.availableRooms
    this.rating = data.rating
    this.managerId = data.managerId
    this.createdAt = data.createdAt
  }
}
```

### Booking Model
```javascript
class Booking {
  constructor(data) {
    this.id = data.id
    this.guestName = data.guestName
    this.guestEmail = data.guestEmail
    this.hotelId = data.hotelId
    this.hotelName = data.hotelName
    this.userId = data.userId
    this.checkInDate = data.checkInDate
    this.checkOutDate = data.checkOutDate
    this.numberOfGuests = data.numberOfGuests
    this.totalAmount = data.totalAmount
    this.status = data.status
    this.createdAt = data.createdAt
  }
}
```

## Error Handling

### Error Handling Strategy

1. **API Error Handling**: Centralized error handling in ApiClient
2. **User Feedback**: Toast notifications for success/error messages
3. **Form Validation**: Real-time validation with error display
4. **Network Errors**: Retry mechanisms and offline detection
5. **Authentication Errors**: Automatic token refresh and re-login prompts

### Error Types
```javascript
class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details
    this.timestamp = new Date()
  }
}

class ValidationError extends Error {
  constructor(field, message) {
    super(message)
    this.field = field
    this.type = 'validation'
  }
}
```

### Notification System
```javascript
class NotificationService {
  showSuccess(message)
  showError(message)
  showWarning(message)
  showInfo(message)
  clear()
}
```

## Testing Strategy

### Testing Approach

1. **Unit Testing**: Test individual services and utilities
2. **Integration Testing**: Test component interactions
3. **E2E Testing**: Test complete user workflows
4. **Manual Testing**: Cross-browser and device testing

### Test Structure
```javascript
// Example service test
describe('AuthService', () => {
  beforeEach(() => {
    // Setup
  })
  
  it('should login with valid credentials', async () => {
    // Test implementation
  })
  
  it('should handle login errors', async () => {
    // Test implementation
  })
})
```

### Testing Tools
- **Jest**: Unit testing framework
- **Testing Library**: DOM testing utilities
- **MSW**: API mocking for tests
- **Cypress**: E2E testing (future enhancement)

## Security Considerations

### Authentication Security
1. **JWT Storage**: Store tokens in httpOnly cookies or secure localStorage
2. **Token Expiration**: Handle token refresh automatically
3. **CSRF Protection**: Include CSRF tokens in forms
4. **XSS Prevention**: Sanitize user input and use Content Security Policy

### Data Validation
1. **Client-side Validation**: Immediate user feedback
2. **Server-side Validation**: Security and data integrity
3. **Input Sanitization**: Prevent injection attacks
4. **File Upload Security**: Validate file types and sizes

### API Security
1. **HTTPS Only**: Enforce secure connections
2. **Rate Limiting**: Prevent abuse
3. **CORS Configuration**: Restrict cross-origin requests
4. **Authentication Headers**: Secure token transmission

## Performance Optimization

### Loading Performance
1. **Code Splitting**: Load components on demand
2. **Image Optimization**: Lazy loading and responsive images
3. **Caching Strategy**: Cache API responses and static assets
4. **Minification**: Compress CSS and JavaScript

### Runtime Performance
1. **Virtual Scrolling**: Handle large lists efficiently
2. **Debouncing**: Optimize search and input handling
3. **Memory Management**: Prevent memory leaks
4. **DOM Optimization**: Minimize DOM manipulations

### Caching Strategy
```javascript
class CacheService {
  set(key, data, ttl)
  get(key)
  remove(key)
  clear()
  isExpired(key)
}
```

## Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Design Principles
1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Progressive Enhancement**: Core functionality works everywhere
3. **Touch-Friendly**: Appropriate touch targets and gestures
4. **Accessibility**: WCAG 2.1 AA compliance

### CSS Architecture
```css
/* Mobile-first approach */
.hotel-card {
  /* Mobile styles */
}

@media (min-width: 768px) {
  .hotel-card {
    /* Tablet styles */
  }
}

@media (min-width: 1024px) {
  .hotel-card {
    /* Desktop styles */
  }
}
```

## State Management

### State Management Pattern
```javascript
class StateManager {
  constructor() {
    this.state = {}
    this.subscribers = []
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState }
    this.notifySubscribers()
  }
  
  getState() {
    return { ...this.state }
  }
  
  subscribe(callback) {
    this.subscribers.push(callback)
  }
  
  unsubscribe(callback) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback)
  }
  
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state))
  }
}
```

### Application State Structure
```javascript
const initialState = {
  user: null,
  hotels: [],
  bookings: [],
  reviews: [],
  loyaltyAccount: null,
  loading: false,
  error: null,
  notifications: []
}
```

## Angular Migration Readiness

### Architecture Alignment
1. **Service-based Architecture**: Services map directly to Angular services
2. **Component Structure**: Components follow Angular component patterns
3. **Dependency Injection**: Prepare for Angular DI system
4. **Observable Patterns**: Use Promise/async patterns that convert to Observables

### Migration Strategy
1. **Phase 1**: Convert services to Angular services
2. **Phase 2**: Convert components to Angular components
3. **Phase 3**: Implement Angular routing
4. **Phase 4**: Add Angular-specific features (pipes, directives)

### Code Patterns for Migration
```javascript
// Current pattern (migration-ready)
class HotelService {
  constructor(apiClient) {
    this.apiClient = apiClient
  }
  
  async getHotels() {
    return this.apiClient.get('/api/hotels')
  }
}

// Future Angular service
@Injectable()
export class HotelService {
  constructor(private http: HttpClient) {}
  
  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>('/api/hotels')
  }
}
```

