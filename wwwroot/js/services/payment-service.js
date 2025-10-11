/**
 * PaymentService - Handles payment processing operations
 * Provides methods for payment processing, validation, and payment history
 */
class PaymentService {
    constructor(apiClient) {
        this.apiClient = apiClient || new ApiClient();
        this.paymentCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Process a payment for a booking
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(paymentData) {
        try {
            // Validate payment data before sending
            this.validatePaymentData(paymentData);

            // Process payment through API
            const result = await this.apiClient.post('/payments', paymentData);

            // Cache successful payment
            if (result.status === 'Completed') {
                this.cachePayment(result);
            }

            return result;
        } catch (error) {
            console.error('Payment processing failed:', error);
            throw this.handlePaymentError(error);
        }
    }

    /**
     * Get payment details by ID
     * @param {number} paymentId - Payment ID
     * @returns {Promise<Object>} Payment details
     */
    async getPayment(paymentId) {
        try {
            // Check cache first
            const cachedPayment = this.getCachedPayment(paymentId);
            if (cachedPayment) {
                return cachedPayment;
            }

            // Fetch from API
            const payment = await this.apiClient.get(`/payments/${paymentId}`);
            
            // Cache the result
            this.cachePayment(payment);
            
            return payment;
        } catch (error) {
            console.error('Failed to get payment:', error);
            throw this.handlePaymentError(error);
        }
    }

    /**
     * Get payment history for current user
     * @param {Object} filters - Optional filters (dateFrom, dateTo, status)
     * @returns {Promise<Array>} Payment history
     */
    async getPaymentHistory(filters = {}) {
        try {
            const params = {};
            
            if (filters.dateFrom) {
                params.dateFrom = filters.dateFrom;
            }
            if (filters.dateTo) {
                params.dateTo = filters.dateTo;
            }
            if (filters.status) {
                params.status = filters.status;
            }

            const payments = await this.apiClient.get('/payments', params);
            
            // Cache individual payments
            payments.forEach(payment => this.cachePayment(payment));
            
            return payments;
        } catch (error) {
            console.error('Failed to get payment history:', error);
            throw this.handlePaymentError(error);
        }
    }

    /**
     * Process a refund for a payment
     * @param {number} paymentId - Payment ID
     * @param {number} amount - Refund amount
     * @returns {Promise<Object>} Refund result
     */
    async processRefund(paymentId, amount) {
        try {
            if (!paymentId || paymentId <= 0) {
                throw new Error('Valid payment ID is required');
            }
            
            if (!amount || amount <= 0) {
                throw new Error('Valid refund amount is required');
            }

            const refundData = { amount };
            const result = await this.apiClient.post(`/payments/${paymentId}/refund`, refundData);

            // Clear cached payment as status has changed
            this.clearCachedPayment(paymentId);

            return result;
        } catch (error) {
            console.error('Refund processing failed:', error);
            throw this.handlePaymentError(error);
        }
    }

    /**
     * Validate payment data before processing
     * @param {Object} paymentData - Payment data to validate
     * @throws {Error} Validation error
     */
    validatePaymentData(paymentData) {
        const errors = [];

        // Required fields
        if (!paymentData.bookingId || paymentData.bookingId <= 0) {
            errors.push('Valid booking ID is required');
        }

        if (!paymentData.amount || paymentData.amount <= 0) {
            errors.push('Valid payment amount is required');
        }

        if (!paymentData.paymentMethod) {
            errors.push('Payment method is required');
        }

        // Card payment validation
        if (paymentData.paymentMethod === 'CreditCard') {
            if (!paymentData.cardNumber) {
                errors.push('Card number is required');
            } else if (!this.validateCardNumber(paymentData.cardNumber)) {
                errors.push('Invalid card number');
            }

            if (!paymentData.cardHolderName || paymentData.cardHolderName.trim().length < 2) {
                errors.push('Card holder name is required');
            }

            if (!paymentData.expiryMonth || !this.validateExpiryMonth(paymentData.expiryMonth)) {
                errors.push('Valid expiry month is required (01-12)');
            }

            if (!paymentData.expiryYear || !this.validateExpiryYear(paymentData.expiryYear)) {
                errors.push('Valid expiry year is required');
            }

            if (!paymentData.cvv || !this.validateCVV(paymentData.cvv)) {
                errors.push('Valid CVV is required');
            }

            // Check if card is expired
            if (paymentData.expiryMonth && paymentData.expiryYear) {
                if (this.isCardExpired(paymentData.expiryMonth, paymentData.expiryYear)) {
                    errors.push('Card has expired');
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
    }

    /**
     * Validate credit card number using Luhn algorithm
     * @param {string} cardNumber - Card number to validate
     * @returns {boolean} True if valid
     */
    validateCardNumber(cardNumber) {
        if (!cardNumber) return false;
        
        // Remove spaces and non-digits
        const cleaned = cardNumber.replace(/\D/g, '');
        
        // Check length (13-19 digits for most cards)
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }

        // Luhn algorithm
        let sum = 0;
        let isEven = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    /**
     * Validate expiry month
     * @param {string} month - Month (01-12)
     * @returns {boolean} True if valid
     */
    validateExpiryMonth(month) {
        const monthNum = parseInt(month);
        return monthNum >= 1 && monthNum <= 12;
    }

    /**
     * Validate expiry year
     * @param {string} year - Year (2-digit)
     * @returns {boolean} True if valid
     */
    validateExpiryYear(year) {
        if (!year || year.length !== 2) return false;
        const yearNum = parseInt(year);
        return yearNum >= 0 && yearNum <= 99;
    }

    /**
     * Validate CVV
     * @param {string} cvv - CVV code
     * @returns {boolean} True if valid
     */
    validateCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }

    /**
     * Check if card is expired
     * @param {string} month - Expiry month
     * @param {string} year - Expiry year (2-digit)
     * @returns {boolean} True if expired
     */
    isCardExpired(month, year) {
        const now = new Date();
        const currentYear = now.getFullYear() % 100; // Get 2-digit year
        const currentMonth = now.getMonth() + 1; // 1-based month

        const expiryYear = parseInt(year);
        const expiryMonth = parseInt(month);

        if (expiryYear < currentYear) {
            return true;
        }

        if (expiryYear === currentYear && expiryMonth < currentMonth) {
            return true;
        }

        return false;
    }

    /**
     * Format card number for display (mask middle digits)
     * @param {string} cardNumber - Card number
     * @returns {string} Formatted card number
     */
    formatCardNumber(cardNumber) {
        if (!cardNumber) return '';
        
        const cleaned = cardNumber.replace(/\D/g, '');
        if (cleaned.length < 4) return cardNumber;

        const first4 = cleaned.substring(0, 4);
        const last4 = cleaned.substring(cleaned.length - 4);
        const middle = '*'.repeat(cleaned.length - 8);

        return `${first4}${middle}${last4}`;
    }

    /**
     * Get payment status display text
     * @param {string} status - Payment status
     * @returns {string} Display text
     */
    getPaymentStatusText(status) {
        const statusMap = {
            'Pending': 'Pending',
            'Completed': 'Completed',
            'Failed': 'Failed',
            'Refunded': 'Refunded',
            'PartiallyRefunded': 'Partially Refunded',
            'Cancelled': 'Cancelled'
        };

        return statusMap[status] || status;
    }

    /**
     * Get payment method display text
     * @param {string} method - Payment method
     * @returns {string} Display text
     */
    getPaymentMethodText(method) {
        const methodMap = {
            'CreditCard': 'Credit Card',
            'DebitCard': 'Debit Card',
            'PayPal': 'PayPal',
            'BankTransfer': 'Bank Transfer'
        };

        return methodMap[method] || method;
    }

    /**
     * Cache payment data
     * @param {Object} payment - Payment data
     */
    cachePayment(payment) {
        if (payment && payment.id) {
            this.paymentCache.set(payment.id, {
                data: payment,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get cached payment data
     * @param {number} paymentId - Payment ID
     * @returns {Object|null} Cached payment or null
     */
    getCachedPayment(paymentId) {
        const cached = this.paymentCache.get(paymentId);
        if (!cached) return null;

        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.paymentCache.delete(paymentId);
            return null;
        }

        return cached.data;
    }

    /**
     * Clear cached payment
     * @param {number} paymentId - Payment ID
     */
    clearCachedPayment(paymentId) {
        this.paymentCache.delete(paymentId);
    }

    /**
     * Clear all cached payments
     */
    clearCache() {
        this.paymentCache.clear();
    }

    /**
     * Handle payment-specific errors
     * @param {Error} error - Original error
     * @returns {Error} Formatted error
     */
    handlePaymentError(error) {
        if (error.status === 400) {
            return new Error(error.data?.message || 'Invalid payment data');
        } else if (error.status === 401) {
            return new Error('Authentication required');
        } else if (error.status === 403) {
            return new Error('Payment not authorized');
        } else if (error.status === 404) {
            return new Error('Payment not found');
        } else if (error.status === 409) {
            return new Error('Payment already processed');
        } else if (error.status >= 500) {
            return new Error('Payment service temporarily unavailable');
        }

        return error;
    }
}

// Export for use in other modules
window.PaymentService = PaymentService;


