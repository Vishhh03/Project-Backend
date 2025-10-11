/**
 * Payment model - Represents payment data and provides utility methods
 */
class Payment {
    constructor(data = {}) {
        this.id = data.id || null;
        this.bookingId = data.bookingId || null;
        this.amount = data.amount || 0;
        this.currency = data.currency || 'USD';
        this.paymentMethod = data.paymentMethod || null;
        this.status = data.status || 'Pending';
        this.transactionId = data.transactionId || null;
        this.cardNumber = data.cardNumber || null;
        this.cardHolderName = data.cardHolderName || null;
        this.expiryMonth = data.expiryMonth || null;
        this.expiryYear = data.expiryYear || null;
        this.processedAt = data.processedAt ? new Date(data.processedAt) : null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.errorMessage = data.errorMessage || null;
        this.refundAmount = data.refundAmount || 0;
        this.refundedAt = data.refundedAt ? new Date(data.refundedAt) : null;
    }

    /**
     * Check if payment is completed
     * @returns {boolean} True if payment is completed
     */
    isCompleted() {
        return this.status === 'Completed';
    }

    /**
     * Check if payment is pending
     * @returns {boolean} True if payment is pending
     */
    isPending() {
        return this.status === 'Pending';
    }

    /**
     * Check if payment failed
     * @returns {boolean} True if payment failed
     */
    isFailed() {
        return this.status === 'Failed';
    }

    /**
     * Check if payment is refunded
     * @returns {boolean} True if payment is refunded
     */
    isRefunded() {
        return this.status === 'Refunded' || this.status === 'PartiallyRefunded';
    }

    /**
     * Check if payment is cancelled
     * @returns {boolean} True if payment is cancelled
     */
    isCancelled() {
        return this.status === 'Cancelled';
    }

    /**
     * Get formatted amount with currency
     * @returns {string} Formatted amount
     */
    getFormattedAmount() {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(this.amount);
    }

    /**
     * Get formatted refund amount with currency
     * @returns {string} Formatted refund amount
     */
    getFormattedRefundAmount() {
        if (this.refundAmount <= 0) return '';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(this.refundAmount);
    }

    /**
     * Get masked card number for display
     * @returns {string} Masked card number
     */
    getMaskedCardNumber() {
        if (!this.cardNumber) return '';
        
        const cleaned = this.cardNumber.replace(/\D/g, '');
        if (cleaned.length < 4) return this.cardNumber;

        const last4 = cleaned.substring(cleaned.length - 4);
        return `****-****-****-${last4}`;
    }

    /**
     * Get card type based on card number
     * @returns {string} Card type
     */
    getCardType() {
        if (!this.cardNumber) return '';
        
        const cleaned = this.cardNumber.replace(/\D/g, '');
        
        // Visa
        if (/^4/.test(cleaned)) {
            return 'Visa';
        }
        
        // Mastercard
        if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
            return 'Mastercard';
        }
        
        // American Express
        if (/^3[47]/.test(cleaned)) {
            return 'American Express';
        }
        
        // Discover
        if (/^6/.test(cleaned)) {
            return 'Discover';
        }
        
        return 'Unknown';
    }

    /**
     * Get payment status with appropriate CSS class
     * @returns {Object} Status info with text and CSS class
     */
    getStatusInfo() {
        const statusMap = {
            'Pending': { text: 'Pending', class: 'status-pending' },
            'Completed': { text: 'Completed', class: 'status-completed' },
            'Failed': { text: 'Failed', class: 'status-failed' },
            'Refunded': { text: 'Refunded', class: 'status-refunded' },
            'PartiallyRefunded': { text: 'Partially Refunded', class: 'status-partially-refunded' },
            'Cancelled': { text: 'Cancelled', class: 'status-cancelled' }
        };

        return statusMap[this.status] || { text: this.status, class: 'status-unknown' };
    }

    /**
     * Get payment method display text
     * @returns {string} Payment method text
     */
    getPaymentMethodText() {
        const methodMap = {
            'CreditCard': 'Credit Card',
            'DebitCard': 'Debit Card',
            'PayPal': 'PayPal',
            'BankTransfer': 'Bank Transfer'
        };

        return methodMap[this.paymentMethod] || this.paymentMethod;
    }

    /**
     * Get formatted processing date
     * @returns {string} Formatted date
     */
    getFormattedProcessedDate() {
        if (!this.processedAt) return '';
        
        return this.processedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get formatted creation date
     * @returns {string} Formatted date
     */
    getFormattedCreatedDate() {
        return this.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get formatted refund date
     * @returns {string} Formatted refund date
     */
    getFormattedRefundDate() {
        if (!this.refundedAt) return '';
        
        return this.refundedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Check if payment can be refunded
     * @returns {boolean} True if refundable
     */
    canBeRefunded() {
        return this.isCompleted() && this.refundAmount < this.amount;
    }

    /**
     * Get remaining refundable amount
     * @returns {number} Remaining refundable amount
     */
    getRemainingRefundableAmount() {
        if (!this.canBeRefunded()) return 0;
        return this.amount - this.refundAmount;
    }

    /**
     * Get formatted remaining refundable amount
     * @returns {string} Formatted remaining refundable amount
     */
    getFormattedRemainingRefundableAmount() {
        const amount = this.getRemainingRefundableAmount();
        if (amount <= 0) return '';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(amount);
    }

    /**
     * Convert to plain object for API requests
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            bookingId: this.bookingId,
            amount: this.amount,
            currency: this.currency,
            paymentMethod: this.paymentMethod,
            status: this.status,
            transactionId: this.transactionId,
            cardNumber: this.cardNumber,
            cardHolderName: this.cardHolderName,
            expiryMonth: this.expiryMonth,
            expiryYear: this.expiryYear,
            processedAt: this.processedAt?.toISOString(),
            createdAt: this.createdAt.toISOString(),
            errorMessage: this.errorMessage,
            refundAmount: this.refundAmount,
            refundedAt: this.refundedAt?.toISOString()
        };
    }

    /**
     * Create Payment instance from API response
     * @param {Object} data - API response data
     * @returns {Payment} Payment instance
     */
    static fromApiResponse(data) {
        return new Payment(data);
    }

    /**
     * Validate payment data
     * @param {Object} data - Payment data to validate
     * @returns {Array} Array of validation errors
     */
    static validate(data) {
        const errors = [];

        if (!data.bookingId || data.bookingId <= 0) {
            errors.push('Valid booking ID is required');
        }

        if (!data.amount || data.amount <= 0) {
            errors.push('Valid payment amount is required');
        }

        if (!data.paymentMethod) {
            errors.push('Payment method is required');
        }

        if (data.paymentMethod === 'CreditCard') {
            if (!data.cardNumber) {
                errors.push('Card number is required');
            }

            if (!data.cardHolderName || data.cardHolderName.trim().length < 2) {
                errors.push('Card holder name is required');
            }

            if (!data.expiryMonth || !/^(0[1-9]|1[0-2])$/.test(data.expiryMonth)) {
                errors.push('Valid expiry month is required (01-12)');
            }

            if (!data.expiryYear || !/^\d{2}$/.test(data.expiryYear)) {
                errors.push('Valid expiry year is required');
            }

            if (!data.cvv || !/^\d{3,4}$/.test(data.cvv)) {
                errors.push('Valid CVV is required');
            }
        }

        return errors;
    }
}

// Export for use in other modules
window.Payment = Payment;


