/**
 * BookingFormComponent - Handles booking creation with date picker and validation
 */
class BookingFormComponent {
    constructor(container, bookingService, hotelService, authService, loyaltyService = null) {
        this.container = container;
        this.bookingService = bookingService;
        this.hotelService = hotelService;
        this.authService = authService;
        this.loyaltyService = loyaltyService;
        this.currentHotel = null;
        this.priceCalculation = null;
        this.loyaltyAccount = null;
        this.isCalculating = false;
        
        this.bindMethods();
    }

    bindMethods() {
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleGuestChange = this.handleGuestChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.calculatePrice = this.calculatePrice.bind(this);
    }

    /**
     * Initialize the component with hotel data
     * @param {Object} hotel - Hotel information
     */
    async init(hotel) {
        this.currentHotel = hotel;
        
        // Load loyalty account if user is authenticated and loyalty service is available
        if (this.authService.isAuthenticated() && this.loyaltyService) {
            try {
                this.loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            } catch (error) {
                console.warn('Could not load loyalty account:', error);
            }
        }
        
        this.render();
        this.bindEvents();
        this.setMinDate();
    }

    render() {
        if (!this.currentHotel) {
            this.container.innerHTML = '<div class="error">Hotel information not available</div>';
            return;
        }

        this.container.innerHTML = `
            <div class="booking-form-container">
                <div class="booking-form-header">
                    <h2>Book Your Stay</h2>
                    <div class="hotel-info">
                        <h3>${this.currentHotel.name}</h3>
                        <p class="hotel-location">${this.currentHotel.city}</p>
                        <p class="hotel-price">$${this.currentHotel.pricePerNight}/night</p>
                    </div>
                </div>

                <form id="booking-form" class="booking-form">
                    <div class="form-section">
                        <h4>Guest Information</h4>
                        
                        <div class="form-group">
                            <label for="guest-name">Full Name *</label>
                            <input 
                                type="text" 
                                id="guest-name" 
                                name="guestName" 
                                required
                                placeholder="Enter your full name"
                            >
                            <div class="error-message" id="guest-name-error"></div>
                        </div>

                        <div class="form-group">
                            <label for="guest-email">Email Address *</label>
                            <input 
                                type="email" 
                                id="guest-email" 
                                name="guestEmail" 
                                required
                                placeholder="Enter your email address"
                            >
                            <div class="error-message" id="guest-email-error"></div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Booking Details</h4>
                        
                        <div class="date-group">
                            <div class="form-group">
                                <label for="check-in-date">Check-in Date *</label>
                                <input 
                                    type="date" 
                                    id="check-in-date" 
                                    name="checkInDate" 
                                    required
                                >
                                <div class="error-message" id="check-in-date-error"></div>
                            </div>

                            <div class="form-group">
                                <label for="check-out-date">Check-out Date *</label>
                                <input 
                                    type="date" 
                                    id="check-out-date" 
                                    name="checkOutDate" 
                                    required
                                >
                                <div class="error-message" id="check-out-date-error"></div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="number-of-guests">Number of Guests *</label>
                            <select id="number-of-guests" name="numberOfGuests" required>
                                <option value="">Select number of guests</option>
                                <option value="1">1 Guest</option>
                                <option value="2">2 Guests</option>
                                <option value="3">3 Guests</option>
                                <option value="4">4 Guests</option>
                                <option value="5">5 Guests</option>
                                <option value="6">6 Guests</option>
                                <option value="7">7 Guests</option>
                                <option value="8">8 Guests</option>
                                <option value="9">9 Guests</option>
                                <option value="10">10 Guests</option>
                            </select>
                            <div class="error-message" id="number-of-guests-error"></div>
                        </div>
                    </div>

                    <div class="price-summary" id="price-summary" style="display: none;">
                        <h4>Booking Summary</h4>
                        <div class="price-breakdown">
                            <div class="price-line">
                                <span class="price-label">Nights:</span>
                                <span class="price-value" id="nights-count">-</span>
                            </div>
                            <div class="price-line">
                                <span class="price-label">Rate per night:</span>
                                <span class="price-value">$${this.currentHotel.pricePerNight}</span>
                            </div>
                            <div class="price-line">
                                <span class="price-label">Guests:</span>
                                <span class="price-value" id="guests-count">-</span>
                            </div>
                            <div class="price-line total">
                                <span class="price-label">Total Amount:</span>
                                <span class="price-value" id="total-amount">$0</span>
                            </div>
                        </div>
                        <div class="availability-status" id="availability-status"></div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-booking">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="submit-booking" disabled>
                            <span class="btn-text">Book Now</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span>
                                Processing...
                            </span>
                        </button>
                    </div>

                    <div class="form-message" id="form-message"></div>
                </form>
            </div>
        `;
    }

    bindEvents() {
        const form = document.getElementById('booking-form');
        const checkInDate = document.getElementById('check-in-date');
        const checkOutDate = document.getElementById('check-out-date');
        const numberOfGuests = document.getElementById('number-of-guests');
        const cancelBtn = document.getElementById('cancel-booking');

        // Form submission
        form.addEventListener('submit', this.handleSubmit);

        // Date changes
        checkInDate.addEventListener('change', this.handleDateChange);
        checkOutDate.addEventListener('change', this.handleDateChange);

        // Guest count change
        numberOfGuests.addEventListener('change', this.handleGuestChange);

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            window.history.back();
        });

        // Real-time validation
        this.setupRealTimeValidation();

        // Pre-fill user data if authenticated
        this.prefillUserData();
    }

    setupRealTimeValidation() {
        const inputs = this.container.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    async prefillUserData() {
        if (this.authService.isAuthenticated()) {
            try {
                const user = await this.authService.getCurrentUser();
                if (user) {
                    const guestNameInput = document.getElementById('guest-name');
                    const guestEmailInput = document.getElementById('guest-email');
                    
                    if (guestNameInput && user.name) {
                        guestNameInput.value = user.name;
                    }
                    
                    if (guestEmailInput && user.email) {
                        guestEmailInput.value = user.email;
                    }
                }
            } catch (error) {
                console.warn('Could not prefill user data:', error);
            }
        }
    }

    setMinDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const checkInDate = document.getElementById('check-in-date');
        const checkOutDate = document.getElementById('check-out-date');
        
        checkInDate.min = today.toISOString().split('T')[0];
        checkOutDate.min = tomorrow.toISOString().split('T')[0];
    }

    async handleDateChange() {
        const checkInDate = document.getElementById('check-in-date').value;
        const checkOutDate = document.getElementById('check-out-date').value;
        
        if (checkInDate && checkOutDate) {
            // Update minimum checkout date
            const checkIn = new Date(checkInDate);
            const minCheckOut = new Date(checkIn);
            minCheckOut.setDate(minCheckOut.getDate() + 1);
            
            document.getElementById('check-out-date').min = minCheckOut.toISOString().split('T')[0];
            
            // Validate date range
            if (new Date(checkOutDate) <= new Date(checkInDate)) {
                this.showFieldError('check-out-date', 'Check-out date must be after check-in date');
                return;
            }
            
            // Calculate price if all required fields are filled
            await this.calculatePrice();
        }
    }

    async handleGuestChange() {
        await this.calculatePrice();
    }

    async calculatePrice() {
        const checkInDate = document.getElementById('check-in-date').value;
        const checkOutDate = document.getElementById('check-out-date').value;
        const numberOfGuests = document.getElementById('number-of-guests').value;
        
        if (!checkInDate || !checkOutDate || !numberOfGuests) {
            this.hidePriceSummary();
            return;
        }

        if (this.isCalculating) return;
        
        try {
            this.isCalculating = true;
            this.showCalculatingState();
            
            // Calculate nights
            const nights = this.calculateNights(checkInDate, checkOutDate);
            
            // Get price calculation from service
            const calculation = await this.bookingService.calculateBookingCost(
                this.currentHotel.id,
                checkInDate,
                checkOutDate,
                parseInt(numberOfGuests)
            );
            
            this.priceCalculation = calculation;
            this.updatePriceSummary(nights, numberOfGuests, calculation);
            
            // Check availability
            await this.checkAvailability(checkInDate, checkOutDate);
            
        } catch (error) {
            console.error('Error calculating price:', error);
            this.showFormMessage('Error calculating price. Please try again.', 'error');
        } finally {
            this.isCalculating = false;
            this.hideCalculatingState();
        }
    }

    async checkAvailability(checkInDate, checkOutDate) {
        try {
            const availability = await this.bookingService.checkAvailability(
                this.currentHotel.id,
                checkInDate,
                checkOutDate
            );
            
            this.updateAvailabilityStatus(availability);
            
        } catch (error) {
            console.error('Error checking availability:', error);
            this.updateAvailabilityStatus({ available: false, message: 'Unable to check availability' });
        }
    }

    calculateNights(checkInDate, checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut - checkIn;
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    updatePriceSummary(nights, guests, calculation) {
        document.getElementById('nights-count').textContent = nights === 1 ? '1 night' : `${nights} nights`;
        document.getElementById('guests-count').textContent = guests === '1' ? '1 guest' : `${guests} guests`;
        document.getElementById('total-amount').textContent = `$${calculation.totalAmount || 0}`;
        
        this.showPriceSummary();
    }

    updateAvailabilityStatus(availability) {
        const statusElement = document.getElementById('availability-status');
        const submitButton = document.getElementById('submit-booking');
        
        if (availability.available) {
            statusElement.innerHTML = '<div class="availability-success">✓ Available for booking</div>';
            submitButton.disabled = false;
        } else {
            statusElement.innerHTML = `<div class="availability-error">✗ ${availability.message || 'Not available for selected dates'}</div>`;
            submitButton.disabled = true;
        }
    }

    showPriceSummary() {
        document.getElementById('price-summary').style.display = 'block';
    }

    hidePriceSummary() {
        document.getElementById('price-summary').style.display = 'none';
    }

    showCalculatingState() {
        const statusElement = document.getElementById('availability-status');
        statusElement.innerHTML = '<div class="calculating">Checking availability and calculating price...</div>';
    }

    hideCalculatingState() {
        // This will be replaced by actual availability status
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.authService.isAuthenticated()) {
            this.showFormMessage('Please log in to make a booking.', 'error');
            return;
        }

        const formData = new FormData(event.target);
        const bookingData = {
            guestName: formData.get('guestName'),
            guestEmail: formData.get('guestEmail'),
            hotelId: this.currentHotel.id,
            checkInDate: formData.get('checkInDate'),
            checkOutDate: formData.get('checkOutDate'),
            numberOfGuests: parseInt(formData.get('numberOfGuests'))
        };

        // Validate form
        if (!this.validateForm(bookingData)) {
            return;
        }

        try {
            this.setSubmitButtonLoading(true);
            
            const booking = await this.bookingService.createBooking(bookingData);
            
            this.showFormMessage('Booking created successfully!', 'success');
            
            // Redirect to booking confirmation or bookings list
            setTimeout(() => {
                window.location.hash = `#/bookings/${booking.id}`;
            }, 2000);
            
        } catch (error) {
            console.error('Error creating booking:', error);
            this.showFormMessage(error.message || 'Failed to create booking. Please try again.', 'error');
        } finally {
            this.setSubmitButtonLoading(false);
        }
    }

    validateForm(bookingData) {
        let isValid = true;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Validate required fields
        if (!bookingData.guestName || bookingData.guestName.trim().length === 0) {
            this.showFieldError('guest-name', 'Guest name is required');
            isValid = false;
        }
        
        if (!bookingData.guestEmail || bookingData.guestEmail.trim().length === 0) {
            this.showFieldError('guest-email', 'Email address is required');
            isValid = false;
        } else if (!this.isValidEmail(bookingData.guestEmail)) {
            this.showFieldError('guest-email', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!bookingData.checkInDate) {
            this.showFieldError('check-in-date', 'Check-in date is required');
            isValid = false;
        }
        
        if (!bookingData.checkOutDate) {
            this.showFieldError('check-out-date', 'Check-out date is required');
            isValid = false;
        }
        
        if (!bookingData.numberOfGuests || bookingData.numberOfGuests < 1) {
            this.showFieldError('number-of-guests', 'Please select number of guests');
            isValid = false;
        }
        
        // Validate date range
        if (bookingData.checkInDate && bookingData.checkOutDate) {
            const checkIn = new Date(bookingData.checkInDate);
            const checkOut = new Date(bookingData.checkOutDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (checkIn < today) {
                this.showFieldError('check-in-date', 'Check-in date cannot be in the past');
                isValid = false;
            }
            
            if (checkOut <= checkIn) {
                this.showFieldError('check-out-date', 'Check-out date must be after check-in date');
                isValid = false;
            }
        }
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        switch (fieldName) {
            case 'guestName':
                if (!value) {
                    this.showFieldError(field.id, 'Guest name is required');
                    return false;
                }
                break;
                
            case 'guestEmail':
                if (!value) {
                    this.showFieldError(field.id, 'Email address is required');
                    return false;
                } else if (!this.isValidEmail(value)) {
                    this.showFieldError(field.id, 'Please enter a valid email address');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(field);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (field) {
            field.classList.add('error');
        }
    }

    clearFieldError(field) {
        const fieldId = typeof field === 'string' ? field : field.id;
        const errorElement = document.getElementById(`${fieldId}-error`);
        const fieldElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (fieldElement) {
            fieldElement.classList.remove('error');
        }
    }

    clearAllErrors() {
        const errorElements = this.container.querySelectorAll('.error-message');
        const fieldElements = this.container.querySelectorAll('.error');
        
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
        
        fieldElements.forEach(element => {
            element.classList.remove('error');
        });
    }

    showFormMessage(message, type = 'info') {
        const messageElement = document.getElementById('form-message');
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        }
    }

    setSubmitButtonLoading(loading) {
        const button = document.getElementById('submit-booking');
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

    destroy() {
        // Clean up event listeners and references
        this.container.innerHTML = '';
        this.currentHotel = null;
        this.priceCalculation = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingFormComponent;
}


