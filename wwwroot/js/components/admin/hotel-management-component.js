/**
 * HotelManagementComponent - Hotel management interface for hotel managers
 * Provides hotel creation, editing, and booking overview functionality
 */
class HotelManagementComponent {
    constructor(container) {
        this.container = container;
        this.authService = new AuthService();
        this.hotelService = new HotelService();
        this.bookingService = new BookingService(new ApiClient(), this.authService);
        
        this.currentView = 'hotels';
        this.hotels = [];
        this.bookings = [];
        this.selectedHotel = null;
        this.isEditing = false;
        
        this.initialize();
    }

    /**
     * Initialize the hotel management component
     */
    async initialize() {
        try {
            // Verify manager or admin access
            if (!this.authService.isHotelManager() && !this.authService.isAdmin()) {
                throw new Error('Access denied. Hotel Manager or Admin privileges required.');
            }

            await this.loadData();
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Failed to initialize hotel management:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Load hotel and booking data
     */
    async loadData() {
        try {
            // Load hotels (for managers, only their managed hotels)
            if (this.authService.isAdmin()) {
                this.hotels = await this.hotelService.getAllHotels();
            } else {
                // For hotel managers, get only their managed hotels
                const currentUser = this.authService.getCurrentUserData();
                this.hotels = await this.hotelService.getHotelsByManager(currentUser.id);
            }
            
            // Load bookings for managed hotels
            this.bookings = await this.loadHotelBookings();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Load bookings for managed hotels
     */
    async loadHotelBookings() {
        try {
            const allBookings = [];
            for (const hotel of this.hotels) {
                const hotelBookings = await this.bookingService.getBookingsByHotel(hotel.id);
                allBookings.push(...hotelBookings);
            }
            return allBookings;
        } catch (error) {
            console.error('Error loading hotel bookings:', error);
            return [];
        }
    }

    /**
     * Render the hotel management interface
     */
    render() {
        this.container.innerHTML = `
            <div class="hotel-management">
                <div class="management-header">
                    <h1>Hotel Management</h1>
                    <div class="management-user-info">
                        <span>Welcome, ${this.authService.getCurrentUserData()?.name || 'Manager'}</span>
                        <button class="btn btn-secondary" id="management-logout">Logout</button>
                    </div>
                </div>

                <div class="management-navigation">
                    <nav class="management-nav">
                        <button class="nav-btn ${this.currentView === 'hotels' ? 'active' : ''}" data-view="hotels">
                            <i class="icon-hotels"></i> My Hotels
                        </button>
                        <button class="nav-btn ${this.currentView === 'bookings' ? 'active' : ''}" data-view="bookings">
                            <i class="icon-bookings"></i> Bookings
                        </button>
                        <button class="nav-btn ${this.currentView === 'analytics' ? 'active' : ''}" data-view="analytics">
                            <i class="icon-analytics"></i> Analytics
                        </button>
                    </nav>
                </div>

                <div class="management-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    }

    /**
     * Render the current view
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'hotels':
                return this.renderHotelManagement();
            case 'bookings':
                return this.renderBookingOverview();
            case 'analytics':
                return this.renderAnalytics();
            default:
                return this.renderHotelManagement();
        }
    }

    /**
     * Render hotel management view
     */
    renderHotelManagement() {
        return `
            <div class="hotel-management-section">
                <div class="section-header">
                    <h2>My Hotels</h2>
                    <div class="section-actions">
                        <button class="btn btn-primary" id="add-hotel-btn">
                            <i class="icon-plus"></i> Add New Hotel
                        </button>
                    </div>
                </div>

                <div class="hotels-grid">
                    ${this.renderHotelsGrid()}
                </div>

                <!-- Hotel Form Modal -->
                <div class="modal" id="hotel-form-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${this.isEditing ? 'Edit Hotel' : 'Add New Hotel'}</h3>
                            <button class="modal-close" id="close-hotel-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            ${this.renderHotelForm()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render hotels grid
     */
    renderHotelsGrid() {
        if (this.hotels.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🏨</div>
                    <h3>No Hotels Yet</h3>
                    <p>Start by adding your first hotel to manage bookings and track performance.</p>
                    <button class="btn btn-primary" onclick="hotelManagement.showHotelForm()">
                        Add Your First Hotel
                    </button>
                </div>
            `;
        }

        return this.hotels.map(hotel => `
            <div class="hotel-card">
                <div class="hotel-image">
                    <img src="${hotel.imageUrl || '/assets/images/hotel-placeholder.jpg'}" 
                         alt="${hotel.name}" 
                         onerror="this.src='/assets/images/hotel-placeholder.jpg'">
                </div>
                <div class="hotel-info">
                    <h3>${hotel.name}</h3>
                    <p class="hotel-address">
                        <i class="icon-location"></i>
                        ${hotel.address}, ${hotel.city}
                    </p>
                    <div class="hotel-stats">
                        <div class="stat">
                            <span class="stat-value">$${hotel.pricePerNight}</span>
                            <span class="stat-label">per night</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${hotel.availableRooms}</span>
                            <span class="stat-label">rooms</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${hotel.rating || 'N/A'}</span>
                            <span class="stat-label">rating</span>
                        </div>
                    </div>
                    <div class="hotel-actions">
                        <button class="btn btn-secondary btn-sm" onclick="hotelManagement.editHotel(${hotel.id})">
                            <i class="icon-edit"></i> Edit
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="hotelManagement.viewHotelBookings(${hotel.id})">
                            <i class="icon-bookings"></i> Bookings
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="hotelManagement.deleteHotel(${hotel.id})">
                            <i class="icon-delete"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render hotel form
     */
    renderHotelForm() {
        const hotel = this.selectedHotel || {};
        
        return `
            <form id="hotel-form" class="hotel-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-name">Hotel Name *</label>
                        <input type="text" id="hotel-name" name="name" 
                               value="${hotel.name || ''}" 
                               required maxlength="100">
                        <div class="form-error" id="name-error"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-address">Address *</label>
                        <input type="text" id="hotel-address" name="address" 
                               value="${hotel.address || ''}" 
                               required maxlength="200">
                        <div class="form-error" id="address-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="hotel-city">City *</label>
                        <input type="text" id="hotel-city" name="city" 
                               value="${hotel.city || ''}" 
                               required maxlength="50">
                        <div class="form-error" id="city-error"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-price">Price per Night *</label>
                        <input type="number" id="hotel-price" name="pricePerNight" 
                               value="${hotel.pricePerNight || ''}" 
                               required min="0" step="0.01">
                        <div class="form-error" id="pricePerNight-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="hotel-rooms">Available Rooms *</label>
                        <input type="number" id="hotel-rooms" name="availableRooms" 
                               value="${hotel.availableRooms || ''}" 
                               required min="1" max="1000">
                        <div class="form-error" id="availableRooms-error"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-description">Description</label>
                        <textarea id="hotel-description" name="description" 
                                  rows="4" maxlength="1000">${hotel.description || ''}</textarea>
                        <div class="form-error" id="description-error"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-amenities">Amenities (comma-separated)</label>
                        <input type="text" id="hotel-amenities" name="amenities" 
                               value="${hotel.amenities ? hotel.amenities.join(', ') : ''}" 
                               placeholder="WiFi, Pool, Gym, Parking">
                        <div class="form-error" id="amenities-error"></div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="hotel-image">Hotel Image URL</label>
                        <input type="url" id="hotel-image" name="imageUrl" 
                               value="${hotel.imageUrl || ''}" 
                               placeholder="https://example.com/hotel-image.jpg">
                        <div class="form-error" id="imageUrl-error"></div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-hotel-form">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        ${this.isEditing ? 'Update Hotel' : 'Create Hotel'}
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Render booking overview
     */
    renderBookingOverview() {
        return `
            <div class="booking-overview-section">
                <div class="section-header">
                    <h2>Hotel Bookings</h2>
                    <div class="section-actions">
                        <select id="hotel-filter" class="filter-select">
                            <option value="">All Hotels</option>
                            ${this.hotels.map(hotel => 
                                `<option value="${hotel.id}">${hotel.name}</option>`
                            ).join('')}
                        </select>
                        <select id="booking-status-filter" class="filter-select">
                            <option value="">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div class="booking-stats">
                    ${this.renderBookingStats()}
                </div>

                <div class="bookings-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Guest</th>
                                <th>Hotel</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Guests</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderBookingsTable()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render booking statistics
     */
    renderBookingStats() {
        const totalBookings = this.bookings.length;
        const confirmedBookings = this.bookings.filter(b => b.status === 'Confirmed').length;
        const totalRevenue = this.bookings
            .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
            .reduce((sum, b) => sum + b.totalAmount, 0);
        const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-bookings"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${totalBookings}</h3>
                        <p>Total Bookings</p>
                        <small>${confirmedBookings} confirmed</small>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-revenue"></i>
                    </div>
                    <div class="stat-content">
                        <h3>$${this.formatCurrency(totalRevenue)}</h3>
                        <p>Total Revenue</p>
                        <small>From confirmed bookings</small>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="icon-average"></i>
                    </div>
                    <div class="stat-content">
                        <h3>$${this.formatCurrency(averageBookingValue)}</h3>
                        <p>Average Booking</p>
                        <small>Per reservation</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render bookings table
     */
    renderBookingsTable() {
        if (this.bookings.length === 0) {
            return '<tr><td colspan="9" class="no-data">No bookings found</td></tr>';
        }

        return this.bookings.map(booking => `
            <tr>
                <td>${booking.id}</td>
                <td>
                    <div>
                        <strong>${booking.guestName}</strong>
                        <br>
                        <small>${booking.guestEmail}</small>
                    </div>
                </td>
                <td>${booking.hotelName}</td>
                <td>${this.formatDate(booking.checkInDate)}</td>
                <td>${this.formatDate(booking.checkOutDate)}</td>
                <td>${booking.numberOfGuests}</td>
                <td>$${this.formatCurrency(booking.totalAmount)}</td>
                <td>
                    <span class="status-badge status-${booking.status.toLowerCase()}">
                        ${booking.status}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="hotelManagement.viewBookingDetails(${booking.id})">
                        View
                    </button>
                    ${booking.status === 'Confirmed' ? 
                        `<button class="btn btn-sm btn-warning" onclick="hotelManagement.cancelBooking(${booking.id})">
                            Cancel
                        </button>` : ''
                    }
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render analytics view
     */
    renderAnalytics() {
        return `
            <div class="analytics-section">
                <h2>Hotel Analytics</h2>
                
                <div class="analytics-cards">
                    <div class="analytics-card">
                        <h3>Occupancy Rate</h3>
                        <div class="metric-value">75%</div>
                        <p>Average across all hotels</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h3>Revenue Trend</h3>
                        <div class="metric-value">+12%</div>
                        <p>Compared to last month</p>
                    </div>
                    
                    <div class="analytics-card">
                        <h3>Guest Satisfaction</h3>
                        <div class="metric-value">4.2/5</div>
                        <p>Average rating</p>
                    </div>
                </div>

                <div class="analytics-charts">
                    <div class="chart-placeholder">
                        <h4>Revenue by Month</h4>
                        <p>Chart visualization would be implemented here</p>
                    </div>
                    
                    <div class="chart-placeholder">
                        <h4>Booking Trends</h4>
                        <p>Chart visualization would be implemented here</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation events
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });

        // Logout event
        const logoutBtn = this.container.querySelector('#management-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Add hotel button
        const addHotelBtn = this.container.querySelector('#add-hotel-btn');
        if (addHotelBtn) {
            addHotelBtn.addEventListener('click', () => this.showHotelForm());
        }

        // Modal events
        this.bindModalEvents();
        
        // Form events
        this.bindFormEvents();
        
        // Filter events
        this.bindFilterEvents();
    }

    /**
     * Bind modal events
     */
    bindModalEvents() {
        const modal = this.container.querySelector('#hotel-form-modal');
        const closeBtn = this.container.querySelector('#close-hotel-modal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideHotelForm());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideHotelForm();
                }
            });
        }
    }

    /**
     * Bind form events
     */
    bindFormEvents() {
        const form = this.container.querySelector('#hotel-form');
        const cancelBtn = this.container.querySelector('#cancel-hotel-form');
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleHotelFormSubmit(e));
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideHotelForm());
        }
    }

    /**
     * Bind filter events
     */
    bindFilterEvents() {
        const filters = this.container.querySelectorAll('.filter-select');
        filters.forEach(filter => {
            filter.addEventListener('change', () => this.applyFilters());
        });
    }

    /**
     * Switch between views
     */
    async switchView(view) {
        this.currentView = view;
        
        // Load data for the new view if needed
        if (view === 'bookings' && this.bookings.length === 0) {
            await this.loadData();
        }
        
        this.render();
        this.bindEvents();
    }

    /**
     * Show hotel form modal
     */
    showHotelForm(hotel = null) {
        this.selectedHotel = hotel;
        this.isEditing = hotel !== null;
        
        // Re-render to update form content
        this.render();
        this.bindEvents();
        
        // Show modal
        const modal = this.container.querySelector('#hotel-form-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide hotel form modal
     */
    hideHotelForm() {
        const modal = this.container.querySelector('#hotel-form-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        this.selectedHotel = null;
        this.isEditing = false;
    }

    /**
     * Handle hotel form submission
     */
    async handleHotelFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const hotelData = {
                name: formData.get('name'),
                address: formData.get('address'),
                city: formData.get('city'),
                pricePerNight: parseFloat(formData.get('pricePerNight')),
                availableRooms: parseInt(formData.get('availableRooms')),
                description: formData.get('description'),
                imageUrl: formData.get('imageUrl'),
                amenities: formData.get('amenities') ? 
                    formData.get('amenities').split(',').map(a => a.trim()) : []
            };

            // Validate form data
            if (!this.validateHotelData(hotelData)) {
                return;
            }

            // Add manager ID for new hotels
            if (!this.isEditing) {
                hotelData.managerId = this.authService.getCurrentUserData().id;
            }

            let result;
            if (this.isEditing) {
                result = await this.hotelService.updateHotel(this.selectedHotel.id, hotelData);
            } else {
                result = await this.hotelService.createHotel(hotelData);
            }

            // Reload data and update view
            await this.loadData();
            this.hideHotelForm();
            this.render();
            this.bindEvents();

            // Show success message
            this.showNotification(
                `Hotel ${this.isEditing ? 'updated' : 'created'} successfully!`, 
                'success'
            );

        } catch (error) {
            console.error('Error saving hotel:', error);
            this.showNotification(
                `Failed to ${this.isEditing ? 'update' : 'create'} hotel: ${error.message}`, 
                'error'
            );
        }
    }

    /**
     * Validate hotel data
     */
    validateHotelData(data) {
        let isValid = true;
        
        // Clear previous errors
        this.clearFormErrors();
        
        // Validate required fields
        if (!data.name || data.name.trim().length === 0) {
            this.showFieldError('name', 'Hotel name is required');
            isValid = false;
        }
        
        if (!data.address || data.address.trim().length === 0) {
            this.showFieldError('address', 'Address is required');
            isValid = false;
        }
        
        if (!data.city || data.city.trim().length === 0) {
            this.showFieldError('city', 'City is required');
            isValid = false;
        }
        
        if (!data.pricePerNight || data.pricePerNight <= 0) {
            this.showFieldError('pricePerNight', 'Valid price per night is required');
            isValid = false;
        }
        
        if (!data.availableRooms || data.availableRooms <= 0) {
            this.showFieldError('availableRooms', 'Number of available rooms must be greater than 0');
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * Clear form errors
     */
    clearFormErrors() {
        const errorElements = this.container.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const errorElement = this.container.querySelector(`#${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    /**
     * Edit hotel
     */
    async editHotel(hotelId) {
        const hotel = this.hotels.find(h => h.id === hotelId);
        if (hotel) {
            this.showHotelForm(hotel);
        }
    }

    /**
     * Delete hotel
     */
    async deleteHotel(hotelId) {
        if (!confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
            return;
        }

        try {
            await this.hotelService.deleteHotel(hotelId);
            await this.loadData();
            this.render();
            this.bindEvents();
            
            this.showNotification('Hotel deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting hotel:', error);
            this.showNotification(`Failed to delete hotel: ${error.message}`, 'error');
        }
    }

    /**
     * View hotel bookings
     */
    viewHotelBookings(hotelId) {
        // Filter bookings for the specific hotel and switch to bookings view
        this.currentView = 'bookings';
        this.render();
        this.bindEvents();
        
        // Set hotel filter
        const hotelFilter = this.container.querySelector('#hotel-filter');
        if (hotelFilter) {
            hotelFilter.value = hotelId;
            this.applyFilters();
        }
    }

    /**
     * View booking details
     */
    viewBookingDetails(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
            alert(`Booking Details:\n\nID: ${booking.id}\nGuest: ${booking.guestName}\nHotel: ${booking.hotelName}\nCheck-in: ${this.formatDate(booking.checkInDate)}\nCheck-out: ${this.formatDate(booking.checkOutDate)}\nAmount: $${this.formatCurrency(booking.totalAmount)}\nStatus: ${booking.status}`);
        }
    }

    /**
     * Cancel booking
     */
    async cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            await this.bookingService.cancelBooking(bookingId);
            await this.loadData();
            this.render();
            this.bindEvents();
            
            this.showNotification('Booking cancelled successfully!', 'success');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            this.showNotification(`Failed to cancel booking: ${error.message}`, 'error');
        }
    }

    /**
     * Apply filters to bookings
     */
    applyFilters() {
        // This would filter the displayed bookings based on selected filters
        console.log('Applying filters to bookings...');
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await this.authService.logout();
            window.location.hash = '#/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a proper notification system
        alert(message);
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Render error message
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-message">
                    <h2>Access Denied</h2>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.hash = '#/login'">
                        Go to Login
                    </button>
                </div>
            </div>
        `;
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HotelManagementComponent;
}

// Make available globally
window.HotelManagementComponent = HotelManagementComponent;


