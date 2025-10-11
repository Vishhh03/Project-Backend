/**
 * HotelService - Service for hotel operations
 * Handles CRUD operations, search functionality, and client-side caching
 */
class HotelService {
    constructor(apiClient) {
        this.apiClient = apiClient || new ApiClient();
        this.cache = new Map();
        this.cacheExpiration = 10 * 60 * 1000; // 10 minutes in milliseconds
        this.searchCache = new Map();
    }

    /**
     * Check if cached data is still valid
     * @param {Object} cacheEntry - Cache entry with timestamp
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(cacheEntry) {
        if (!cacheEntry) return false;
        return Date.now() - cacheEntry.timestamp < this.cacheExpiration;
    }

    /**
     * Create cache entry with timestamp
     * @param {any} data - Data to cache
     * @returns {Object} Cache entry with data and timestamp
     */
    createCacheEntry(data) {
        return {
            data: data,
            timestamp: Date.now()
        };
    }

    /**
     * Get all hotels with caching
     * @returns {Promise<Array>} Array of hotel objects
     */
    async getAllHotels() {
        const cacheKey = 'all_hotels';
        const cachedEntry = this.cache.get(cacheKey);

        if (this.isCacheValid(cachedEntry)) {
            console.log('Hotels retrieved from cache');
            return cachedEntry.data;
        }

        try {
            const hotels = await this.apiClient.get('/hotels');
            this.cache.set(cacheKey, this.createCacheEntry(hotels));
            console.log('Hotels retrieved from API and cached');
            return hotels;
        } catch (error) {
            console.error('Failed to fetch hotels:', error);
            throw new Error('Failed to load hotels. Please try again.');
        }
    }

    /**
     * Get hotel by ID with caching
     * @param {number} id - Hotel ID
     * @returns {Promise<Object>} Hotel object
     */
    async getHotelById(id) {
        if (!id || id <= 0) {
            throw new Error('Valid hotel ID is required');
        }

        const cacheKey = `hotel_${id}`;
        const cachedEntry = this.cache.get(cacheKey);

        if (this.isCacheValid(cachedEntry)) {
            console.log(`Hotel ${id} retrieved from cache`);
            return cachedEntry.data;
        }

        try {
            const hotel = await this.apiClient.get(`/hotels/${id}`);
            this.cache.set(cacheKey, this.createCacheEntry(hotel));
            console.log(`Hotel ${id} retrieved from API and cached`);
            return hotel;
        } catch (error) {
            if (error.status === 404) {
                throw new Error('Hotel not found');
            }
            console.error(`Failed to fetch hotel ${id}:`, error);
            throw new Error('Failed to load hotel details. Please try again.');
        }
    }

    /**
     * Search hotels with filtering capabilities and caching
     * @param {Object} criteria - Search criteria
     * @param {string} criteria.city - City to search in
     * @param {number} criteria.maxPrice - Maximum price per night
     * @param {number} criteria.minRating - Minimum rating
     * @param {string} criteria.sortBy - Sort field (name, price, rating)
     * @param {string} criteria.sortOrder - Sort order (asc, desc)
     * @returns {Promise<Array>} Array of matching hotels
     */
    async searchHotels(criteria = {}) {
        // Create cache key based on search criteria
        const cacheKey = `search_${JSON.stringify(criteria)}`;
        const cachedEntry = this.searchCache.get(cacheKey);

        if (this.isCacheValid(cachedEntry)) {
            console.log('Search results retrieved from cache');
            return cachedEntry.data;
        }

        try {
            // Prepare query parameters for API
            const params = {};
            
            if (criteria.city && criteria.city.trim()) {
                params.city = criteria.city.trim();
            }
            
            if (criteria.maxPrice && criteria.maxPrice > 0) {
                params.maxPrice = criteria.maxPrice;
            }

            // Get hotels from API (server handles city and maxPrice filtering)
            let hotels = await this.apiClient.get('/hotels/search', params);

            // Apply client-side filtering for criteria not handled by server
            if (criteria.minRating && criteria.minRating > 0) {
                hotels = hotels.filter(hotel => hotel.rating >= criteria.minRating);
            }

            // Apply sorting
            if (criteria.sortBy) {
                hotels = this.sortHotels(hotels, criteria.sortBy, criteria.sortOrder);
            }

            // Cache the results
            this.searchCache.set(cacheKey, this.createCacheEntry(hotels));
            console.log(`Search completed, ${hotels.length} hotels found and cached`);
            
            return hotels;
        } catch (error) {
            console.error('Failed to search hotels:', error);
            throw new Error('Failed to search hotels. Please try again.');
        }
    }

    /**
     * Sort hotels by specified criteria
     * @param {Array} hotels - Array of hotels to sort
     * @param {string} sortBy - Field to sort by (name, price, rating, city)
     * @param {string} sortOrder - Sort order (asc, desc)
     * @returns {Array} Sorted array of hotels
     */
    sortHotels(hotels, sortBy, sortOrder = 'asc') {
        const sortedHotels = [...hotels];
        const isAscending = sortOrder.toLowerCase() === 'asc';

        sortedHotels.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy.toLowerCase()) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'price':
                    valueA = a.pricePerNight;
                    valueB = b.pricePerNight;
                    break;
                case 'rating':
                    valueA = a.rating;
                    valueB = b.rating;
                    break;
                case 'city':
                    valueA = a.city.toLowerCase();
                    valueB = b.city.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) {
                return isAscending ? -1 : 1;
            }
            if (valueA > valueB) {
                return isAscending ? 1 : -1;
            }
            return 0;
        });

        return sortedHotels;
    }

    /**
     * Create a new hotel (requires authentication)
     * @param {Object} hotelData - Hotel data
     * @returns {Promise<Object>} Created hotel object
     */
    async createHotel(hotelData) {
        if (!hotelData) {
            throw new Error('Hotel data is required');
        }

        // Validate required fields
        const requiredFields = ['name', 'address', 'city', 'pricePerNight', 'availableRooms'];
        for (const field of requiredFields) {
            if (!hotelData[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Validate numeric fields
        if (hotelData.pricePerNight <= 0) {
            throw new Error('Price per night must be greater than 0');
        }

        if (hotelData.availableRooms < 0) {
            throw new Error('Available rooms cannot be negative');
        }

        if (hotelData.rating && (hotelData.rating < 0 || hotelData.rating > 5)) {
            throw new Error('Rating must be between 0 and 5');
        }

        try {
            const newHotel = await this.apiClient.post('/hotels', hotelData);
            
            // Invalidate relevant caches
            this.invalidateCache();
            
            console.log('Hotel created successfully:', newHotel.id);
            return newHotel;
        } catch (error) {
            console.error('Failed to create hotel:', error);
            if (error.status === 401) {
                throw new Error('Authentication required to create hotels');
            } else if (error.status === 403) {
                throw new Error('Insufficient permissions to create hotels');
            }
            throw new Error('Failed to create hotel. Please try again.');
        }
    }

    /**
     * Update an existing hotel (requires authentication)
     * @param {number} id - Hotel ID
     * @param {Object} hotelData - Updated hotel data
     * @returns {Promise<void>}
     */
    async updateHotel(id, hotelData) {
        if (!id || id <= 0) {
            throw new Error('Valid hotel ID is required');
        }

        if (!hotelData) {
            throw new Error('Hotel data is required');
        }

        // Validate numeric fields if provided
        if (hotelData.pricePerNight !== undefined && hotelData.pricePerNight <= 0) {
            throw new Error('Price per night must be greater than 0');
        }

        if (hotelData.availableRooms !== undefined && hotelData.availableRooms < 0) {
            throw new Error('Available rooms cannot be negative');
        }

        if (hotelData.rating !== undefined && (hotelData.rating < 0 || hotelData.rating > 5)) {
            throw new Error('Rating must be between 0 and 5');
        }

        try {
            await this.apiClient.put(`/hotels/${id}`, hotelData);
            
            // Invalidate relevant caches
            this.invalidateCache();
            this.cache.delete(`hotel_${id}`);
            
            console.log(`Hotel ${id} updated successfully`);
        } catch (error) {
            console.error(`Failed to update hotel ${id}:`, error);
            if (error.status === 401) {
                throw new Error('Authentication required to update hotels');
            } else if (error.status === 403) {
                throw new Error('Insufficient permissions to update hotels');
            } else if (error.status === 404) {
                throw new Error('Hotel not found');
            }
            throw new Error('Failed to update hotel. Please try again.');
        }
    }

    /**
     * Delete a hotel (requires authentication)
     * @param {number} id - Hotel ID
     * @returns {Promise<void>}
     */
    async deleteHotel(id) {
        if (!id || id <= 0) {
            throw new Error('Valid hotel ID is required');
        }

        try {
            await this.apiClient.delete(`/hotels/${id}`);
            
            // Invalidate relevant caches
            this.invalidateCache();
            this.cache.delete(`hotel_${id}`);
            
            console.log(`Hotel ${id} deleted successfully`);
        } catch (error) {
            console.error(`Failed to delete hotel ${id}:`, error);
            if (error.status === 401) {
                throw new Error('Authentication required to delete hotels');
            } else if (error.status === 403) {
                throw new Error('Insufficient permissions to delete hotels');
            } else if (error.status === 404) {
                throw new Error('Hotel not found');
            } else if (error.status === 400) {
                throw new Error('Cannot delete hotel with active bookings');
            }
            throw new Error('Failed to delete hotel. Please try again.');
        }
    }

    /**
     * Get unique cities from all hotels
     * @returns {Promise<Array>} Array of unique city names
     */
    async getCities() {
        try {
            const hotels = await this.getAllHotels();
            const cities = [...new Set(hotels.map(hotel => hotel.city))].sort();
            return cities;
        } catch (error) {
            console.error('Failed to get cities:', error);
            throw new Error('Failed to load cities. Please try again.');
        }
    }

    /**
     * Get price range from all hotels
     * @returns {Promise<Object>} Object with min and max prices
     */
    async getPriceRange() {
        try {
            const hotels = await this.getAllHotels();
            if (hotels.length === 0) {
                return { min: 0, max: 0 };
            }

            const prices = hotels.map(hotel => hotel.pricePerNight);
            return {
                min: Math.min(...prices),
                max: Math.max(...prices)
            };
        } catch (error) {
            console.error('Failed to get price range:', error);
            throw new Error('Failed to load price range. Please try again.');
        }
    }

    /**
     * Invalidate all hotel-related caches
     */
    invalidateCache() {
        this.cache.clear();
        this.searchCache.clear();
        console.log('Hotel caches invalidated');
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        
        // Clear main cache
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= this.cacheExpiration) {
                this.cache.delete(key);
            }
        }

        // Clear search cache
        for (const [key, entry] of this.searchCache.entries()) {
            if (now - entry.timestamp >= this.cacheExpiration) {
                this.searchCache.delete(key);
            }
        }
    }

    /**
     * Get hotels managed by a specific manager
     * @param {number} managerId - Manager's user ID
     * @returns {Promise<Array>} Array of hotels managed by the manager
     */
    async getHotelsByManager(managerId) {
        try {
            if (!managerId || managerId <= 0) {
                throw new Error('Valid manager ID is required');
            }

            const hotels = await this.apiClient.get(`/hotels/manager/${managerId}`);
            return hotels || [];
        } catch (error) {
            console.error('Error getting hotels by manager:', error);
            
            // Fallback: get all hotels and filter by managerId
            try {
                const allHotels = await this.getAllHotels();
                return allHotels.filter(hotel => hotel.managerId === managerId);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw error;
            }
        }
    }

    /**
     * Get cache statistics for debugging
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            mainCacheSize: this.cache.size,
            searchCacheSize: this.searchCache.size,
            cacheExpiration: this.cacheExpiration
        };
    }
}

// Export for use in other modules
window.HotelService = HotelService;


