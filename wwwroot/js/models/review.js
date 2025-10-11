/**
 * Review model class for handling review data
 */
class Review {
    constructor(data = {}) {
        this.id = data.id || 0;
        this.userId = data.userId || 0;
        this.userName = data.userName || '';
        this.hotelId = data.hotelId || 0;
        this.hotelName = data.hotelName || '';
        this.rating = data.rating || 0;
        this.comment = data.comment || '';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    }

    /**
     * Validate review data
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validate() {
        const errors = [];

        if (!this.hotelId || this.hotelId <= 0) {
            errors.push('Hotel ID is required and must be positive');
        }

        if (!this.rating || this.rating < 1 || this.rating > 5) {
            errors.push('Rating must be between 1 and 5');
        }

        if (this.comment && this.comment.length > 1000) {
            errors.push('Comment cannot exceed 1000 characters');
        }

        if (this.comment && this.comment.length > 0 && this.comment.length < 10) {
            errors.push('Comment must be at least 10 characters long');
        }

        // Validate comment characters (only letters, numbers, spaces, and common punctuation)
        if (this.comment && !/^[a-zA-Z0-9\s\.\,\!\?\-\(\)\'\""\:;]*$/.test(this.comment)) {
            errors.push('Comment contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to API request format
     * @returns {Object} Review data formatted for API requests
     */
    toApiRequest() {
        return {
            hotelId: this.hotelId,
            rating: this.rating,
            comment: this.comment || ''
        };
    }

    /**
     * Convert to update API request format
     * @returns {Object} Review data formatted for update API requests
     */
    toUpdateApiRequest() {
        return {
            rating: this.rating,
            comment: this.comment || ''
        };
    }

    /**
     * Get formatted creation date
     * @returns {string} Formatted date string
     */
    getFormattedDate() {
        return this.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get star rating display
     * @returns {string} Star rating as string (★★★★☆)
     */
    getStarRating() {
        const fullStars = '★'.repeat(this.rating);
        const emptyStars = '☆'.repeat(5 - this.rating);
        return fullStars + emptyStars;
    }

    /**
     * Get truncated comment for display
     * @param {number} maxLength Maximum length of comment
     * @returns {string} Truncated comment
     */
    getTruncatedComment(maxLength = 150) {
        if (!this.comment || this.comment.length <= maxLength) {
            return this.comment;
        }
        return this.comment.substring(0, maxLength) + '...';
    }

    /**
     * Check if review belongs to current user
     * @param {number} currentUserId Current user's ID
     * @returns {boolean} True if review belongs to current user
     */
    belongsToUser(currentUserId) {
        return this.userId === currentUserId;
    }

    /**
     * Create Review instance from API response
     * @param {Object} apiData API response data
     * @returns {Review} New Review instance
     */
    static fromApiResponse(apiData) {
        return new Review(apiData);
    }

    /**
     * Create multiple Review instances from API response array
     * @param {Array} apiDataArray Array of API response data
     * @returns {Array<Review>} Array of Review instances
     */
    static fromApiResponseArray(apiDataArray) {
        return apiDataArray.map(data => Review.fromApiResponse(data));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Review;
}


