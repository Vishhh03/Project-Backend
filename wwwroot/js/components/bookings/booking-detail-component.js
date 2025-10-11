/**
 * BookingDetailComponent - Displays detailed booking information
 */
class BookingDetailComponent {
    constructor(container, bookingService, authService) {
        this.container = container;
        this.bookingService = bookingService;
        this.authService = authService;
        this.booking = null;
        this.bookingId = null;
        
        this.bindMethods();
    }

    bindMethods() {
        this.handleCancelBooking = this.handleCancelBooking.bind(this);
        this.handlePrint = this.handlePrint.bind(this);
    }

    /**
     * Initialize the component with booking ID
     * @param {number} bookingId - Booking ID to display
     */
    async init(bookingId) {
        this.bookingId = bookingId;
        
        if (!this.authService.isAuthenticated()) {
            this.renderLoginRequired();
            return;
        }

        this.renderLoading();
        await this.loadBooking();
    }

    async loadBooking() {
        try {
            const booking = await this.bookingService.getBookingById(this.bookingId);
            this.booking = new Booking(booking);
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Error loading booking:', error);
            this.renderError('Failed to load booking details. Please try again.');
        }
    }

    render() {
        if (!this.booking) return;

        const canCancel = this.booking.canBeCancelled();
        const statusClass = this.getStatusClass(this.booking.status);

        this.container.innerHTML = `
            <div class="booking-detail-container">
                <div class="booking-detail-header">
                    <div class="header-left">
                        <button class="btn btn-secondary back-btn" id="back-btn">
                            ← Back to Bookings
                        </button>
                        <div class="booking-title">
                            <h1>Booking Details</h1>
                            <div class="booking-id">Booking #${this.booking.id}</div>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="booking-status ${statusClass}">
                            ${this.booking.getStatusDisplay()}
                        </div>
                    </div>
                </div>

                <div class="booking-detail-content">
                    <div class="booking-info-grid">
                        <!-- Hotel Information -->
                        <div class="info-section">
                            <h3>Hotel Information</h3>
                            <div class="info-card">
                                <div class="hotel-header">
                                    <h4>${this.booking.hotelName}</h4>
                                </div>
                                <div class="hotel-details">
                                    <div class="detail-row">
                                        <span class="detail-label">Hotel ID:</span>
                                        <span class="detail-value">${this.booking.hotelId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guest Information -->
                        <div class="info-section">
                            <h3>Guest Information</h3>
                            <div class="info-card">
                                <div class="detail-row">
                                    <span class="detail-label">Name:</span>
                                    <span class="detail-value">${this.booking.guestName}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Email:</span>
                                    <span class="detail-value">${this.booking.guestEmail}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Number of Guests:</span>
                                    <span class="detail-value">${this.booking.numberOfGuests}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Booking Dates -->
                        <div class="info-section">
                            <h3>Booking Dates</h3>
                            <div class="info-card">
                                <div class="date-info">
                                    <div class="date-item">
                                        <div class="date-label">Check-in</div>
                                        <div class="date-value">${this.booking.getFormattedCheckInDate()}</div>
                                        <div class="date-time">3:00 PM</div>
                                    </div>
                                    <div class="date-separator">
                                        <div class="nights-count">${this.booking.getDurationText()}</div>
                                    </div>
                                    <div class="date-item">
                                        <div class="date-label">Check-out</div>
                                        <div class="date-value">${this.booking.getFormattedCheckOutDate()}</div>
                                        <div class="date-time">11:00 AM</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Information -->
                        <div class="info-section">
                            <h3>Payment Information</h3>
                            <div class="info-card">
                                <div class="payment-breakdown">
                                    <div class="payment-row">
                                        <span class="payment-label">Room Rate (${this.booking.getNights()} nights):</span>
                                        <span class="payment-value">$${this.booking.totalAmount}</span>
                                    </div>
                                    <div class="payment-row total">
                                        <span class="payment-label">Total Amount:</span>
                                        <span class="payment-value">$${this.booking.totalAmount}</span>
                                    </div>
                                </div>
                                <div class="payment-status">
                                    <span class="payment-status-label">Payment Status:</span>
                                    <span class="payment-status-value ${this.getPaymentStatusClass()}">
                                        ${this.getPaymentStatusText()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Booking Timeline -->
                        <div class="info-section full-width">
                            <h3>Booking Timeline</h3>
                            <div class="info-card">
                                <div class="timeline">
                                    <div class="timeline-item completed">
                                        <div class="timeline-marker"></div>
                                        <div class="timeline-content">
                                            <div class="timeline-title">Booking Created</div>
                                            <div class="timeline-date">${new Date(this.booking.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    ${this.renderTimelineItems()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="booking-actions">
                    <div class="action-buttons">
                        <button class="btn btn-secondary" id="print-btn">
                            🖨️ Print Confirmation
                        </button>
                        ${canCancel ? `
                            <button class="btn btn-danger" id="cancel-booking-btn">
                                Cancel Booking
                            </button>
                        ` : ''}
                        <button class="btn btn-primary" id="contact-support-btn">
                            Contact Support
                        </button>
                    </div>
                </div>

                <div class="booking-policies">
                    <h3>Important Information</h3>
                    <div class="policies-grid">
                        <div class="policy-item">
                            <h4>Check-in Policy</h4>
                            <p>Check-in time is 3:00 PM. Early check-in may be available upon request.</p>
                        </div>
                        <div class="policy-item">
                            <h4>Check-out Policy</h4>
                            <p>Check-out time is 11:00 AM. Late check-out may be available for an additional fee.</p>
                        </div>
                        <div class="policy-item">
                            <h4>Cancellation Policy</h4>
                            <p>Free cancellation up to 24 hours before check-in. Cancellations within 24 hours may be charged for the first night.</p>
                        </div>
                        <div class="policy-item">
                            <h4>Modification Policy</h4>
                            <p>Booking modifications are subject to availability and may incur additional charges.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cancel Confirmation Modal -->
            <div class="modal" id="cancel-confirmation-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Cancel Booking</h3>
                        <button class="modal-close" id="cancel-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to cancel this booking?</p>
                        <div class="cancellation-warning">
                            <strong>Warning:</strong> This action cannot be undone. Please review the cancellation policy above.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="keep-booking-btn">Keep Booking</button>
                        <button class="btn btn-danger" id="confirm-cancel-btn">
                            <span class="btn-text">Cancel Booking</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span>
                                Cancelling...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderTimelineItems() {
        const items = [];
        const now = new Date();
        const checkInDate = new Date(this.booking.checkInDate);
        const checkOutDate = new Date(this.booking.checkOutDate);

        // Confirmation status
        if (this.booking.status === 'Confirmed') {
            items.push(`
                <div class="timeline-item completed">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Booking Confirmed</div>
                        <div class="timeline-date">Confirmation received</div>
                    </div>
                </div>
            `);
        }

        // Check-in
        const checkInClass = now >= checkInDate ? 'completed' : 'upcoming';
        items.push(`
            <div class="timeline-item ${checkInClass}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Check-in</div>
                    <div class="timeline-date">${this.booking.getFormattedCheckInDate()} at 3:00 PM</div>
                </div>
            </div>
        `);

        // Check-out
        const checkOutClass = now >= checkOutDate ? 'completed' : 'upcoming';
        items.push(`
            <div class="timeline-item ${checkOutClass}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Check-out</div>
                    <div class="timeline-date">${this.booking.getFormattedCheckOutDate()} by 11:00 AM</div>
                </div>
            </div>
        `);

        return items.join('');
    }

    bindEvents() {
        // Back button
        const backBtn = document.getElementById('back-btn');
        backBtn.addEventListener('click', () => {
            window.location.hash = '#/bookings';
        });

        // Print button
        const printBtn = document.getElementById('print-btn');
        printBtn.addEventListener('click', this.handlePrint);

        // Cancel booking button
        const cancelBtn = document.getElementById('cancel-booking-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.showCancelModal();
            });
        }

        // Contact support button
        const supportBtn = document.getElementById('contact-support-btn');
        supportBtn.addEventListener('click', () => {
            // For now, just show an alert
            alert('Contact support at: support@hotel.com or call 1-800-HOTEL-1');
        });

        // Cancel modal events
        this.bindCancelModalEvents();
    }

    bindCancelModalEvents() {
        const modal = document.getElementById('cancel-confirmation-modal');
        const closeBtn = document.getElementById('cancel-modal-close');
        const keepBtn = document.getElementById('keep-booking-btn');
        const confirmBtn = document.getElementById('confirm-cancel-btn');

        closeBtn.addEventListener('click', () => this.hideCancelModal());
        keepBtn.addEventListener('click', () => this.hideCancelModal());
        confirmBtn.addEventListener('click', this.handleCancelBooking);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideCancelModal();
            }
        });
    }

    showCancelModal() {
        const modal = document.getElementById('cancel-confirmation-modal');
        modal.style.display = 'flex';
    }

    hideCancelModal() {
        const modal = document.getElementById('cancel-confirmation-modal');
        modal.style.display = 'none';
    }

    async handleCancelBooking() {
        try {
            this.setCancelButtonLoading(true);
            
            await this.bookingService.cancelBooking(this.booking.id);
            
            // Update booking status
            this.booking.status = 'Cancelled';
            
            this.hideCancelModal();
            this.render();
            this.bindEvents();
            
            this.showSuccessMessage('Booking cancelled successfully');
            
        } catch (error) {
            console.error('Error cancelling booking:', error);
            this.showErrorMessage(error.message || 'Failed to cancel booking. Please try again.');
        } finally {
            this.setCancelButtonLoading(false);
        }
    }

    setCancelButtonLoading(loading) {
        const button = document.getElementById('confirm-cancel-btn');
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            button.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            button.disabled = false;
        }
    }

    handlePrint() {
        // Create a print-friendly version
        const printContent = this.generatePrintContent();
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Booking Confirmation - ${this.booking.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .print-header { text-align: center; margin-bottom: 30px; }
                        .booking-info { margin-bottom: 20px; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    generatePrintContent() {
        return `
            <div class="print-header">
                <h1>Booking Confirmation</h1>
                <h2>Booking #${this.booking.id}</h2>
            </div>
            
            <div class="booking-info">
                <h3>Hotel Information</h3>
                <div class="info-row">
                    <span>Hotel:</span>
                    <span>${this.booking.hotelName}</span>
                </div>
            </div>
            
            <div class="booking-info">
                <h3>Guest Information</h3>
                <div class="info-row">
                    <span>Name:</span>
                    <span>${this.booking.guestName}</span>
                </div>
                <div class="info-row">
                    <span>Email:</span>
                    <span>${this.booking.guestEmail}</span>
                </div>
                <div class="info-row">
                    <span>Guests:</span>
                    <span>${this.booking.numberOfGuests}</span>
                </div>
            </div>
            
            <div class="booking-info">
                <h3>Booking Details</h3>
                <div class="info-row">
                    <span>Check-in:</span>
                    <span>${this.booking.getFormattedCheckInDate()} at 3:00 PM</span>
                </div>
                <div class="info-row">
                    <span>Check-out:</span>
                    <span>${this.booking.getFormattedCheckOutDate()} at 11:00 AM</span>
                </div>
                <div class="info-row">
                    <span>Duration:</span>
                    <span>${this.booking.getDurationText()}</span>
                </div>
                <div class="info-row total">
                    <span>Total Amount:</span>
                    <span>$${this.booking.totalAmount}</span>
                </div>
            </div>
            
            <div class="booking-info">
                <h3>Status</h3>
                <div class="info-row">
                    <span>Booking Status:</span>
                    <span>${this.booking.getStatusDisplay()}</span>
                </div>
                <div class="info-row">
                    <span>Booked on:</span>
                    <span>${new Date(this.booking.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusClasses = {
            'Confirmed': 'status-confirmed',
            'Pending': 'status-pending',
            'Cancelled': 'status-cancelled',
            'Completed': 'status-completed',
            'CheckedIn': 'status-checked-in',
            'CheckedOut': 'status-checked-out'
        };
        return statusClasses[status] || 'status-default';
    }

    getPaymentStatusClass() {
        return this.booking.status === 'Confirmed' ? 'payment-paid' : 'payment-pending';
    }

    getPaymentStatusText() {
        return this.booking.status === 'Confirmed' ? 'Paid' : 'Pending';
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading booking details...</p>
            </div>
        `;
    }

    renderLoginRequired() {
        this.container.innerHTML = `
            <div class="login-required">
                <div class="login-required-content">
                    <h2>Login Required</h2>
                    <p>Please log in to view booking details.</p>
                    <button class="btn btn-primary" onclick="window.location.hash='#/login'">
                        Login
                    </button>
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h2>Error Loading Booking</h2>
                <p>${message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        Try Again
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.hash='#/bookings'">
                        Back to Bookings
                    </button>
                </div>
            </div>
        `;
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Create or update message element
        let messageEl = document.getElementById('booking-detail-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'booking-detail-message';
            messageEl.className = 'booking-message';
            this.container.insertBefore(messageEl, this.container.firstChild);
        }

        messageEl.textContent = message;
        messageEl.className = `booking-message ${type}`;
        messageEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    destroy() {
        // Clean up event listeners and references
        this.container.innerHTML = '';
        this.booking = null;
        this.bookingId = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingDetailComponent;
}


