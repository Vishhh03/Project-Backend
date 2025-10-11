/**
 * BookingService - Handles all booking-related operations
 * Provides CRUD operations, date validation, and booking status management
 */
class BookingService {
    constructor(apiClient, authService, loyaltyService = null) {
        this.apiClient = apiClient;
        this.authService = authService;
        this.loyaltyService = loyaltyService;
        this.baseUrl = '/api/bookings';
    }

    /**
     * Create a new booking
     * @param {Object} bookingData - Booking information
     * @returns {Promise<Object>} Created booking
     */
    async createBooking(bookingData) {
        try {
            // Validate booking data before sending
            this.validateBookingData(bookingData);
            
            // Ensure user is authenticated
            if (!this.authService.isAuthenticated()) {
                throw new Error('Authentication required to create booking');
            }

            const response = await this.apiClient.post(this.baseUrl, bookingData);
            
            // Award loyalty points after successful booking
            if (response && response.id && this.loyaltyService) {
                try {
                    await this.awardLoyaltyPoints(response.id, response.totalAmount);
                } catch (loyaltyError) {
                    console.warn('Failed to award loyalty points:', loyaltyError);
                    // Don't fail the booking if loyalty points fail
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }

    /**
     * Get all bookings for the current user
     * @returns {Promise<Array>} User's bookings
     */
    async getUserBookings() {
        try {
            if (!this.authService.isAuthenticated()) {
                throw new Error('Authentication required to view bookings');
            }

            const response = await this.apiClient.get(`${this.baseUrl}/user`);
            return response || [];
        } catch (error) {
            console.error('Error fetching user bookings:', error);
            throw error;
        }
    }

    /**
     * Get all bookings (admin/manager only)
     * @returns {Promise<Array>} All bookings
     */
    async getAllBookings() {
        try {
            if (!this.authService.hasRole(['Admin', 'Manager'])) {
                throw new Error('Insufficient permissions to view all bookings');
            }

            const response = await this.apiClient.get(this.baseUrl);
            return response || [];
        } catch (error) {
            console.error('Error fetching all bookings:', error);
            throw error;
        }
    }

    /**
     * Get booking by ID
     * @param {number} bookingId - Booking ID
     * @returns {Promise<Object>} Booking details
     */
    async getBookingById(bookingId) {
        try {
            if (!bookingId) {
                throw new Error('Booking ID is required');
            }

            const response = await this.apiClient.get(`${this.baseUrl}/${bookingId}`);
            return response;
        } catch (error) {
            console.error('Error fetching booking:', error);
            throw error;
        }
    }

    /**
     * Cancel a booking
     * @param {number} bookingId - Booking ID to cancel
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelBooking(bookingId) {
        try {
            if (!bookingId) {
                throw new Error('Booking ID is required');
            }

            if (!this.authService.isAuthenticated()) {
                throw new Error('Authentication required to cancel booking');
            }

            const response = await this.apiClient.delete(`${this.baseUrl}/${bookingId}`);
            return response;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    }

    /**
     * Search bookings by email (admin/manager only)
     * @param {string} email - Guest email to search
     * @returns {Promise<Array>} Matching bookings
     */
    async searchBookings(email) {
        try {
            if (!email) {
                throw new Error('Email is required for booking search');
            }

            if (!this.authService.hasRole(['Admin', 'Manager'])) {
                throw new Error('Insufficient permissions to search bookings');
            }

            const response = await this.apiClient.get(`${this.baseUrl}/search?email=${encodeURIComponent(email)}`);
            return response || [];
        } catch (error) {
            console.error('Error searching bookings:', error);
            throw error;
        }
    }

    /**
     * Check room availability for given dates
     * @param {number} hotelId - Hotel ID
     * @param {string} checkInDate - Check-in date (YYYY-MM-DD)
     * @param {string} checkOutDate - Check-out date (YYYY-MM-DD)
     * @returns {Promise<Object>} Availability information
     */
    async checkAvailability(hotelId, checkInDate, checkOutDate) {
        try {
            this.validateDateRange(checkInDate, checkOutDate);

            const params = new URLSearchParams({
                hotelId: hotelId.toString(),
                checkInDate,
                checkOutDate
            });

            const response = await this.apiClient.get(`${this.baseUrl}/availability?${params}`);
            return response;
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }

    /**
     * Calculate booking total cost
     * @param {number} hotelId - Hotel ID
     * @param {string} checkInDate - Check-in date
     * @param {string} checkOutDate - Check-out date
     * @param {number} numberOfGuests - Number of guests
     * @returns {Promise<Object>} Cost calculation
     */
    async calculateBookingCost(hotelId, checkInDate, checkOutDate, numberOfGuests) {
        try {
            this.validateDateRange(checkInDate, checkOutDate);
            
            if (!numberOfGuests || numberOfGuests < 1) {
                throw new Error('Number of guests must be at least 1');
            }

            const params = new URLSearchParams({
                hotelId: hotelId.toString(),
                checkInDate,
                checkOutDate,
                numberOfGuests: numberOfGuests.toString()
            });

            const response = await this.apiClient.get(`${this.baseUrl}/calculate-cost?${params}`);
            return response;
        } catch (error) {
            console.error('Error calculating booking cost:', error);
            throw error;
        }
    }

    /**
     * Validate booking data
     * @param {Object} bookingData - Booking data to validate
     */
    validateBookingData(bookingData) {
        const required = ['guestName', 'guestEmail', 'hotelId', 'checkInDate', 'checkOutDate', 'numberOfGuests'];
        
        for (const field of required) {
            if (!bookingData[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Validate email format
        if (!this.isValidEmail(bookingData.guestEmail)) {
            throw new Error('Invalid email format');
        }

        // Validate date range
        this.validateDateRange(bookingData.checkInDate, bookingData.checkOutDate);

        // Validate number of guests
        if (bookingData.numberOfGuests < 1 || bookingData.numberOfGuests > 10) {
            throw new Error('Number of guests must be between 1 and 10');
        }
    }

    /**
     * Validate date range
     * @param {string} checkInDate - Check-in date
     * @param {string} checkOutDate - Check-out date
     */
    validateDateRange(checkInDate, checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if dates are valid
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            throw new Error('Invalid date format');
        }

        // Check-in date cannot be in the past
        if (checkIn < today) {
            throw new Error('Check-in date cannot be in the past');
        }

        // Check-out date must be after check-in date
        if (checkOut <= checkIn) {
            throw new Error('Check-out date must be after check-in date');
        }

        // Maximum booking duration (e.g., 30 days)
        const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        if (checkOut - checkIn > maxDuration) {
            throw new Error('Booking duration cannot exceed 30 days');
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get booking status display text
     * @param {string} status - Booking status
     * @returns {string} Display text for status
     */
    getStatusDisplayText(status) {
        const statusMap = {
            'Confirmed': 'Confirmed',
            'Pending': 'Pending Confirmation',
            'Cancelled': 'Cancelled',
            'Completed': 'Completed',
            'CheckedIn': 'Checked In',
            'CheckedOut': 'Checked Out'
        };
        return statusMap[status] || status;
    }

    /**
     * Check if booking can be cancelled
     * @param {Object} booking - Booking object
     * @returns {boolean} True if booking can be cancelled
     */
    canCancelBooking(booking) {
        if (!booking) return false;
        
        const cancellableStatuses = ['Confirmed', 'Pending'];
        if (!cancellableStatuses.includes(booking.status)) {
            return false;
        }

        // Check if check-in date is at least 24 hours away
        const checkInDate = new Date(booking.checkInDate);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
        
        return hoursUntilCheckIn >= 24;
    }

    /**
     * Format booking dates for display
     * @param {string} dateString - Date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calculate number of nights
     * @param {string} checkInDate - Check-in date
     * @param {string} checkOutDate - Check-out date
     * @returns {number} Number of nights
     */
    calculateNights(checkInDate, checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut - checkIn;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    /**
     * Award loyalty points for a booking
     * @param {number} bookingId - Booking ID
     * @param {number} totalAmount - Booking total amount
     * @returns {Promise<Object>} Loyalty transaction
     */
    async awardLoyaltyPoints(bookingId, totalAmount) {
        if (!this.loyaltyService) {
            throw new Error('Loyalty service not available');
        }

        try {
            const transaction = await this.loyaltyService.awardPointsForBooking(bookingId, totalAmount);
            return transaction;
        } catch (error) {
            console.error('Error awarding loyalty points:', error);
            throw error;
        }
    }

    /**
     * Calculate loyalty points that will be earned for a booking
     * @param {number} totalAmount - Booking total amount
     * @param {string} membershipLevel - User's membership level
     * @returns {number} Points to be earned
     */
    calculateEarnablePoints(totalAmount, membershipLevel = 'Bronze') {
        if (!this.loyaltyService) {
            return 0;
        }

        return this.loyaltyService.calculatePointsForBooking(totalAmount, membershipLevel);
    }

    /**
     * Get booking with loyalty information
     * @param {number} bookingId - Booking ID
     * @returns {Promise<Object>} Booking with loyalty details
     */
    async getBookingWithLoyaltyInfo(bookingId) {
        try {
            const booking = await this.getBookingById(bookingId);
            
            if (booking && this.loyaltyService) {
                // Add loyalty points information
                booking.loyaltyPoints = {
                    earned: this.calculateEarnablePoints(booking.totalAmount),
                    membershipLevel: 'Bronze' // This would come from user's loyalty account
                };
            }
            
            return booking;
        } catch (error) {
            console.error('Error fetching booking with loyalty info:', error);
            throw error;
        }
    }

    /**
     * Get bookings for a specific hotel
     * @param {number} hotelId - Hotel ID
     * @returns {Promise<Array>} Hotel bookings
     */
    async getBookingsByHotel(hotelId) {
        try {
            if (!hotelId || hotelId <= 0) {
                throw new Error('Valid hotel ID is required');
            }

            const response = await this.apiClient.get(`${this.baseUrl}/hotel/${hotelId}`);
            return response || [];
        } catch (error) {
            console.error('Error getting bookings by hotel:', error);
            
            // Fallback: get all bookings and filter by hotelId
            try {
                const allBookings = await this.getAllBookings();
                return allBookings.filter(booking => booking.hotelId === hotelId);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw error;
            }
        }
    }

    /**
     * Set loyalty service for dependency injection
     * @param {LoyaltyService} loyaltyService - Loyalty service instance
     */
    setLoyaltyService(loyaltyService) {
        this.loyaltyService = loyaltyService;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingService;
}


