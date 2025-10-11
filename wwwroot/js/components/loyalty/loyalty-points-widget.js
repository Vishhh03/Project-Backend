/**
 * LoyaltyPointsWidget
 * A compact widget to display loyalty points and membership status
 * Can be embedded in other components like booking forms or user profile
 */
class LoyaltyPointsWidget {
    constructor(container, loyaltyService) {
        this.container = container;
        this.loyaltyService = loyaltyService;
        this.loyaltyAccount = null;
        
        this.init();
    }

    async init() {
        try {
            this.render();
            await this.loadLoyaltyAccount();
        } catch (error) {
            console.error('Error initializing loyalty points widget:', error);
            this.renderError();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="loyalty-points-widget">
                <div class="widget-loading" id="widgetLoading">
                    <div class="loading-spinner-small"></div>
                </div>
                <div class="widget-content" id="widgetContent" style="display: none;">
                    <div class="points-summary">
                        <div class="points-balance">
                            <span class="points-label">Points Balance:</span>
                            <span class="points-value" id="pointsValue">0</span>
                        </div>
                        <div class="membership-level">
                            <span class="level-badge" id="levelBadge">Bronze</span>
                        </div>
                    </div>
                    <div class="points-earning-info" id="pointsEarningInfo" style="display: none;">
                        <p class="earning-message">
                            You'll earn <strong id="earnablePoints">0</strong> points from this booking!
                        </p>
                    </div>
                </div>
                <div class="widget-error" id="widgetError" style="display: none;">
                    <p>Unable to load loyalty information</p>
                </div>
            </div>
        `;
    }

    async loadLoyaltyAccount() {
        try {
            const loading = this.container.querySelector('#widgetLoading');
            const content = this.container.querySelector('#widgetContent');
            
            loading.style.display = 'block';
            content.style.display = 'none';

            this.loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            this.updateDisplay();

            loading.style.display = 'none';
            content.style.display = 'block';
        } catch (error) {
            console.error('Error loading loyalty account:', error);
            this.renderError();
        }
    }

    updateDisplay() {
        if (!this.loyaltyAccount) return;

        const pointsValue = this.container.querySelector('#pointsValue');
        const levelBadge = this.container.querySelector('#levelBadge');

        if (pointsValue) {
            pointsValue.textContent = this.loyaltyService.formatPoints(this.loyaltyAccount.pointsBalance);
        }

        if (levelBadge) {
            levelBadge.textContent = this.loyaltyAccount.membershipLevel;
            levelBadge.className = `level-badge ${this.loyaltyAccount.membershipLevel.toLowerCase()}`;
        }
    }

    /**
     * Show points that will be earned from a booking
     * @param {number} bookingAmount - The booking amount
     */
    showPointsEarning(bookingAmount) {
        if (!this.loyaltyAccount) return;

        const pointsEarningInfo = this.container.querySelector('#pointsEarningInfo');
        const earnablePoints = this.container.querySelector('#earnablePoints');

        if (pointsEarningInfo && earnablePoints && bookingAmount > 0) {
            const points = this.loyaltyService.calculatePointsForBooking(
                bookingAmount, 
                this.loyaltyAccount.membershipLevel
            );
            
            earnablePoints.textContent = this.loyaltyService.formatPoints(points);
            pointsEarningInfo.style.display = 'block';
        }
    }

    /**
     * Hide points earning information
     */
    hidePointsEarning() {
        const pointsEarningInfo = this.container.querySelector('#pointsEarningInfo');
        if (pointsEarningInfo) {
            pointsEarningInfo.style.display = 'none';
        }
    }

    renderError() {
        const loading = this.container.querySelector('#widgetLoading');
        const content = this.container.querySelector('#widgetContent');
        const error = this.container.querySelector('#widgetError');

        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'none';
        if (error) error.style.display = 'block';
    }

    /**
     * Refresh the widget data
     */
    async refresh() {
        await this.loadLoyaltyAccount();
    }

    /**
     * Get current loyalty account
     */
    getLoyaltyAccount() {
        return this.loyaltyAccount;
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyPointsWidget;
} else {
    window.LoyaltyPointsWidget = LoyaltyPointsWidget;
}


