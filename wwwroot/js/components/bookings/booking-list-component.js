/**
 * BookingListComponent - Displays and manages user's bookings
 */
class BookingListComponent {
    constructor(container, bookingService, authService) {
        this.container = container;
        this.bookingService = bookingService;
        this.authService = authService;
        this.bookings = [];
        this.filteredBookings = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        
        this.bindMethods();
    }

    bindMethods() {
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleCancelBooking = this.handleCancelBooking.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
    }

    /**
     * Initialize the component
     */
    async init() {
        if (!this.authService.isAuthenticated()) {
            this.renderLoginRequired();
            return;
        }

        this.render();
        this.bindEvents();
        await this.loadBookings();
    }

    render() {
        this.container.innerHTML = `
            <div class="booking-list-container">
                <div class="booking-list-header">
                    <h2>My Bookings</h2>
                    <button class="btn btn-primary" id="new-booking-btn">
                        <span class="icon">+</span>
                        New Booking
                    </button>
                </div>

                <div class="booking-controls">
                    <div class="search-container">
                        <input 
                            type="text" 
                            id="booking-search" 
                            placeholder="Search bookings by hotel name or location..."
                            class="search-input"
                        >
                        <span class="search-icon">🔍</span>
                    </div>

                    <div class="filter-container">
                        <label for="status-filter">Filter by status:</label>
                        <select id="status-filter" class="filter-select">
                            <option value="all">All Bookings</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Completed">Completed</option>
                            <option value="CheckedIn">Checked In</option>
                            <option value="CheckedOut">Checked Out</option>
                        </select>
                    </div>

                    <button class="btn btn-secondary" id="refresh-btn">
                        <span class="icon">↻</span>
                        Refresh
                    </button>
                </div>

                <div class="booking-stats" id="booking-stats" style="display: none;">
                    <div class="stat-item">
                        <span class="stat-label">Total Bookings:</span>
                        <span class="stat-value" id="total-bookings">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Upcoming:</span>
                        <span class="stat-value" id="upcoming-bookings">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Past:</span>
                        <span class="stat-value" id="past-bookings">0</span>
                    </div>
                </div>

                <div class="booking-list-content">
                    <div class="loading-state" id="loading-state" style="display: none;">
                        <div class="spinner"></div>
                        <p>Loading your bookings...</p>
                    </div>

                    <div class="empty-state" id="empty-state" style="display: none;">
                        <div class="empty-icon">📅</div>
                        <h3>No bookings found</h3>
                        <p id="empty-message">You haven't made any bookings yet.</p>
                        <button class="btn btn-primary" id="empty-new-booking-btn">
                            Make Your First Booking
                        </button>
                    </div>

                    <div class="bookings-grid" id="bookings-grid"></div>
                </div>

                <div class="pagination" id="pagination" style="display: none;">
                    <button class="btn btn-secondary" id="prev-page" disabled>Previous</button>
                    <span class="page-info" id="page-info">Page 1 of 1</span>
                    <button class="btn btn-secondary" id="next-page" disabled>Next</button>
                </div>
            </div>

            <!-- Cancel Booking Modal -->
            <div class="modal" id="cancel-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Cancel Booking</h3>
                        <button class="modal-close" id="cancel-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to cancel this booking?</p>
                        <div class="booking-details" id="cancel-booking-details"></div>
                        <div class="cancellation-policy">
                            <h4>Cancellation Policy</h4>
                            <p>Free cancellation up to 24 hours before check-in. After that, you may be charged for the first night.</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-modal-cancel">Keep Booking</button>
                        <button class="btn btn-danger" id="confirm-cancel-booking">
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

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('booking-search');
        searchInput.addEventListener('input', this.debounce(this.handleSearch, 300));

        // Filter functionality
        const statusFilter = document.getElementById('status-filter');
        statusFilter.addEventListener('change', this.handleFilterChange);

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.addEventListener('click', this.handleRefresh);

        // New booking buttons
        const newBookingBtn = document.getElementById('new-booking-btn');
        const emptyNewBookingBtn = document.getElementById('empty-new-booking-btn');
        
        newBookingBtn.addEventListener('click', () => {
            window.location.hash = '#/hotels';
        });
        
        emptyNewBookingBtn.addEventListener('click', () => {
            window.location.hash = '#/hotels';
        });

        // Cancel modal events
        this.bindCancelModalEvents();
    }

    bindCancelModalEvents() {
        const modal = document.getElementById('cancel-modal');
        const closeBtn = document.getElementById('cancel-modal-close');
        const cancelBtn = document.getElementById('cancel-modal-cancel');
        const confirmBtn = document.getElementById('confirm-cancel-booking');

        closeBtn.addEventListener('click', () => this.hideCancelModal());
        cancelBtn.addEventListener('click', () => this.hideCancelModal());
        confirmBtn.addEventListener('click', this.handleCancelBooking);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideCancelModal();
            }
        });
    }

    async loadBookings() {
        try {
            this.setLoadingState(true);
            
            const bookings = await this.bookingService.getUserBookings();
            this.bookings = bookings.map(booking => new Booking(booking));
            
            this.updateStats();
            this.applyFilters();
            this.renderBookings();
            
        } catch (error) {
            console.error('Error loading bookings:', error);
            this.renderError('Failed to load bookings. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    updateStats() {
        const now = new Date();
        const upcoming = this.bookings.filter(booking => 
            new Date(booking.checkInDate) > now && 
            ['Confirmed', 'Pending'].includes(booking.status)
        ).length;
        
        const past = this.bookings.filter(booking => 
            new Date(booking.checkOutDate) < now || 
            ['Completed', 'CheckedOut'].includes(booking.status)
        ).length;

        document.getElementById('total-bookings').textContent = this.bookings.length;
        document.getElementById('upcoming-bookings').textContent = upcoming;
        document.getElementById('past-bookings').textContent = past;
        
        if (this.bookings.length > 0) {
            document.getElementById('booking-stats').style.display = 'flex';
        }
    }

    handleFilterChange(event) {
        this.currentFilter = event.target.value;
        this.applyFilters();
        this.renderBookings();
    }

    handleSearch(event) {
        this.searchQuery = event.target.value.toLowerCase().trim();
        this.applyFilters();
        this.renderBookings();
    }

    applyFilters() {
        let filtered = [...this.bookings];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(booking => booking.status === this.currentFilter);
        }

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(booking => 
                booking.hotelName.toLowerCase().includes(this.searchQuery) ||
                booking.guestName.toLowerCase().includes(this.searchQuery) ||
                (booking.city && booking.city.toLowerCase().includes(this.searchQuery))
            );
        }

        // Sort by check-in date (newest first)
        filtered.sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate));

        this.filteredBookings = filtered;
    }

    renderBookings() {
        const grid = document.getElementById('bookings-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredBookings.length === 0) {
            grid.innerHTML = '';
            this.showEmptyState();
            return;
        }

        emptyState.style.display = 'none';
        
        grid.innerHTML = this.filteredBookings.map(booking => this.renderBookingCard(booking)).join('');
        
        // Bind card events
        this.bindBookingCardEvents();
    }

    renderBookingCard(booking) {
        const statusClass = this.getStatusClass(booking.status);
        const canCancel = booking.canBeCancelled();
        const isUpcoming = new Date(booking.checkInDate) > new Date();

        return `
            <div class="booking-card" data-booking-id="${booking.id}">
                <div class="booking-card-header">
                    <div class="hotel-info">
                        <h3 class="hotel-name">${booking.hotelName}</h3>
                        <div class="booking-id">Booking #${booking.id}</div>
                    </div>
                    <div class="booking-status ${statusClass}">
                        ${booking.getStatusDisplay()}
                    </div>
                </div>

                <div class="booking-card-body">
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="detail-label">Guest:</span>
                            <span class="detail-value">${booking.guestName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Dates:</span>
                            <span class="detail-value">
                                ${booking.getFormattedCheckInDate()} - ${booking.getFormattedCheckOutDate()}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">${booking.getDurationText()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Guests:</span>
                            <span class="detail-value">${booking.numberOfGuests}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Total:</span>
                            <span class="detail-value total-amount">$${booking.totalAmount}</span>
                        </div>
                    </div>
                </div>

                <div class="booking-card-footer">
                    <div class="booking-actions">
                        <button class="btn btn-secondary btn-sm view-booking" data-booking-id="${booking.id}">
                            View Details
                        </button>
                        ${canCancel ? `
                            <button class="btn btn-danger btn-sm cancel-booking" data-booking-id="${booking.id}">
                                Cancel Booking
                            </button>
                        ` : ''}
                        ${isUpcoming && booking.status === 'Confirmed' ? `
                            <button class="btn btn-primary btn-sm modify-booking" data-booking-id="${booking.id}">
                                Modify
                            </button>
                        ` : ''}
                    </div>
                    <div class="booking-date">
                        Booked on ${new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    }

    bindBookingCardEvents() {
        // View booking details
        const viewButtons = this.container.querySelectorAll('.view-booking');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const bookingId = e.target.dataset.bookingId;
                window.location.hash = `#/bookings/${bookingId}`;
            });
        });

        // Cancel booking
        const cancelButtons = this.container.querySelectorAll('.cancel-booking');
        cancelButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const bookingId = parseInt(e.target.dataset.bookingId);
                this.showCancelModal(bookingId);
            });
        });

        // Modify booking (future enhancement)
        const modifyButtons = this.container.querySelectorAll('.modify-booking');
        modifyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const bookingId = e.target.dataset.bookingId;
                // For now, just show a message
                alert('Booking modification feature coming soon!');
            });
        });
    }

    showCancelModal(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const modal = document.getElementById('cancel-modal');
        const detailsContainer = document.getElementById('cancel-booking-details');
        
        detailsContainer.innerHTML = `
            <div class="cancel-booking-info">
                <h4>${booking.hotelName}</h4>
                <p><strong>Dates:</strong> ${booking.getFormattedCheckInDate()} - ${booking.getFormattedCheckOutDate()}</p>
                <p><strong>Guest:</strong> ${booking.guestName}</p>
                <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
            </div>
        `;

        // Store booking ID for cancellation
        modal.dataset.bookingId = bookingId;
        modal.style.display = 'flex';
    }

    hideCancelModal() {
        const modal = document.getElementById('cancel-modal');
        modal.style.display = 'none';
        delete modal.dataset.bookingId;
    }

    async handleCancelBooking() {
        const modal = document.getElementById('cancel-modal');
        const bookingId = parseInt(modal.dataset.bookingId);
        
        if (!bookingId) return;

        try {
            this.setCancelButtonLoading(true);
            
            await this.bookingService.cancelBooking(bookingId);
            
            // Update local booking status
            const booking = this.bookings.find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'Cancelled';
            }
            
            this.hideCancelModal();
            this.applyFilters();
            this.renderBookings();
            this.updateStats();
            
            this.showSuccessMessage('Booking cancelled successfully');
            
        } catch (error) {
            console.error('Error cancelling booking:', error);
            this.showErrorMessage(error.message || 'Failed to cancel booking. Please try again.');
        } finally {
            this.setCancelButtonLoading(false);
        }
    }

    setCancelButtonLoading(loading) {
        const button = document.getElementById('confirm-cancel-booking');
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

    async handleRefresh() {
        await this.loadBookings();
        this.showSuccessMessage('Bookings refreshed');
    }

    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const emptyMessage = document.getElementById('empty-message');
        
        if (this.searchQuery || this.currentFilter !== 'all') {
            emptyMessage.textContent = 'No bookings match your current filters.';
        } else {
            emptyMessage.textContent = 'You haven\'t made any bookings yet.';
        }
        
        emptyState.style.display = 'block';
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

    setLoadingState(loading) {
        const loadingState = document.getElementById('loading-state');
        const content = document.getElementById('bookings-grid');
        
        if (loading) {
            loadingState.style.display = 'flex';
            content.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            content.style.display = 'block';
        }
    }

    renderLoginRequired() {
        this.container.innerHTML = `
            <div class="login-required">
                <div class="login-required-content">
                    <h2>Login Required</h2>
                    <p>Please log in to view your bookings.</p>
                    <button class="btn btn-primary" onclick="window.location.hash='#/login'">
                        Login
                    </button>
                </div>
            </div>
        `;
    }

    renderError(message) {
        const grid = document.getElementById('bookings-grid');
        grid.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error Loading Bookings</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Try Again
                </button>
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
        let messageEl = document.getElementById('booking-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'booking-message';
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    destroy() {
        // Clean up event listeners and references
        this.container.innerHTML = '';
        this.bookings = [];
        this.filteredBookings = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingListComponent;
}


