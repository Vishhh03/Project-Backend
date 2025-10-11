/**
 * API Configuration
 * 
 * This file contains configuration settings for API endpoints and requests.
 * It will be fully implemented in future tasks.
 */

// Placeholder for API configuration
// This will be implemented in task 2.1 (Create ApiClient service)

window.FinalDestination = window.FinalDestination || {};
window.FinalDestination.ApiConfig = {
    baseUrl: '/api',
    timeout: 30000,
    retryAttempts: 3,
    
    endpoints: {
        // Authentication endpoints
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            refresh: '/auth/refresh'
        },
        
        // Hotel endpoints
        hotels: {
            list: '/hotels',
            detail: '/hotels/{id}',
            search: '/hotels/search'
        },
        
        // Booking endpoints
        bookings: {
            create: '/bookings',
            list: '/bookings',
            detail: '/bookings/{id}',
            cancel: '/bookings/{id}/cancel'
        },
        
        // Review endpoints
        reviews: {
            create: '/reviews',
            list: '/reviews',
            update: '/reviews/{id}',
            delete: '/reviews/{id}'
        },
        
        // Payment endpoints
        payments: {
            process: '/payments',
            history: '/payments/history'
        },
        
        // Loyalty endpoints
        loyalty: {
            account: '/loyalty/account',
            transactions: '/loyalty/transactions'
        }
    }
};


