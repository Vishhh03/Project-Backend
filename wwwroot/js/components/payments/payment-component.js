/**
 * PaymentComponent - Handles payment form with secure card input validation
 * Provides real-time validation, card number formatting, and payment processing
 */
class PaymentComponent {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            onPaymentSuccess: options.onPaymentSuccess || (() => {}),
            onPaymentError: options.onPaymentError || (() => {}),
            onCancel: options.onCancel || (() => {}),
            bookingId: options.bookingId || null,
            amount: options.amount || 0,
            currency: options.currency || 'USD',
            ...options
        };

        this.paymentService = new PaymentService();
        this.isProcessing = false;
        this.validationErrors = {};

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.bindEvents();
        this.setupRealTimeValidation();
    }

    /**
     * Render the payment form
     */
    render() {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.options.currency
        }).format(this.options.amount);

        this.container.innerHTML = `
            <div class="payment-component">
                <div class="payment-header">
                    <h3>Payment Information</h3>
                    <div class="payment-amount">
                        <span class="amount-label">Total Amount:</span>
                        <span class="amount-value">${formattedAmount}</span>
                    </div>
                </div>

                <form class="payment-form" id="paymentForm">
                    <div class="form-section">
                        <h4>Payment Method</h4>
                        <div class="payment-methods">
                            <label class="payment-method-option">
                                <input type="radio" name="paymentMethod" value="CreditCard" checked>
                                <span class="method-label">
                                    <i class="icon-credit-card"></i>
                                    Credit Card
                                </span>
                            </label>
                            <label class="payment-method-option">
                                <input type="radio" name="paymentMethod" value="DebitCard">
                                <span class="method-label">
                                    <i class="icon-debit-card"></i>
                                    Debit Card
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="form-section card-details">
                        <h4>Card Information</h4>
                        
                        <div class="form-group">
                            <label for="cardNumber">Card Number *</label>
                            <div class="card-input-wrapper">
                                <input 
                                    type="text" 
                                    id="cardNumber" 
                                    name="cardNumber" 
                                    placeholder="1234 5678 9012 3456"
                                    maxlength="19"
                                    autocomplete="cc-number"
                                    required
                                >
                                <div class="card-type-icon" id="cardTypeIcon"></div>
                            </div>
                            <div class="error-message" id="cardNumberError"></div>
                        </div>

                        <div class="form-group">
                            <label for="cardHolderName">Card Holder Name *</label>
                            <input 
                                type="text" 
                                id="cardHolderName" 
                                name="cardHolderName" 
                                placeholder="John Doe"
                                autocomplete="cc-name"
                                required
                            >
                            <div class="error-message" id="cardHolderNameError"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="expiryMonth">Expiry Month *</label>
                                <select id="expiryMonth" name="expiryMonth" autocomplete="cc-exp-month" required>
                                    <option value="">Month</option>
                                    <option value="01">01 - January</option>
                                    <option value="02">02 - February</option>
                                    <option value="03">03 - March</option>
                                    <option value="04">04 - April</option>
                                    <option value="05">05 - May</option>
                                    <option value="06">06 - June</option>
                                    <option value="07">07 - July</option>
                                    <option value="08">08 - August</option>
                                    <option value="09">09 - September</option>
                                    <option value="10">10 - October</option>
                                    <option value="11">11 - November</option>
                                    <option value="12">12 - December</option>
                                </select>
                                <div class="error-message" id="expiryMonthError"></div>
                            </div>

                            <div class="form-group">
                                <label for="expiryYear">Expiry Year *</label>
                                <select id="expiryYear" name="expiryYear" autocomplete="cc-exp-year" required>
                                    <option value="">Year</option>
                                    ${this.generateYearOptions()}
                                </select>
                                <div class="error-message" id="expiryYearError"></div>
                            </div>

                            <div class="form-group">
                                <label for="cvv">CVV *</label>
                                <input 
                                    type="text" 
                                    id="cvv" 
                                    name="cvv" 
                                    placeholder="123"
                                    maxlength="4"
                                    autocomplete="cc-csc"
                                    required
                                >
                                <div class="error-message" id="cvvError"></div>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="security-notice">
                            <i class="icon-shield"></i>
                            <span>Your payment information is encrypted and secure</span>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelBtn">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="payBtn">
                            <span class="btn-text">Pay ${formattedAmount}</span>
                            <span class="btn-loading" style="display: none;">
                                <i class="icon-spinner"></i>
                                Processing...
                            </span>
                        </button>
                    </div>
                </form>

                <div class="payment-result" id="paymentResult" style="display: none;">
                    <div class="result-content"></div>
                </div>
            </div>
        `;
    }

    /**
     * Generate year options for expiry year select
     * @returns {string} HTML options
     */
    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        const years = [];
        
        for (let i = 0; i < 20; i++) {
            const year = currentYear + i;
            const shortYear = year.toString().slice(-2);
            years.push(`<option value="${shortYear}">${year}</option>`);
        }
        
        return years.join('');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const form = this.container.querySelector('#paymentForm');
        const cancelBtn = this.container.querySelector('#cancelBtn');
        const cardNumberInput = this.container.querySelector('#cardNumber');
        const cvvInput = this.container.querySelector('#cvv');
        const cardHolderNameInput = this.container.querySelector('#cardHolderName');

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Cancel button
        cancelBtn.addEventListener('click', () => this.handleCancel());

        // Card number formatting and validation
        cardNumberInput.addEventListener('input', (e) => this.handleCardNumberInput(e));
        cardNumberInput.addEventListener('blur', (e) => this.validateCardNumber(e.target.value));

        // CVV input restriction
        cvvInput.addEventListener('input', (e) => this.handleCvvInput(e));
        cvvInput.addEventListener('blur', (e) => this.validateCvv(e.target.value));

        // Card holder name validation
        cardHolderNameInput.addEventListener('input', (e) => this.handleCardHolderNameInput(e));
        cardHolderNameInput.addEventListener('blur', (e) => this.validateCardHolderName(e.target.value));

        // Expiry validation
        const expiryMonth = this.container.querySelector('#expiryMonth');
        const expiryYear = this.container.querySelector('#expiryYear');
        
        expiryMonth.addEventListener('change', () => this.validateExpiry());
        expiryYear.addEventListener('change', () => this.validateExpiry());
    }

    /**
     * Setup real-time validation
     */
    setupRealTimeValidation() {
        const inputs = this.container.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input.name, input.value);
            });
        });
    }

    /**
     * Handle card number input with formatting
     * @param {Event} e - Input event
     */
    handleCardNumberInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Format with spaces every 4 digits
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        
        e.target.value = value;
        
        // Update card type icon
        this.updateCardTypeIcon(value);
        
        // Real-time validation
        if (value.length >= 13) {
            this.validateCardNumber(value);
        } else {
            this.clearFieldError('cardNumber');
        }
    }

    /**
     * Handle CVV input restriction
     * @param {Event} e - Input event
     */
    handleCvvInput(e) {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');
    }

    /**
     * Handle card holder name input
     * @param {Event} e - Input event
     */
    handleCardHolderNameInput(e) {
        // Only allow letters, spaces, hyphens, and periods
        e.target.value = e.target.value.replace(/[^a-zA-Z\s\-\.]/g, '');
    }

    /**
     * Update card type icon based on card number
     * @param {string} cardNumber - Card number
     */
    updateCardTypeIcon(cardNumber) {
        const cardTypeIcon = this.container.querySelector('#cardTypeIcon');
        const cleaned = cardNumber.replace(/\D/g, '');
        
        let cardType = '';
        
        if (/^4/.test(cleaned)) {
            cardType = 'visa';
        } else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
            cardType = 'mastercard';
        } else if (/^3[47]/.test(cleaned)) {
            cardType = 'amex';
        } else if (/^6/.test(cleaned)) {
            cardType = 'discover';
        }
        
        cardTypeIcon.className = `card-type-icon ${cardType}`;
        cardTypeIcon.title = cardType ? cardType.charAt(0).toUpperCase() + cardType.slice(1) : '';
    }

    /**
     * Validate card number
     * @param {string} cardNumber - Card number to validate
     * @returns {boolean} True if valid
     */
    validateCardNumber(cardNumber) {
        const isValid = this.paymentService.validateCardNumber(cardNumber);
        
        if (!isValid && cardNumber.length > 0) {
            this.setFieldError('cardNumber', 'Invalid card number');
            return false;
        } else {
            this.clearFieldError('cardNumber');
            return true;
        }
    }

    /**
     * Validate CVV
     * @param {string} cvv - CVV to validate
     * @returns {boolean} True if valid
     */
    validateCvv(cvv) {
        const isValid = this.paymentService.validateCVV(cvv);
        
        if (!isValid && cvv.length > 0) {
            this.setFieldError('cvv', 'Invalid CVV (3-4 digits)');
            return false;
        } else {
            this.clearFieldError('cvv');
            return true;
        }
    }

    /**
     * Validate card holder name
     * @param {string} name - Card holder name
     * @returns {boolean} True if valid
     */
    validateCardHolderName(name) {
        if (!name || name.trim().length < 2) {
            this.setFieldError('cardHolderName', 'Card holder name is required');
            return false;
        } else {
            this.clearFieldError('cardHolderName');
            return true;
        }
    }

    /**
     * Validate expiry date
     * @returns {boolean} True if valid
     */
    validateExpiry() {
        const month = this.container.querySelector('#expiryMonth').value;
        const year = this.container.querySelector('#expiryYear').value;
        
        if (!month) {
            this.setFieldError('expiryMonth', 'Expiry month is required');
            return false;
        }
        
        if (!year) {
            this.setFieldError('expiryYear', 'Expiry year is required');
            return false;
        }
        
        if (this.paymentService.isCardExpired(month, year)) {
            this.setFieldError('expiryMonth', 'Card has expired');
            this.setFieldError('expiryYear', 'Card has expired');
            return false;
        }
        
        this.clearFieldError('expiryMonth');
        this.clearFieldError('expiryYear');
        return true;
    }

    /**
     * Validate a specific field
     * @param {string} fieldName - Field name
     * @param {string} value - Field value
     * @returns {boolean} True if valid
     */
    validateField(fieldName, value) {
        switch (fieldName) {
            case 'cardNumber':
                return this.validateCardNumber(value);
            case 'cardHolderName':
                return this.validateCardHolderName(value);
            case 'cvv':
                return this.validateCvv(value);
            case 'expiryMonth':
            case 'expiryYear':
                return this.validateExpiry();
            default:
                return true;
        }
    }

    /**
     * Set field error
     * @param {string} fieldName - Field name
     * @param {string} message - Error message
     */
    setFieldError(fieldName, message) {
        this.validationErrors[fieldName] = message;
        
        const errorElement = this.container.querySelector(`#${fieldName}Error`);
        const inputElement = this.container.querySelector(`#${fieldName}`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    /**
     * Clear field error
     * @param {string} fieldName - Field name
     */
    clearFieldError(fieldName) {
        delete this.validationErrors[fieldName];
        
        const errorElement = this.container.querySelector(`#${fieldName}Error`);
        const inputElement = this.container.querySelector(`#${fieldName}`);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    /**
     * Validate entire form
     * @returns {boolean} True if form is valid
     */
    validateForm() {
        const formData = this.getFormData();
        let isValid = true;
        
        // Clear previous errors
        this.validationErrors = {};
        
        // Validate all fields
        if (!this.validateCardNumber(formData.cardNumber)) isValid = false;
        if (!this.validateCardHolderName(formData.cardHolderName)) isValid = false;
        if (!this.validateCvv(formData.cvv)) isValid = false;
        if (!this.validateExpiry()) isValid = false;
        
        return isValid;
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        const form = this.container.querySelector('#paymentForm');
        const formData = new FormData(form);
        
        return {
            bookingId: this.options.bookingId,
            amount: this.options.amount,
            currency: this.options.currency,
            paymentMethod: formData.get('paymentMethod'),
            cardNumber: formData.get('cardNumber').replace(/\s/g, ''),
            cardHolderName: formData.get('cardHolderName'),
            expiryMonth: formData.get('expiryMonth'),
            expiryYear: formData.get('expiryYear'),
            cvv: formData.get('cvv')
        };
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isProcessing) return;
        
        // Validate form
        if (!this.validateForm()) {
            this.showError('Please correct the errors above');
            return;
        }
        
        this.setProcessingState(true);
        
        try {
            const paymentData = this.getFormData();
            const result = await this.paymentService.processPayment(paymentData);
            
            this.showSuccess(result);
            this.options.onPaymentSuccess(result);
        } catch (error) {
            this.showError(error.message);
            this.options.onPaymentError(error);
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * Handle cancel button click
     */
    handleCancel() {
        this.options.onCancel();
    }

    /**
     * Set processing state
     * @param {boolean} processing - Processing state
     */
    setProcessingState(processing) {
        this.isProcessing = processing;
        
        const payBtn = this.container.querySelector('#payBtn');
        const btnText = payBtn.querySelector('.btn-text');
        const btnLoading = payBtn.querySelector('.btn-loading');
        
        if (processing) {
            payBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
        } else {
            payBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    /**
     * Show success message
     * @param {Object} result - Payment result
     */
    showSuccess(result) {
        const resultDiv = this.container.querySelector('#paymentResult');
        const resultContent = resultDiv.querySelector('.result-content');
        
        resultContent.innerHTML = `
            <div class="payment-success">
                <i class="icon-check-circle"></i>
                <h4>Payment Successful!</h4>
                <p>Transaction ID: ${result.transactionId}</p>
                <p>Amount: ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: this.options.currency
                }).format(result.amount)}</p>
            </div>
        `;
        
        resultDiv.style.display = 'block';
        this.container.querySelector('#paymentForm').style.display = 'none';
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const resultDiv = this.container.querySelector('#paymentResult');
        const resultContent = resultDiv.querySelector('.result-content');
        
        resultContent.innerHTML = `
            <div class="payment-error">
                <i class="icon-exclamation-circle"></i>
                <h4>Payment Failed</h4>
                <p>${message}</p>
                <button type="button" class="btn btn-primary" onclick="this.closest('.payment-result').style.display='none'">
                    Try Again
                </button>
            </div>
        `;
        
        resultDiv.style.display = 'block';
    }

    /**
     * Reset the form
     */
    reset() {
        const form = this.container.querySelector('#paymentForm');
        form.reset();
        
        this.validationErrors = {};
        this.clearAllErrors();
        
        const resultDiv = this.container.querySelector('#paymentResult');
        resultDiv.style.display = 'none';
        
        form.style.display = 'block';
    }

    /**
     * Clear all validation errors
     */
    clearAllErrors() {
        const errorElements = this.container.querySelectorAll('.error-message');
        const inputElements = this.container.querySelectorAll('input.error, select.error');
        
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        inputElements.forEach(el => {
            el.classList.remove('error');
        });
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
window.PaymentComponent = PaymentComponent;


