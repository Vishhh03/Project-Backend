/**
 * LoyaltyIntegration
 * Utility class for integrating loyalty features across the application
 * Provides methods for displaying loyalty information and handling loyalty events
 */
class LoyaltyIntegration {
    constructor(loyaltyService, notificationService = null) {
        this.loyaltyService = loyaltyService;
        this.notificationService = notificationService;
        this.eventListeners = new Map();
    }

    /**
     * Initialize loyalty integration for a user session
     * @param {Object} authService - Authentication service
     */
    async initialize(authService) {
        if (!authService.isAuthenticated()) {
            return null;
        }

        try {
            const loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            this.setupEventListeners();
            return loyaltyAccount;
        } catch (error) {
            console.warn('Could not initialize loyalty integration:', error);
            return null;
        }
    }

    /**
     * Set up event listeners for loyalty-related events
     */
    setupEventListeners() {
        // Listen for booking completion events
        document.addEventListener('bookingCompleted', (event) => {
            this.handleBookingCompleted(event.detail);
        });

        // Listen for payment completion events
        document.addEventListener('paymentCompleted', (event) => {
            this.handlePaymentCompleted(event.detail);
        });

        // Listen for review submission events
        document.addEventListener('reviewSubmitted', (event) => {
            this.handleReviewSubmitted(event.detail);
        });
    }

    /**
     * Handle booking completion and award points
     * @param {Object} bookingDetails - Booking details
     */
    async handleBookingCompleted(bookingDetails) {
        try {
            if (bookingDetails.bookingId && bookingDetails.totalAmount) {
                const transaction = await this.loyaltyService.awardPointsForBooking(
                    bookingDetails.bookingId,
                    bookingDetails.totalAmount
                );

                // Show notification
                this.showPointsEarnedNotification(
                    transaction.points,
                    'booking',
                    { bookingId: bookingDetails.bookingId }
                );

                // Check for level upgrade
                await this.checkForLevelUpgrade();
            }
        } catch (error) {
            console.error('Error handling booking completion:', error);
        }
    }

    /**
     * Handle payment completion
     * @param {Object} paymentDetails - Payment details
     */
    async handlePaymentCompleted(paymentDetails) {
        // Payment completion might trigger additional loyalty benefits
        // This is a placeholder for future payment-specific loyalty features
        console.log('Payment completed, checking for loyalty benefits:', paymentDetails);
    }

    /**
     * Handle review submission and award points
     * @param {Object} reviewDetails - Review details
     */
    async handleReviewSubmitted(reviewDetails) {
        try {
            // Award points for review submission (if supported by backend)
            const reviewPoints = 50; // Example: 50 points per review
            
            // This would need to be implemented in the backend
            // const transaction = await this.loyaltyService.awardPointsForReview(reviewDetails.reviewId);
            
            // For now, show a notification about potential points
            if (this.notificationService) {
                this.notificationService.showInfo(
                    `Thank you for your review! You may earn loyalty points for sharing your experience.`
                );
            }
        } catch (error) {
            console.error('Error handling review submission:', error);
        }
    }

    /**
     * Check for level upgrade after points are awarded
     */
    async checkForLevelUpgrade() {
        try {
            const loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            const calculatedLevel = loyaltyAccount.calculateMembershipLevel();
            
            if (calculatedLevel !== loyaltyAccount.membershipLevel) {
                // Level upgrade detected!
                this.showLevelUpgradeNotification(calculatedLevel, loyaltyAccount.membershipLevel);
            }
        } catch (error) {
            console.error('Error checking for level upgrade:', error);
        }
    }

    /**
     * Show points earned notification
     * @param {number} points - Points earned
     * @param {string} source - Source of points
     * @param {Object} details - Additional details
     */
    showPointsEarnedNotification(points, source, details = {}) {
        if (this.notificationService) {
            this.notificationService.showSuccess(
                `🎉 You earned ${points.toLocaleString()} loyalty points from your ${source}!`
            );
        }

        // Dispatch custom event for other components to listen to
        document.dispatchEvent(new CustomEvent('loyaltyPointsEarned', {
            detail: { points, source, details }
        }));
    }

    /**
     * Show level upgrade notification
     * @param {string} newLevel - New membership level
     * @param {string} oldLevel - Previous membership level
     */
    showLevelUpgradeNotification(newLevel, oldLevel) {
        if (this.notificationService) {
            this.notificationService.showSuccess(
                `🏆 Congratulations! You've been upgraded to ${newLevel} membership!`
            );
        }

        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('loyaltyLevelUpgrade', {
            detail: { newLevel, oldLevel }
        }));
    }

    /**
     * Add loyalty widget to a container
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Widget options
     */
    async addLoyaltyWidget(container, options = {}) {
        try {
            const loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            
            const widget = document.createElement('div');
            widget.className = 'loyalty-widget-inline';
            widget.innerHTML = this.renderLoyaltyWidget(loyaltyAccount, options);
            
            container.appendChild(widget);
            return widget;
        } catch (error) {
            console.error('Error adding loyalty widget:', error);
            return null;
        }
    }

    /**
     * Render loyalty widget HTML
     * @param {LoyaltyAccount} loyaltyAccount - Loyalty account data
     * @param {Object} options - Rendering options
     */
    renderLoyaltyWidget(loyaltyAccount, options = {}) {
        const showPoints = options.showPoints !== false;
        const showLevel = options.showLevel !== false;
        const compact = options.compact || false;

        if (compact) {
            return `
                <div class="loyalty-widget compact">
                    ${showLevel ? `<span class="level-badge ${loyaltyAccount.membershipLevel.toLowerCase()}">${loyaltyAccount.membershipLevel}</span>` : ''}
                    ${showPoints ? `<span class="points-display">${this.formatPoints(loyaltyAccount.pointsBalance)} pts</span>` : ''}
                </div>
            `;
        }

        return `
            <div class="loyalty-widget">
                <div class="widget-header">
                    <h4>Loyalty Status</h4>
                    ${showLevel ? `<div class="level-badge ${loyaltyAccount.membershipLevel.toLowerCase()}">${loyaltyAccount.membershipLevel}</div>` : ''}
                </div>
                ${showPoints ? `
                <div class="widget-content">
                    <div class="points-balance">
                        <span class="points-value">${this.formatPoints(loyaltyAccount.pointsBalance)}</span>
                        <span class="points-label">Available Points</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Calculate and display points for a potential booking
     * @param {number} bookingAmount - Booking amount
     * @param {string} membershipLevel - Membership level
     * @returns {Object} Points calculation
     */
    calculateBookingPoints(bookingAmount, membershipLevel = 'Bronze') {
        const points = this.loyaltyService.calculatePointsForBooking(bookingAmount, membershipLevel);
        
        return {
            points,
            formattedPoints: this.formatPoints(points),
            multiplier: this.getPointsMultiplier(membershipLevel),
            message: `You'll earn ${this.formatPoints(points)} points from this booking!`
        };
    }

    /**
     * Get points multiplier for membership level
     * @param {string} membershipLevel - Membership level
     * @returns {number} Points multiplier
     */
    getPointsMultiplier(membershipLevel) {
        const multipliers = {
            'Bronze': 1,
            'Silver': 1.25,
            'Gold': 1.5,
            'Platinum': 2
        };
        return multipliers[membershipLevel] || 1;
    }

    /**
     * Add loyalty information to booking confirmation
     * @param {HTMLElement} container - Confirmation container
     * @param {Object} bookingData - Booking data
     */
    async addBookingLoyaltyInfo(container, bookingData) {
        try {
            const loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            const pointsCalculation = this.calculateBookingPoints(
                bookingData.totalAmount,
                loyaltyAccount.membershipLevel
            );

            const loyaltyInfo = document.createElement('div');
            loyaltyInfo.className = 'booking-loyalty-info';
            loyaltyInfo.innerHTML = `
                <div class="loyalty-confirmation">
                    <h4>🎉 Loyalty Rewards</h4>
                    <p class="points-earned">
                        <strong>+${pointsCalculation.formattedPoints} points</strong> will be added to your account
                    </p>
                    <p class="membership-info">
                        As a <strong>${loyaltyAccount.membershipLevel}</strong> member, you earn ${pointsCalculation.multiplier}x points on all bookings
                    </p>
                </div>
            `;

            container.appendChild(loyaltyInfo);
        } catch (error) {
            console.error('Error adding booking loyalty info:', error);
        }
    }

    /**
     * Format points for display
     * @param {number} points - Points to format
     * @returns {string} Formatted points
     */
    formatPoints(points) {
        return points.toLocaleString();
    }

    /**
     * Trigger loyalty points earned event
     * @param {number} points - Points earned
     * @param {string} source - Source of points
     * @param {Object} details - Additional details
     */
    triggerPointsEarned(points, source, details = {}) {
        document.dispatchEvent(new CustomEvent('loyaltyPointsEarned', {
            detail: { points, source, details }
        }));
    }

    /**
     * Trigger loyalty level upgrade event
     * @param {string} newLevel - New level
     * @param {string} oldLevel - Old level
     */
    triggerLevelUpgrade(newLevel, oldLevel) {
        document.dispatchEvent(new CustomEvent('loyaltyLevelUpgrade', {
            detail: { newLevel, oldLevel }
        }));
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('bookingCompleted', this.handleBookingCompleted);
        document.removeEventListener('paymentCompleted', this.handlePaymentCompleted);
        document.removeEventListener('reviewSubmitted', this.handleReviewSubmitted);
        
        this.eventListeners.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyIntegration;
} else {
    window.LoyaltyIntegration = LoyaltyIntegration;
}


