# Models Directory

This directory will contain data models and interfaces for the FinalDestination frontend application.

## Planned Models

The following models will be implemented in future tasks:

### Core Models
- **user.js** - User data model with validation
- **hotel.js** - Hotel data model with amenities and location
- **booking.js** - Booking data model with dates and guests
- **review.js** - Review data model with ratings and comments
- **payment.js** - Payment data model with transaction details
- **loyalty-account.js** - Loyalty account model with points and transactions

### DTO Models
- **api-response.js** - Standard API response wrapper
- **error-response.js** - Error response model
- **pagination.js** - Pagination metadata model

## Model Architecture

Each model will provide:
- Constructor with data validation
- Getter/setter methods with validation
- Serialization methods (toJSON, fromJSON)
- Validation methods (isValid, getErrors)
- Static factory methods for creation
- Type checking and conversion

## Example Model Structure

```javascript
class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.email = data.email || '';
        this.role = data.role || 'guest';
        // ... other properties
    }
    
    isValid() {
        // Validation logic
    }
    
    toJSON() {
        // Serialization logic
    }
    
    static fromJSON(json) {
        // Deserialization logic
    }
}
```

## Usage

Models will be used by:
- Services for data transformation
- Components for data binding
- API client for request/response handling
- Forms for validation

This provides a consistent data layer that can be easily migrated to Angular models in the future.




