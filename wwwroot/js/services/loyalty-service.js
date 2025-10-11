/**
 * LoyaltyService
 * Handles all loyalty program operations including points management,
 * transaction history, and reward redemption
 */
class LoyaltyService {
    constructor(apiClient, storageService) {
        this.apiClient = apiClient;
        this.storageService = storageService;
        this.baseUrl = '/api/loyalty';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get user's loyalty account
     * @param {number} userId - User ID
     * @returns {Promise<LoyaltyAccount>}
     */
    async getLoyaltyAccount(userId) {
        try {
            const cacheKey = `loyalty_account_${userId}`;
            const cached = this.getCachedData(cacheKey);
            if (cached) return new LoyaltyAccount(cached);

            const response = await this.apiClient.get(`${this.baseUrl}/account/${userId}`);
            
            if (response.success && response.data) {
                this.setCachedData(cacheKey, response.data);
                return new LoyaltyAccount(response.data);
            }
            
            throw new Error(response.message || 'Failed to fetch loyalty account');
        } catch (error) {
            console.error('Error fetching loyalty account:', error);
            throw error;
        }
    }

    /**
     * Get current user's loyalty account
     * @returns {Promise<LoyaltyAccount>}
     */
    async getCurrentUserLoyaltyAccount() {
        try {
            const response = await this.apiClient.get(`${this.baseUrl}/account`);
            
            if (response.success && response.data) {
                const cacheKey = `loyalty_account_current`;
                this.setCachedData(cacheKey, response.data);
                return new LoyaltyAccount(response.data);
            }
            
            throw new Error(response.message || 'Failed to fetch loyalty account');
        } catch (error) {
            console.error('Error fetching current user loyalty account:', error);
            throw error;
        }
    }

    /**
     * Get loyalty transaction history
     * @param {number} userId - User ID
     * @param {Object} options - Query options (page, limit, type)
     * @returns {Promise<Object>}
     */
    async getTransactionHistory(userId, options = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (options.page) queryParams.append('page', options.page);
            if (options.limit) queryParams.append('limit', options.limit);
            if (options.type) queryParams.append('type', options.type);
            if (options.startDate) queryParams.append('startDate', options.startDate);
            if (options.endDate) queryParams.append('endDate', options.endDate);

            const url = `${this.baseUrl}/transactions/${userId}?${queryParams.toString()}`;
            const response = await this.apiClient.get(url);
            
            if (response.success && response.data) {
                const transactions = response.data.transactions?.map(t => new LoyaltyTransaction(t)) || [];
                return {
                    transactions,
                    totalCount: response.data.totalCount || 0,
                    currentPage: response.data.currentPage || 1,
                    totalPages: response.data.totalPages || 1
                };
            }
            
            throw new Error(response.message || 'Failed to fetch transaction history');
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            throw error;
        }
    }

    /**
     * Get current user's transaction history
     * @param {Object} options - Query options
     * @returns {Promise<Object>}
     */
    async getCurrentUserTransactionHistory(options = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (options.page) queryParams.append('page', options.page);
            if (options.limit) queryParams.append('limit', options.limit);
            if (options.type) queryParams.append('type', options.type);
            if (options.startDate) queryParams.append('startDate', options.startDate);
            if (options.endDate) queryParams.append('endDate', options.endDate);

            const url = `${this.baseUrl}/transactions?${queryParams.toString()}`;
            const response = await this.apiClient.get(url);
            
            if (response.success && response.data) {
                const transactions = response.data.transactions?.map(t => new LoyaltyTransaction(t)) || [];
                return {
                    transactions,
                    totalCount: response.data.totalCount || 0,
                    currentPage: response.data.currentPage || 1,
                    totalPages: response.data.totalPages || 1
                };
            }
            
            throw new Error(response.message || 'Failed to fetch transaction history');
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            throw error;
        }
    }

    /**
     * Calculate points for a booking
     * @param {number} bookingAmount - Booking total amount
     * @param {string} membershipLevel - User's membership level
     * @returns {number}
     */
    calculatePointsForBooking(bookingAmount, membershipLevel = 'Bronze') {
        const basePointsRate = 1; // 1 point per dollar
        const multipliers = {
            'Bronze': 1,
            'Silver': 1.25,
            'Gold': 1.5,
            'Platinum': 2
        };
        
        const multiplier = multipliers[membershipLevel] || 1;
        return Math.floor(bookingAmount * basePointsRate * multiplier);
    }

    /**
     * Award points for a booking
     * @param {number} bookingId - Booking ID
     * @param {number} amount - Booking amount
     * @returns {Promise<LoyaltyTransaction>}
     */
    async awardPointsForBooking(bookingId, amount) {
        try {
            const requestData = {
                bookingId,
                amount,
                description: `Points earned from booking #${bookingId}`
            };

            const response = await this.apiClient.post(`${this.baseUrl}/award-points`, requestData);
            
            if (response.success && response.data) {
                // Clear cache to force refresh
                this.clearUserCache();
                return new LoyaltyTransaction(response.data);
            }
            
            throw new Error(response.message || 'Failed to award points');
        } catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }

    /**
     * Get available rewards
     * @param {Object} options - Filter options
     * @returns {Promise<Reward[]>}
     */
    async getAvailableRewards(options = {}) {
        try {
            const cacheKey = 'available_rewards';
            const cached = this.getCachedData(cacheKey);
            if (cached && !options.forceRefresh) {
                return cached.map(r => new Reward(r));
            }

            const queryParams = new URLSearchParams();
            if (options.category) queryParams.append('category', options.category);
            if (options.maxPoints) queryParams.append('maxPoints', options.maxPoints);

            const url = `${this.baseUrl}/rewards?${queryParams.toString()}`;
            const response = await this.apiClient.get(url);
            
            if (response.success && response.data) {
                const rewards = response.data.map(r => new Reward(r));
                this.setCachedData(cacheKey, response.data);
                return rewards;
            }
            
            throw new Error(response.message || 'Failed to fetch rewards');
        } catch (error) {
            console.error('Error fetching rewards:', error);
            throw error;
        }
    }

    /**
     * Redeem a reward
     * @param {number} rewardId - Reward ID
     * @param {Object} options - Redemption options
     * @returns {Promise<Object>}
     */
    async redeemReward(rewardId, options = {}) {
        try {
            const requestData = {
                rewardId,
                ...options
            };

            const response = await this.apiClient.post(`${this.baseUrl}/redeem`, requestData);
            
            if (response.success && response.data) {
                // Clear cache to force refresh
                this.clearUserCache();
                return {
                    transaction: new LoyaltyTransaction(response.data.transaction),
                    redemptionCode: response.data.redemptionCode,
                    expiresAt: response.data.expiresAt
                };
            }
            
            throw new Error(response.message || 'Failed to redeem reward');
        } catch (error) {
            console.error('Error redeeming reward:', error);
            throw error;
        }
    }

    /**
     * Get user's redemption history
     * @param {Object} options - Query options
     * @returns {Promise<Object>}
     */
    async getRedemptionHistory(options = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (options.page) queryParams.append('page', options.page);
            if (options.limit) queryParams.append('limit', options.limit);

            const url = `${this.baseUrl}/redemptions?${queryParams.toString()}`;
            const response = await this.apiClient.get(url);
            
            if (response.success && response.data) {
                return {
                    redemptions: response.data.redemptions || [],
                    totalCount: response.data.totalCount || 0,
                    currentPage: response.data.currentPage || 1,
                    totalPages: response.data.totalPages || 1
                };
            }
            
            throw new Error(response.message || 'Failed to fetch redemption history');
        } catch (error) {
            console.error('Error fetching redemption history:', error);
            throw error;
        }
    }

    /**
     * Get loyalty program statistics
     * @returns {Promise<Object>}
     */
    async getLoyaltyStats() {
        try {
            const response = await this.apiClient.get(`${this.baseUrl}/stats`);
            
            if (response.success && response.data) {
                return response.data;
            }
            
            throw new Error(response.message || 'Failed to fetch loyalty stats');
        } catch (error) {
            console.error('Error fetching loyalty stats:', error);
            throw error;
        }
    }

    /**
     * Check if user can redeem specific reward
     * @param {number} rewardId - Reward ID
     * @returns {Promise<Object>}
     */
    async canRedeemReward(rewardId) {
        try {
            const response = await this.apiClient.get(`${this.baseUrl}/can-redeem/${rewardId}`);
            
            if (response.success) {
                return {
                    canRedeem: response.data.canRedeem,
                    reason: response.data.reason,
                    requiredPoints: response.data.requiredPoints,
                    currentPoints: response.data.currentPoints
                };
            }
            
            throw new Error(response.message || 'Failed to check redemption eligibility');
        } catch (error) {
            console.error('Error checking redemption eligibility:', error);
            throw error;
        }
    }

    /**
     * Get membership level benefits
     * @param {string} level - Membership level
     * @returns {Array<string>}
     */
    getMembershipBenefits(level) {
        const benefits = {
            'Bronze': [
                '5% discount on bookings',
                'Basic customer support',
                'Birthday bonus points'
            ],
            'Silver': [
                '10% discount on bookings',
                'Priority customer support',
                'Free room upgrades (subject to availability)',
                'Birthday bonus points',
                'Early check-in'
            ],
            'Gold': [
                '15% discount on bookings',
                'Premium customer support',
                'Free room upgrades',
                'Late checkout',
                'Birthday bonus points',
                'Welcome amenities'
            ],
            'Platinum': [
                '20% discount on bookings',
                'VIP customer support',
                'Free room upgrades',
                'Late checkout',
                'Birthday bonus points',
                'Welcome amenities',
                'Complimentary breakfast',
                'Airport transfer discounts'
            ]
        };
        
        return benefits[level] || benefits['Bronze'];
    }

    /**
     * Get points required for next membership level
     * @param {number} currentPoints - Current total points earned
     * @param {string} currentLevel - Current membership level
     * @returns {Object}
     */
    getNextLevelInfo(currentPoints, currentLevel) {
        const levels = [
            { name: 'Bronze', threshold: 0 },
            { name: 'Silver', threshold: 1000 },
            { name: 'Gold', threshold: 5000 },
            { name: 'Platinum', threshold: 10000 }
        ];

        const currentIndex = levels.findIndex(l => l.name === currentLevel);
        const nextLevel = levels[currentIndex + 1];

        if (!nextLevel) {
            return {
                isMaxLevel: true,
                currentLevel,
                message: 'You have reached the highest membership level!'
            };
        }

        return {
            isMaxLevel: false,
            currentLevel,
            nextLevel: nextLevel.name,
            pointsNeeded: nextLevel.threshold - currentPoints,
            progress: (currentPoints / nextLevel.threshold) * 100
        };
    }

    /**
     * Cache management methods
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearUserCache() {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes('loyalty_account') || key.includes('transactions')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    clearAllCache() {
        this.cache.clear();
    }

    /**
     * Format points for display
     * @param {number} points - Points to format
     * @returns {string}
     */
    formatPoints(points) {
        return points.toLocaleString();
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string}
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyService;
} else {
    window.LoyaltyService = LoyaltyService;
}


