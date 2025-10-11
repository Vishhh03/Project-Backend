/**
 * Hotel Model - Data model for hotel objects
 * Provides validation and utility methods for hotel data
 */
class Hotel {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.address = data.address || '';
        this.city = data.city || '';
        this.pricePerNight = data.pricePerNight || 0;
        this.availableRooms = data.availableRooms || 0;
        this.rating = data.rating || 0;
        this.reviewCount = data.reviewCount || 0;
        this.managerId = data.managerId || null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        
        // Navigation properties
        this.manager = data.manager || null;
        this.bookings = data.bookings || [];
        this.reviews = data.reviews || [];
    }

    /**
     * Validate hotel data
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validate() {
        const errors = [];

        // Required field validation
        if (!this.name || this.name.trim().length === 0) {
            errors.push('Hotel name is required');
        } else if (this.name.trim().length < 2) {
            errors.push('Hotel name must be at least 2 characters long');
        } else if (this.name.trim().length > 100) {
            errors.push('Hotel name must be less than 100 characters');
        }

        if (!this.address || this.address.trim().length === 0) {
            errors.push('Hotel address is required');
        } else if (this.address.trim().length < 5) {
            errors.push('Hotel address must be at least 5 characters long');
        } else if (this.address.trim().length > 200) {
            errors.push('Hotel address must be less than 200 characters');
        }

        if (!this.city || this.city.trim().length === 0) {
            errors.push('City is required');
        } else if (this.city.trim().length < 2) {
            errors.push('City name must be at least 2 characters long');
        } else if (this.city.trim().length > 50) {
            errors.push('City name must be less than 50 characters');
        }

        // Numeric field validation
        if (this.pricePerNight <= 0) {
            errors.push('Price per night must be greater than 0');
        } else if (this.pricePerNight > 10000) {
            errors.push('Price per night must be less than $10,000');
        }

        if (this.availableRooms < 0) {
            errors.push('Available rooms cannot be negative');
        } else if (this.availableRooms > 1000) {
            errors.push('Available rooms must be less than 1,000');
        }

        if (this.rating < 0 || this.rating > 5) {
            errors.push('Rating must be between 0 and 5');
        }

        if (this.reviewCount < 0) {
            errors.push('Review count cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get formatted price string
     * @returns {string} Formatted price (e.g., "$99.99")
     */
    getFormattedPrice() {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(this.pricePerNight);
    }

    /**
     * Get star rating display
     * @returns {string} Star rating string (e.g., "★★★★☆")
     */
    getStarRating() {
        const fullStars = Math.floor(this.rating);
        const hasHalfStar = this.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    /**
     * Get rating with review count
     * @returns {string} Rating display (e.g., "4.5 (123 reviews)")
     */
    getRatingDisplay() {
        const ratingText = this.rating.toFixed(1);
        const reviewText = this.reviewCount === 1 ? 'review' : 'reviews';
        return `${ratingText} (${this.reviewCount} ${reviewText})`;
    }

    /**
     * Check if hotel is available
     * @returns {boolean} True if hotel has available rooms
     */
    isAvailable() {
        return this.availableRooms > 0;
    }

    /**
     * Get availability status text
     * @returns {string} Availability status
     */
    getAvailabilityStatus() {
        if (this.availableRooms === 0) {
            return 'Fully Booked';
        } else if (this.availableRooms <= 5) {
            return `Only ${this.availableRooms} rooms left`;
        } else {
            return `${this.availableRooms} rooms available`;
        }
    }

    /**
     * Get formatted creation date
     * @returns {string} Formatted date string
     */
    getFormattedCreatedDate() {
        return this.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get hotel summary for display
     * @returns {string} Hotel summary
     */
    getSummary() {
        return `${this.name} in ${this.city} - ${this.getFormattedPrice()}/night - ${this.getRatingDisplay()}`;
    }

    /**
     * Check if hotel matches search criteria
     * @param {Object} criteria - Search criteria
     * @returns {boolean} True if hotel matches criteria
     */
    matchesCriteria(criteria) {
        if (criteria.city && !this.city.toLowerCase().includes(criteria.city.toLowerCase())) {
            return false;
        }

        if (criteria.maxPrice && this.pricePerNight > criteria.maxPrice) {
            return false;
        }

        if (criteria.minRating && this.rating < criteria.minRating) {
            return false;
        }

        if (criteria.minRooms && this.availableRooms < criteria.minRooms) {
            return false;
        }

        return true;
    }

    /**
     * Convert to plain object for API requests
     * @returns {Object} Plain object representation
     */
    toApiObject() {
        return {
            id: this.id,
            name: this.name.trim(),
            address: this.address.trim(),
            city: this.city.trim(),
            pricePerNight: this.pricePerNight,
            availableRooms: this.availableRooms,
            rating: this.rating,
            managerId: this.managerId
        };
    }

    /**
     * Create Hotel instance from API response
     * @param {Object} apiData - Data from API
     * @returns {Hotel} Hotel instance
     */
    static fromApiResponse(apiData) {
        return new Hotel(apiData);
    }

    /**
     * Create multiple Hotel instances from API response array
     * @param {Array} apiDataArray - Array of data from API
     * @returns {Array} Array of Hotel instances
     */
    static fromApiResponseArray(apiDataArray) {
        return apiDataArray.map(data => new Hotel(data));
    }

    /**
     * Get default hotel object for forms
     * @returns {Hotel} Default hotel instance
     */
    static getDefault() {
        return new Hotel({
            name: '',
            address: '',
            city: '',
            pricePerNight: 0,
            availableRooms: 1,
            rating: 0
        });
    }

    /**
     * Compare two hotels for sorting
     * @param {Hotel} hotelA - First hotel
     * @param {Hotel} hotelB - Second hotel
     * @param {string} sortBy - Field to sort by
     * @param {string} sortOrder - Sort order (asc/desc)
     * @returns {number} Comparison result
     */
    static compare(hotelA, hotelB, sortBy, sortOrder = 'asc') {
        let valueA, valueB;

        switch (sortBy.toLowerCase()) {
            case 'name':
                valueA = hotelA.name.toLowerCase();
                valueB = hotelB.name.toLowerCase();
                break;
            case 'price':
                valueA = hotelA.pricePerNight;
                valueB = hotelB.pricePerNight;
                break;
            case 'rating':
                valueA = hotelA.rating;
                valueB = hotelB.rating;
                break;
            case 'city':
                valueA = hotelA.city.toLowerCase();
                valueB = hotelB.city.toLowerCase();
                break;
            case 'availability':
                valueA = hotelA.availableRooms;
                valueB = hotelB.availableRooms;
                break;
            default:
                return 0;
        }

        const isAscending = sortOrder.toLowerCase() === 'asc';

        if (valueA < valueB) {
            return isAscending ? -1 : 1;
        }
        if (valueA > valueB) {
            return isAscending ? 1 : -1;
        }
        return 0;
    }
}

// Export for use in other modules
window.Hotel = Hotel;


