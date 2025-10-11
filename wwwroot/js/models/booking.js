/**
 * Booking Model - Represents a hotel booking
 */
class Booking {
    constructor(data = {}) {
        this.id = data.id || null;
        this.guestName = data.guestName || '';
        this.guestEmail = data.guestEmail || '';
        this.hotelId = data.hotelId || null;
        this.hotelName = data.hotelName || '';
        this.userId = data.userId || null;
        this.checkInDate = data.checkInDate || '';
        this.checkOutDate = data.checkOutDate || '';
        this.numberOfGuests = data.numberOfGuests || 1;
        this.totalAmount = data.totalAmount || 0;
        this.status = data.status || 'Pending';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validate booking data
     * @returns {Object} Validation result with isValid and errors
     */
    validate() {
        const errors = [];

        // Required field validation
        if (!this.guestName || this.guestName.trim().length === 0) {
            errors.push('Guest name is required');
        }

        if (!this.guestEmail || this.guestEmail.trim().length === 0) {
            errors.push('Guest email is required');
        } else if (!this.isValidEmail(this.guestEmail)) {
            errors.push('Invalid email format');
        }

        if (!this.hotelId) {
            errors.push('Hotel selection is required');
        }

        if (!this.checkInDate) {
            errors.push('Check-in date is required');
        }

        if (!this.checkOutDate) {
            errors.push('Check-out date is required');
        }

        if (!this.numberOfGuests || this.numberOfGuests < 1) {
            errors.push('Number of guests must be at least 1');
        }

        // Date validation
        if (this.checkInDate && this.checkOutDate) {
            const checkIn = new Date(this.checkInDate);
            const checkOut = new Date(this.checkOutDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (checkIn < today) {
                errors.push('Check-in date cannot be in the past');
            }

            if (checkOut <= checkIn) {
                errors.push('Check-out date must be after check-in date');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if email format is valid
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Calculate number of nights
     * @returns {number} Number of nights
     */
    getNights() {
        if (!this.checkInDate || !this.checkOutDate) return 0;
        
        const checkIn = new Date(this.checkInDate);
        const checkOut = new Date(this.checkOutDate);
        const timeDiff = checkOut - checkIn;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    /**
     * Get formatted check-in date
     * @returns {string} Formatted date
     */
    getFormattedCheckInDate() {
        if (!this.checkInDate) return '';
        return new Date(this.checkInDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get formatted check-out date
     * @returns {string} Formatted date
     */
    getFormattedCheckOutDate() {
        if (!this.checkOutDate) return '';
        return new Date(this.checkOutDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get status display text
     * @returns {string} Display text for status
     */
    getStatusDisplay() {
        const statusMap = {
            'Confirmed': 'Confirmed',
            'Pending': 'Pending Confirmation',
            'Cancelled': 'Cancelled',
            'Completed': 'Completed',
            'CheckedIn': 'Checked In',
            'CheckedOut': 'Checked Out'
        };
        return statusMap[this.status] || this.status;
    }

    /**
     * Check if booking can be cancelled
     * @returns {boolean} True if booking can be cancelled
     */
    canBeCancelled() {
        const cancellableStatuses = ['Confirmed', 'Pending'];
        if (!cancellableStatuses.includes(this.status)) {
            return false;
        }

        // Check if check-in date is at least 24 hours away
        const checkInDate = new Date(this.checkInDate);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
        
        return hoursUntilCheckIn >= 24;
    }

    /**
     * Get booking duration text
     * @returns {string} Duration description
     */
    getDurationText() {
        const nights = this.getNights();
        return nights === 1 ? '1 night' : `${nights} nights`;
    }

    /**
     * Convert to plain object for API calls
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            guestName: this.guestName,
            guestEmail: this.guestEmail,
            hotelId: this.hotelId,
            hotelName: this.hotelName,
            userId: this.userId,
            checkInDate: this.checkInDate,
            checkOutDate: this.checkOutDate,
            numberOfGuests: this.numberOfGuests,
            totalAmount: this.totalAmount,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create booking from API response
     * @param {Object} apiData - Data from API
     * @returns {Booking} New booking instance
     */
    static fromApiResponse(apiData) {
        return new Booking(apiData);
    }

    /**
     * Create booking for API request
     * @param {Object} formData - Form data
     * @returns {Object} Data formatted for API
     */
    static toApiRequest(formData) {
        return {
            guestName: formData.guestName,
            guestEmail: formData.guestEmail,
            hotelId: parseInt(formData.hotelId),
            checkInDate: formData.checkInDate,
            checkOutDate: formData.checkOutDate,
            numberOfGuests: parseInt(formData.numberOfGuests)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Booking;
}


