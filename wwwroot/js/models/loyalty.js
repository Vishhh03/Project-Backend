/**
 * Loyalty Account Model
 * Represents a user's loyalty account with points and transaction history
 */
class LoyaltyAccount {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userId = data.userId || null;
        this.pointsBalance = data.pointsBalance || 0;
        this.totalPointsEarned = data.totalPointsEarned || 0;
        this.totalPointsRedeemed = data.totalPointsRedeemed || 0;
        this.membershipLevel = data.membershipLevel || 'Bronze';
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Calculate membership level based on total points earned
     */
    calculateMembershipLevel() {
        if (this.totalPointsEarned >= 10000) {
            return 'Platinum';
        } else if (this.totalPointsEarned >= 5000) {
            return 'Gold';
        } else if (this.totalPointsEarned >= 1000) {
            return 'Silver';
        }
        return 'Bronze';
    }

    /**
     * Get membership benefits based on level
     */
    getMembershipBenefits() {
        const benefits = {
            'Bronze': ['5% discount on bookings', 'Basic customer support'],
            'Silver': ['10% discount on bookings', 'Priority customer support', 'Free room upgrades (subject to availability)'],
            'Gold': ['15% discount on bookings', 'Premium customer support', 'Free room upgrades', 'Late checkout'],
            'Platinum': ['20% discount on bookings', 'VIP customer support', 'Free room upgrades', 'Late checkout', 'Complimentary breakfast']
        };
        return benefits[this.membershipLevel] || benefits['Bronze'];
    }

    /**
     * Check if user can redeem specified points
     */
    canRedeem(points) {
        return this.pointsBalance >= points && points > 0;
    }

    /**
     * Validate loyalty account data
     */
    validate() {
        const errors = [];

        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (this.pointsBalance < 0) {
            errors.push('Points balance cannot be negative');
        }

        if (this.totalPointsEarned < 0) {
            errors.push('Total points earned cannot be negative');
        }

        if (this.totalPointsRedeemed < 0) {
            errors.push('Total points redeemed cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * Loyalty Transaction Model
 * Represents a single loyalty points transaction
 */
class LoyaltyTransaction {
    constructor(data = {}) {
        this.id = data.id || null;
        this.loyaltyAccountId = data.loyaltyAccountId || null;
        this.userId = data.userId || null;
        this.transactionType = data.transactionType || 'earned'; // 'earned' or 'redeemed'
        this.points = data.points || 0;
        this.description = data.description || '';
        this.referenceId = data.referenceId || null; // booking ID, payment ID, etc.
        this.referenceType = data.referenceType || null; // 'booking', 'payment', 'manual'
        this.createdAt = data.createdAt || null;
    }

    /**
     * Validate transaction data
     */
    validate() {
        const errors = [];

        if (!this.loyaltyAccountId) {
            errors.push('Loyalty account ID is required');
        }

        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (!['earned', 'redeemed'].includes(this.transactionType)) {
            errors.push('Transaction type must be either "earned" or "redeemed"');
        }

        if (!this.points || this.points <= 0) {
            errors.push('Points must be a positive number');
        }

        if (!this.description || this.description.trim().length === 0) {
            errors.push('Description is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format points for display
     */
    getFormattedPoints() {
        const sign = this.transactionType === 'earned' ? '+' : '-';
        return `${sign}${this.points.toLocaleString()}`;
    }

    /**
     * Get transaction icon based on type
     */
    getTransactionIcon() {
        return this.transactionType === 'earned' ? '⬆️' : '⬇️';
    }
}

/**
 * Reward Model
 * Represents available rewards for redemption
 */
class Reward {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.pointsCost = data.pointsCost || 0;
        this.category = data.category || 'discount'; // 'discount', 'upgrade', 'service'
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.validUntil = data.validUntil || null;
        this.termsAndConditions = data.termsAndConditions || '';
        this.createdAt = data.createdAt || null;
    }

    /**
     * Check if reward is currently available
     */
    isAvailable() {
        if (!this.isActive) return false;
        if (this.validUntil && new Date(this.validUntil) < new Date()) return false;
        return true;
    }

    /**
     * Validate reward data
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Reward name is required');
        }

        if (!this.description || this.description.trim().length === 0) {
            errors.push('Reward description is required');
        }

        if (!this.pointsCost || this.pointsCost <= 0) {
            errors.push('Points cost must be a positive number');
        }

        if (!['discount', 'upgrade', 'service'].includes(this.category)) {
            errors.push('Category must be one of: discount, upgrade, service');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export models for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoyaltyAccount, LoyaltyTransaction, Reward };
} else {
    window.LoyaltyAccount = LoyaltyAccount;
    window.LoyaltyTransaction = LoyaltyTransaction;
    window.Reward = Reward;
}


