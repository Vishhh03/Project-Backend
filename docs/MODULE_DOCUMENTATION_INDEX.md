# Module Documentation Index

This documentation provides detailed information about each module in the Smart Hotel Booking System, designed for different team members who worked on specific components.

## 📋 Module Overview

| Module | Team Member | Documentation | Key Components |
|--------|-------------|---------------|----------------|
| **Authentication & Security** | Security Team | [AUTH_MODULE.md](AUTH_MODULE.md) | JWT, User Management, Authorization |
| **Hotel Management** | Hotel Team | [HOTEL_MODULE.md](HOTEL_MODULE.md) | Hotels, Search, Caching |
| **Booking System** | Booking Team | [BOOKING_MODULE.md](BOOKING_MODULE.md) | Reservations, Availability |
| **Payment Processing** | Payment Team | [PAYMENT_MODULE.md](PAYMENT_MODULE.md) | Mock Payments, Transactions |
| **Review & Rating** | Review Team | [REVIEW_MODULE.md](REVIEW_MODULE.md) | Reviews, Ratings, Feedback |
| **Loyalty Program** | Loyalty Team | [LOYALTY_MODULE.md](LOYALTY_MODULE.md) | Points, Rewards, Transactions |
| **Data Layer** | Database Team | [DATA_MODULE.md](DATA_MODULE.md) | Entity Framework, Models |
| **Frontend Application** | Frontend Team | [FRONTEND_MODULE.md](FRONTEND_MODULE.md) | SPA, UI Components |
| **Infrastructure** | DevOps Team | [INFRASTRUCTURE_MODULE.md](INFRASTRUCTURE_MODULE.md) | Configuration, Middleware |

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Auth UI   │ │  Hotel UI   │ │ Booking UI  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Controllers                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │AuthController│ │HotelController│ │BookingController│      │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Services                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ AuthService │ │HotelService │ │BookingService│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ HotelContext│ │   Models    │ │ Repositories│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Module Integration Flow

1. **Frontend** → Makes HTTP requests to API controllers
2. **Controllers** → Validate input and call business services
3. **Services** → Implement business logic and call data layer
4. **Data Layer** → Manages database operations and entity relationships

## 📚 How to Use This Documentation

Each module documentation includes:

- **Overview**: What the module does and why it exists
- **Architecture**: How the module is structured
- **Key Components**: Main classes and their responsibilities
- **Implementation Details**: Code examples and explanations
- **Integration Points**: How it connects with other modules
- **Configuration**: Settings and environment variables
- **Testing**: How to test the module
- **Troubleshooting**: Common issues and solutions

## 🚀 Getting Started

1. Read the [INFRASTRUCTURE_MODULE.md](INFRASTRUCTURE_MODULE.md) first to understand the overall setup
2. Review the [DATA_MODULE.md](DATA_MODULE.md) to understand the data models
3. Then dive into your specific module documentation
4. Check integration points with other modules as needed

## 📞 Support

For questions about specific modules, refer to the troubleshooting section in each module's documentation or contact the respective team member.