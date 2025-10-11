/**
 * PaymentConfirmationComponent - Displays payment confirmation details
 * Shows transaction details, booking information, and next steps
 */
class PaymentConfirmationComponent {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            payment: options.payment || null,
            booking: options.booking || null,
            onContinue: options.onContinue || (() => {}),
            onPrintReceipt: options.onPrintReceipt || (() => {}),
            onEmailReceipt: options.onEmailReceipt || (() => {}),
            ...options
        };

        this.paymentService = new PaymentService();
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Render the payment confirmation
     */
    render() {
        if (!this.options.payment) {
            this.renderError('Payment information not available');
            return;
        }

        const payment = new Payment(this.options.payment);
        const booking = this.options.booking;

        this.container.innerHTML = `
            <div class="payment-confirmation">
                <div class="confirmation-header">
                    <div class="success-icon">
                        <i class="icon-check-circle"></i>
                    </div>
                    <h2>Payment Successful!</h2>
                    <p class="confirmation-message">
                        Your payment has been processed successfully. 
                        ${booking ? 'Your booking is confirmed.' : ''}
                    </p>
                </div>

                <div class="confirmation-details">
                    <div class="detail-section">
                        <h3>Transaction Details</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Transaction ID:</span>
                                <span class="detail-value transaction-id">${payment.transactionId || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Amount Paid:</span>
                                <span class="detail-value amount">${payment.getFormattedAmount()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Payment Method:</span>
                                <span class="detail-value">${payment.getPaymentMethodText()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Card:</span>
                                <span class="detail-value">${payment.getMaskedCardNumber()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date & Time:</span>
                                <span class="detail-value">${payment.getFormattedProcessedDate()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value status ${payment.getStatusInfo().class}">
                                    ${payment.getStatusInfo().text}
                                </span>
                            </div>
                        </div>
                    </div>

                    ${booking ? this.renderBookingDetails(booking) : ''}

                    <div class="detail-section">
                        <h3>Receipt Options</h3>
                        <div class="receipt-actions">
                            <button type="button" class="btn btn-outline" id="printReceiptBtn">
                                <i class="icon-print"></i>
                                Print Receipt
                            </button>
                            <button type="button" class="btn btn-outline" id="emailReceiptBtn">
                                <i class="icon-email"></i>
                                Email Receipt
                            </button>
                            <button type="button" class="btn btn-outline" id="downloadReceiptBtn">
                                <i class="icon-download"></i>
                                Download PDF
                            </button>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Important Information</h3>
                        <div class="info-box">
                            <ul>
                                <li>Please save this confirmation for your records</li>
                                <li>A confirmation email has been sent to your registered email address</li>
                                ${booking ? '<li>Check-in instructions will be sent 24 hours before your arrival</li>' : ''}
                                <li>For any questions, contact our customer support with your transaction ID</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="confirmation-actions">
                    ${booking ? `
                        <button type="button" class="btn btn-outline" id="viewBookingBtn">
                            View Booking Details
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-primary" id="continueBtn">
                        Continue
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render booking details section
     * @param {Object} booking - Booking information
     * @returns {string} HTML for booking details
     */
    renderBookingDetails(booking) {
        return `
            <div class="detail-section">
                <h3>Booking Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Booking ID:</span>
                        <span class="detail-value">${booking.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Hotel:</span>
                        <span class="detail-value">${booking.hotelName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Guest Name:</span>
                        <span class="detail-value">${booking.guestName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Check-in:</span>
                        <span class="detail-value">${new Date(booking.checkInDate).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Check-out:</span>
                        <span class="detail-value">${new Date(booking.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Guests:</span>
                        <span class="detail-value">${booking.numberOfGuests}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render error state
     * @param {string} message - Error message
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="payment-confirmation error">
                <div class="confirmation-header">
                    <div class="error-icon">
                        <i class="icon-exclamation-circle"></i>
                    </div>
                    <h2>Unable to Display Confirmation</h2>
                    <p class="error-message">${message}</p>
                </div>
                <div class="confirmation-actions">
                    <button type="button" class="btn btn-primary" id="continueBtn">
                        Continue
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const continueBtn = this.container.querySelector('#continueBtn');
        const printReceiptBtn = this.container.querySelector('#printReceiptBtn');
        const emailReceiptBtn = this.container.querySelector('#emailReceiptBtn');
        const downloadReceiptBtn = this.container.querySelector('#downloadReceiptBtn');
        const viewBookingBtn = this.container.querySelector('#viewBookingBtn');

        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.handleContinue());
        }

        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', () => this.handlePrintReceipt());
        }

        if (emailReceiptBtn) {
            emailReceiptBtn.addEventListener('click', () => this.handleEmailReceipt());
        }

        if (downloadReceiptBtn) {
            downloadReceiptBtn.addEventListener('click', () => this.handleDownloadReceipt());
        }

        if (viewBookingBtn) {
            viewBookingBtn.addEventListener('click', () => this.handleViewBooking());
        }
    }

    /**
     * Handle continue button click
     */
    handleContinue() {
        this.options.onContinue();
    }

    /**
     * Handle print receipt
     */
    handlePrintReceipt() {
        const printContent = this.generatePrintableReceipt();
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Payment Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .receipt { max-width: 600px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .detail-grid { margin-bottom: 20px; }
                        .detail-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .detail-label { font-weight: bold; }
                        .section { margin-bottom: 30px; }
                        .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        
        this.options.onPrintReceipt();
    }

    /**
     * Handle email receipt
     */
    async handleEmailReceipt() {
        try {
            // In a real implementation, this would call an API to send the receipt
            // For now, we'll just show a success message
            this.showNotification('Receipt has been sent to your email address', 'success');
            this.options.onEmailReceipt();
        } catch (error) {
            this.showNotification('Failed to send receipt. Please try again.', 'error');
        }
    }

    /**
     * Handle download receipt
     */
    handleDownloadReceipt() {
        const receiptContent = this.generatePrintableReceipt();
        const blob = new Blob([receiptContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-receipt-${this.options.payment.transactionId || 'unknown'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Handle view booking
     */
    handleViewBooking() {
        if (this.options.booking) {
            // Navigate to booking details
            window.location.hash = `#/bookings/${this.options.booking.id}`;
        }
    }

    /**
     * Generate printable receipt content
     * @returns {string} HTML content for receipt
     */
    generatePrintableReceipt() {
        const payment = new Payment(this.options.payment);
        const booking = this.options.booking;

        return `
            <div class="receipt">
                <div class="header">
                    <h1>Payment Receipt</h1>
                    <p>Transaction ID: ${payment.transactionId || 'N/A'}</p>
                </div>
                
                <div class="section">
                    <h3>Transaction Details</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Amount Paid:</span>
                            <span class="detail-value">${payment.getFormattedAmount()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Payment Method:</span>
                            <span class="detail-value">${payment.getPaymentMethodText()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Card:</span>
                            <span class="detail-value">${payment.getMaskedCardNumber()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Date & Time:</span>
                            <span class="detail-value">${payment.getFormattedProcessedDate()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${payment.getStatusInfo().text}</span>
                        </div>
                    </div>
                </div>

                ${booking ? `
                    <div class="section">
                        <h3>Booking Details</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Booking ID:</span>
                                <span class="detail-value">${booking.id}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Hotel:</span>
                                <span class="detail-value">${booking.hotelName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Guest Name:</span>
                                <span class="detail-value">${booking.guestName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Check-in:</span>
                                <span class="detail-value">${new Date(booking.checkInDate).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Check-out:</span>
                                <span class="detail-value">${new Date(booking.checkOutDate).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Guests:</span>
                                <span class="detail-value">${booking.numberOfGuests}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="section">
                    <p><strong>Thank you for your payment!</strong></p>
                    <p>Please keep this receipt for your records.</p>
                </div>
            </div>
        `;
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button type="button" class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Handle close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Update payment information
     * @param {Object} payment - Updated payment data
     * @param {Object} booking - Updated booking data
     */
    updatePayment(payment, booking = null) {
        this.options.payment = payment;
        this.options.booking = booking;
        this.render();
        this.bindEvents();
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
window.PaymentConfirmationComponent = PaymentConfirmationComponent;


