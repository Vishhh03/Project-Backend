/**
 * ReviewService - Handles all review-related operations
 * Provides CRUD operations, validation, filtering, and sorting capabilities
 */
class ReviewService {
    constructor(apiClient, authService) {
        this.apiClient = apiClient;
        this.authService = authService;
        this.baseUrl = '/api/reviews';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get all reviews for a specific hotel with pagination
     * @param {number} hotelId Hotel ID
     * @param {Object} options Pagination and filtering options
     * @returns {Promise<Object>} Reviews data with pagination info
     */
    async getReviewsByHotel(hotelId, options = {}) {
        try {
            const {
                page = 1,
                pageSize = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                minRating = null,
                maxRating = null
            } = options;

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString()
            });

            const cacheKey = `hotel-reviews-${hotelId}-${params.toString()}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return this._processReviewsResponse(cached.data, sortBy, sortOrder, minRating, maxRating);
                }
            }

            const response = await this.apiClient.get(`${this.baseUrl}/hotel/${hotelId}?${params}`);
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });

            return this._processReviewsResponse(response, sortBy, sortOrder, minRating, maxRating);
        } catch (error) {
            console.error('Error fetching hotel reviews:', error);
            throw new Error('Failed to fetch hotel reviews');
        }
    }

    /**
     * Get a specific review by ID
     * @param {number} reviewId Review ID
     * @returns {Promise<Review>} Review instance
     */
    async getReviewById(reviewId) {
        try {
            const response = await this.apiClient.get(`${this.baseUrl}/${reviewId}`);
            return Review.fromApiResponse(response.data);
        } catch (error) {
            console.error('Error fetching review:', error);
            throw new Error('Failed to fetch review');
        }
    }

    /**
     * Get all reviews by the current authenticated user
     * @param {Object} options Filtering and sorting options
     * @returns {Promise<Array<Review>>} Array of user's reviews
     */
    async getMyReviews(options = {}) {
        try {
            if (!this.authService.isAuthenticated()) {
                throw new Error('User must be authenticated to view their reviews');
            }

            const response = await this.apiClient.get(`${this.baseUrl}/my`);
            let reviews = Review.fromApiResponseArray(response.data);

            // Apply client-side filtering and sorting
            reviews = this._applyFiltersAndSorting(reviews, options);

            return reviews;
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            throw new Error('Failed to fetch your reviews');
        }
    }

    /**
     * Create a new review
     * @param {Object} reviewData Review data
     * @returns {Promise<Review>} Created review instance
     */
    async createReview(reviewData) {
        try {
            if (!this.authService.isAuthenticated()) {
                throw new Error('User must be authenticated to create a review');
            }

            // Create review instance for validation
            const review = new Review(reviewData);
            const validation = review.validate();

            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const response = await this.apiClient.post(this.baseUrl, review.toApiRequest());
            const createdReview = Review.fromApiResponse(response.data);

            // Clear relevant caches
            this._clearHotelReviewsCache(reviewData.hotelId);

            return createdReview;
        } catch (error) {
            console.error('Error creating review:', error);
            if (error.message.includes('Validation failed')) {
                throw error;
            }
            throw new Error('Failed to create review');
        }
    }

    /**
     * Update an existing review
     * @param {number} reviewId Review ID
     * @param {Object} updateData Updated review data
     * @returns {Promise<Review>} Updated review instance
     */
    async updateReview(reviewId, updateData) {
        try {
            if (!this.authService.isAuthenticated()) {
                throw new Error('User must be authenticated to update a review');
            }

            // Create review instance for validation
            const review = new Review(updateData);
            const validation = review.validate();

            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const response = await this.apiClient.put(`${this.baseUrl}/${reviewId}`, review.toUpdateApiRequest());
            const updatedReview = Review.fromApiResponse(response.data);

            // Clear relevant caches
            this._clearHotelReviewsCache(updatedReview.hotelId);

            return updatedReview;
        } catch (error) {
            console.error('Error updating review:', error);
            if (error.message.includes('Validation failed')) {
                throw error;
            }
            throw new Error('Failed to update review');
        }
    }

    /**
     * Delete a review
     * @param {number} reviewId Review ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deleteReview(reviewId) {
        try {
            if (!this.authService.isAuthenticated()) {
                throw new Error('User must be authenticated to delete a review');
            }

            await this.apiClient.delete(`${this.baseUrl}/${reviewId}`);

            // Clear all caches since we don't know which hotel this review belonged to
            this.cache.clear();

            return true;
        } catch (error) {
            console.error('Error deleting review:', error);
            throw new Error('Failed to delete review');
        }
    }

    /**
     * Get hotel rating statistics
     * @param {number} hotelId Hotel ID
     * @returns {Promise<Object>} Rating statistics
     */
    async getHotelRatingStats(hotelId) {
        try {
            const response = await this.apiClient.get(`${this.baseUrl}/hotel/${hotelId}/stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching hotel rating stats:', error);
            throw new Error('Failed to fetch hotel rating statistics');
        }
    }

    /**
     * Calculate average rating from reviews array
     * @param {Array<Review>} reviews Array of reviews
     * @returns {number} Average rating
     */
    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) {
            return 0;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
    }

    /**
     * Get rating distribution for a set of reviews
     * @param {Array<Review>} reviews Array of reviews
     * @returns {Object} Rating distribution (1-5 stars with counts)
     */
    getRatingDistribution(reviews) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        reviews.forEach(review => {
            if (review.rating >= 1 && review.rating <= 5) {
                distribution[review.rating]++;
            }
        });

        return distribution;
    }

    /**
     * Filter reviews by rating range
     * @param {Array<Review>} reviews Array of reviews
     * @param {number} minRating Minimum rating (1-5)
     * @param {number} maxRating Maximum rating (1-5)
     * @returns {Array<Review>} Filtered reviews
     */
    filterByRating(reviews, minRating = null, maxRating = null) {
        return reviews.filter(review => {
            if (minRating !== null && review.rating < minRating) return false;
            if (maxRating !== null && review.rating > maxRating) return false;
            return true;
        });
    }

    /**
     * Sort reviews by specified criteria
     * @param {Array<Review>} reviews Array of reviews
     * @param {string} sortBy Sort criteria ('rating', 'createdAt', 'userName')
     * @param {string} sortOrder Sort order ('asc' or 'desc')
     * @returns {Array<Review>} Sorted reviews
     */
    sortReviews(reviews, sortBy = 'createdAt', sortOrder = 'desc') {
        const sortedReviews = [...reviews];

        sortedReviews.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'rating':
                    valueA = a.rating;
                    valueB = b.rating;
                    break;
                case 'userName':
                    valueA = a.userName.toLowerCase();
                    valueB = b.userName.toLowerCase();
                    break;
                case 'createdAt':
                default:
                    valueA = a.createdAt;
                    valueB = b.createdAt;
                    break;
            }

            if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sortedReviews;
    }

    /**
     * Search reviews by comment content
     * @param {Array<Review>} reviews Array of reviews
     * @param {string} searchTerm Search term
     * @returns {Array<Review>} Filtered reviews
     */
    searchReviews(reviews, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return reviews;
        }

        const term = searchTerm.toLowerCase().trim();
        return reviews.filter(review => 
            review.comment.toLowerCase().includes(term) ||
            review.userName.toLowerCase().includes(term)
        );
    }

    /**
     * Check if user can review a hotel (has stayed there)
     * @param {number} hotelId Hotel ID
     * @returns {Promise<boolean>} True if user can review
     */
    async canUserReviewHotel(hotelId) {
        try {
            if (!this.authService.isAuthenticated()) {
                return false;
            }

            // This would typically check if user has a completed booking for this hotel
            // For now, we'll assume authenticated users can review any hotel
            // In a real implementation, this would check booking history
            return true;
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            return false;
        }
    }

    /**
     * Check if user has already reviewed a hotel
     * @param {number} hotelId Hotel ID
     * @returns {Promise<Review|null>} Existing review or null
     */
    async getUserReviewForHotel(hotelId) {
        try {
            if (!this.authService.isAuthenticated()) {
                return null;
            }

            const myReviews = await this.getMyReviews();
            return myReviews.find(review => review.hotelId === hotelId) || null;
        } catch (error) {
            console.error('Error checking existing review:', error);
            return null;
        }
    }

    /**
     * Clear cache for hotel reviews
     * @private
     * @param {number} hotelId Hotel ID
     */
    _clearHotelReviewsCache(hotelId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(`hotel-reviews-${hotelId}-`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Process reviews response with filtering and sorting
     * @private
     * @param {Object} response API response
     * @param {string} sortBy Sort criteria
     * @param {string} sortOrder Sort order
     * @param {number} minRating Minimum rating filter
     * @param {number} maxRating Maximum rating filter
     * @returns {Object} Processed reviews data
     */
    _processReviewsResponse(response, sortBy, sortOrder, minRating, maxRating) {
        let reviews = Review.fromApiResponseArray(response.data);

        // Apply client-side filtering
        if (minRating !== null || maxRating !== null) {
            reviews = this.filterByRating(reviews, minRating, maxRating);
        }

        // Apply client-side sorting
        reviews = this.sortReviews(reviews, sortBy, sortOrder);

        return {
            reviews,
            totalCount: parseInt(response.headers['x-total-count']) || reviews.length,
            averageRating: parseFloat(response.headers['x-average-rating']) || 0,
            page: parseInt(response.headers['x-page']) || 1,
            pageSize: parseInt(response.headers['x-page-size']) || 10
        };
    }

    /**
     * Apply filters and sorting to reviews array
     * @private
     * @param {Array<Review>} reviews Reviews array
     * @param {Object} options Filter and sort options
     * @returns {Array<Review>} Processed reviews
     */
    _applyFiltersAndSorting(reviews, options) {
        const {
            sortBy = 'createdAt',
            sortOrder = 'desc',
            minRating = null,
            maxRating = null,
            searchTerm = null
        } = options;

        let processedReviews = [...reviews];

        // Apply rating filter
        if (minRating !== null || maxRating !== null) {
            processedReviews = this.filterByRating(processedReviews, minRating, maxRating);
        }

        // Apply search filter
        if (searchTerm) {
            processedReviews = this.searchReviews(processedReviews, searchTerm);
        }

        // Apply sorting
        processedReviews = this.sortReviews(processedReviews, sortBy, sortOrder);

        return processedReviews;
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewService;
}


