/**
 * LoyaltyNotificationComponent
 * Handles displaying loyalty-related notifications such as points earned,
 * level upgrades, and reward redemptions
 */
class LoyaltyNotificationComponent {
    constructor(container) {
        this.container = container;
        this.notifications = [];
        this.autoHideTimeout = 5000; // 5 seconds
        
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="loyalty-notifications" id="loyaltyNotifications">
                <!-- Notifications will be dynamically added here -->
            </div>
        `;
    }

    /**
     * Show points earned notification
     * @param {number} points - Points earned
     * @param {string} source - Source of points (e.g., "booking", "review")
     * @param {Object} details - Additional details
     */
    showPointsEarned(points, source, details = {}) {
        const notification = {
            id: this.generateId(),
            type: 'points-earned',
            title: 'Points Earned!',
            message: `You earned ${points.toLocaleString()} loyalty points`,
            details: {
                points,
                source,
                ...details
            },
            timestamp: new Date(),
            autoHide: true
        };

        this.addNotification(notification);
    }

    /**
     * Show level upgrade notification
     * @param {string} newLevel - New membership level
     * @param {string} oldLevel - Previous membership level
     */
    showLevelUpgrade(newLevel, oldLevel) {
        const notification = {
            id: this.generateId(),
            type: 'level-upgrade',
            title: 'Congratulations!',
            message: `You've been upgraded to ${newLevel} membership!`,
            details: {
                newLevel,
                oldLevel
            },
            timestamp: new Date(),
            autoHide: false // Keep level upgrades visible longer
        };

        this.addNotification(notification);
    }

    /**
     * Show reward redemption notification
     * @param {string} rewardName - Name of redeemed reward
     * @param {string} redemptionCode - Redemption code
     * @param {number} pointsUsed - Points used for redemption
     */
    showRewardRedeemed(rewardName, redemptionCode, pointsUsed) {
        const notification = {
            id: this.generateId(),
            type: 'reward-redeemed',
            title: 'Reward Redeemed!',
            message: `${rewardName} has been redeemed successfully`,
            details: {
                rewardName,
                redemptionCode,
                pointsUsed
            },
            timestamp: new Date(),
            autoHide: false
        };

        this.addNotification(notification);
    }

    /**
     * Show points milestone notification
     * @param {number} milestone - Milestone reached
     * @param {number} totalPoints - Total points earned
     */
    showPointsMilestone(milestone, totalPoints) {
        const notification = {
            id: this.generateId(),
            type: 'points-milestone',
            title: 'Milestone Reached!',
            message: `You've earned ${milestone.toLocaleString()} total loyalty points!`,
            details: {
                milestone,
                totalPoints
            },
            timestamp: new Date(),
            autoHide: true
        };

        this.addNotification(notification);
    }

    /**
     * Show birthday bonus notification
     * @param {number} bonusPoints - Bonus points awarded
     */
    showBirthdayBonus(bonusPoints) {
        const notification = {
            id: this.generateId(),
            type: 'birthday-bonus',
            title: 'Happy Birthday!',
            message: `Enjoy ${bonusPoints.toLocaleString()} bonus loyalty points!`,
            details: {
                bonusPoints
            },
            timestamp: new Date(),
            autoHide: false
        };

        this.addNotification(notification);
    }

    /**
     * Add a notification to the display
     * @param {Object} notification - Notification object
     */
    addNotification(notification) {
        this.notifications.push(notification);
        this.renderNotification(notification);

        if (notification.autoHide) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, this.autoHideTimeout);
        }
    }

    /**
     * Render a single notification
     * @param {Object} notification - Notification to render
     */
    renderNotification(notification) {
        const notificationsContainer = this.container.querySelector('#loyaltyNotifications');
        if (!notificationsContainer) return;

        const notificationElement = document.createElement('div');
        notificationElement.className = `loyalty-notification ${notification.type}`;
        notificationElement.id = `notification-${notification.id}`;
        
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-text">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    ${this.renderNotificationDetails(notification)}
                </div>
                <button class="notification-close" data-notification-id="${notification.id}">
                    &times;
                </button>
            </div>
            <div class="notification-progress" ${notification.autoHide ? '' : 'style="display: none;"'}>
                <div class="progress-bar"></div>
            </div>
        `;

        // Add animation
        notificationElement.style.opacity = '0';
        notificationElement.style.transform = 'translateX(100%)';
        
        notificationsContainer.appendChild(notificationElement);

        // Trigger animation
        setTimeout(() => {
            notificationElement.style.opacity = '1';
            notificationElement.style.transform = 'translateX(0)';
        }, 10);

        // Bind close button
        const closeBtn = notificationElement.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification.id);
            });
        }

        // Animate progress bar for auto-hide notifications
        if (notification.autoHide) {
            const progressBar = notificationElement.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.animation = `progress ${this.autoHideTimeout}ms linear`;
            }
        }
    }

    /**
     * Render notification details based on type
     * @param {Object} notification - Notification object
     * @returns {string} HTML string for details
     */
    renderNotificationDetails(notification) {
        switch (notification.type) {
            case 'points-earned':
                return `
                    <div class="notification-details">
                        <small>From: ${this.formatSource(notification.details.source)}</small>
                    </div>
                `;
            
            case 'level-upgrade':
                return `
                    <div class="notification-details">
                        <small>Previous level: ${notification.details.oldLevel}</small>
                        <div class="level-benefits">
                            <small>New benefits unlocked!</small>
                        </div>
                    </div>
                `;
            
            case 'reward-redeemed':
                return `
                    <div class="notification-details">
                        <small>Code: <strong>${notification.details.redemptionCode}</strong></small>
                        <small>Points used: ${notification.details.pointsUsed.toLocaleString()}</small>
                    </div>
                `;
            
            case 'points-milestone':
                return `
                    <div class="notification-details">
                        <small>Total points earned: ${notification.details.totalPoints.toLocaleString()}</small>
                    </div>
                `;
            
            case 'birthday-bonus':
                return `
                    <div class="notification-details">
                        <small>🎉 Special birthday gift from our loyalty program!</small>
                    </div>
                `;
            
            default:
                return '';
        }
    }

    /**
     * Get icon for notification type
     * @param {string} type - Notification type
     * @returns {string} Icon HTML
     */
    getNotificationIcon(type) {
        const icons = {
            'points-earned': '⭐',
            'level-upgrade': '🏆',
            'reward-redeemed': '🎁',
            'points-milestone': '🎯',
            'birthday-bonus': '🎂'
        };
        
        return icons[type] || '📢';
    }

    /**
     * Format source for display
     * @param {string} source - Source identifier
     * @returns {string} Formatted source
     */
    formatSource(source) {
        const sources = {
            'booking': 'Hotel Booking',
            'review': 'Hotel Review',
            'referral': 'Friend Referral',
            'birthday': 'Birthday Bonus',
            'promotion': 'Special Promotion',
            'manual': 'Manual Award'
        };
        
        return sources[source] || source;
    }

    /**
     * Remove a notification
     * @param {string} notificationId - ID of notification to remove
     */
    removeNotification(notificationId) {
        const notificationElement = this.container.querySelector(`#notification-${notificationId}`);
        if (notificationElement) {
            // Animate out
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.parentNode.removeChild(notificationElement);
                }
            }, 300);
        }

        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification.id);
        });
    }

    /**
     * Generate unique ID for notifications
     * @returns {string} Unique ID
     */
    generateId() {
        return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all active notifications
     * @returns {Array} Array of notifications
     */
    getNotifications() {
        return [...this.notifications];
    }

    destroy() {
        this.clearAll();
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyNotificationComponent;
} else {
    window.LoyaltyNotificationComponent = LoyaltyNotificationComponent;
}


