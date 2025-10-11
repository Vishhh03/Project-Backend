/**
 * HotelDetailComponent - Component for displaying detailed hotel information
 * Shows hotel details, amenities, location, reviews, and booking options
 */
class HotelDetailComponent {
    constructor(container, hotelService, authService, router) {
        this.container = container;
        this.hotelService = hotelService || new HotelService();
        this.authService = authService;
        this.router = router;
        
        // Component state
        this.hotel = null;
        this.reviews = [];
        this.reviewStats = null;
        this.currentImageIndex = 0;
        this.isLoading = false;
        this.error = null;
        this.reviewsPage = 1;
        this.reviewsPerPage = 5;
        this.totalReviews = 0;

        // Bind methods
        this.handleBookNow = this.handleBookNow.bind(this);
        this.handleImageNavigation = this.handleImageNavigation.bind(this);
        this.handleReviewSubmit = this.handleReviewSubmit.bind(this);
        this.handleLoadMoreReviews = this.handleLoadMoreReviews.bind(this);
    }

    /**
     * Initialize the component with hotel ID
     */
    async init(hotelId) {
        if (!hotelId) {
            this.setError('Hotel ID is required');
            return;
        }

        this.hotelId = hotelId;
        this.render();
        await this.loadHotelDetails();
        await this.loadReviews();
        this.bindEvents();
    }

    /**
     * Load hotel details
     */
    async loadHotelDetails() {
        this.setLoading(true);
        this.setError(null);

        try {
            this.hotel = await this.hotelService.getHotelById(this.hotelId);
            this.renderHotelDetails();
        } catch (error) {
            console.error('Failed to load hotel details:', error);
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Load hotel reviews
     */
    async loadReviews(page = 1) {
        try {
            const response = await fetch(`/api/reviews/hotel/${this.hotelId}?page=${page}&pageSize=${this.reviewsPerPage}`);
            
            if (response.ok) {
                const reviews = await response.json();
                
                // Get metadata from headers
                this.totalReviews = parseInt(response.headers.get('X-Total-Count')) || 0;
                const averageRating = parseFloat(response.headers.get('X-Average-Rating')) || 0;
                
                this.reviewStats = {
                    averageRating,
                    totalReviews: this.totalReviews
                };

                if (page === 1) {
                    this.reviews = reviews;
                } else {
                    this.reviews = [...this.reviews, ...reviews];
                }

                this.reviewsPage = page;
                this.renderReviews();
                this.renderReviewStats();
            }
        } catch (error) {
            console.error('Failed to load reviews:', error);
        }
    }

    /**
     * Render the component
     */
    render() {
        this.container.innerHTML = `
            <div class="hotel-detail-container">
                <!-- Loading State -->
                <div class="loading-state" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Loading hotel details...</p>
                </div>

                <!-- Error State -->
                <div class="error-state" style="display: none;">
                    <div class="error-message"></div>
                    <button class="retry-btn">Try Again</button>
                </div>

                <!-- Hotel Content -->
                <div class="hotel-content" id="hotelContent">
                    <!-- Content will be rendered here -->
                </div>
            </div>
        `;
    }

    /**
     * Render hotel details
     */
    renderHotelDetails() {
        if (!this.hotel) return;

        const hotelModel = new Hotel(this.hotel);
        const content = this.container.querySelector('#hotelContent');

        content.innerHTML = `
            <!-- Hotel Header -->
            <div class="hotel-header">
                <div class="hotel-breadcrumb">
                    <a href="#" class="breadcrumb-link" data-route="/">Home</a>
                    <span class="breadcrumb-separator">›</span>
                    <a href="#" class="breadcrumb-link" data-route="/hotels">Hotels</a>
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-current">${this.hotel.name}</span>
                </div>

                <div class="hotel-title-section">
                    <h1 class="hotel-title">${this.hotel.name}</h1>
                    <div class="hotel-location">
                        <span class="location-icon">📍</span>
                        <span>${this.hotel.address}, ${this.hotel.city}</span>
                    </div>
                    <div class="hotel-rating-header">
                        <span class="rating-stars">${hotelModel.getStarRating()}</span>
                        <span class="rating-number">${this.hotel.rating.toFixed(1)}</span>
                        <span class="review-count" id="headerReviewCount">
                            (${this.hotel.reviewCount || 0} reviews)
                        </span>
                    </div>
                </div>
            </div>

            <!-- Hotel Images Gallery -->
            <div class="hotel-gallery">
                <div class="main-image-container">
                    <img 
                        src="/assets/images/hotel-placeholder.jpg" 
                        alt="${this.hotel.name}" 
                        class="main-image"
                        id="mainImage"
                    >
                    <div class="image-navigation">
                        <button class="nav-btn prev-btn" id="prevImage">‹</button>
                        <button class="nav-btn next-btn" id="nextImage">›</button>
                    </div>
                    <div class="image-counter" id="imageCounter">1 / 5</div>
                </div>
                <div class="thumbnail-gallery">
                    ${this.renderImageThumbnails()}
                </div>
            </div>

            <!-- Hotel Info Grid -->
            <div class="hotel-info-grid">
                <!-- Main Info -->
                <div class="hotel-main-info">
                    <div class="info-section">
                        <h2>About This Hotel</h2>
                        <p class="hotel-description">
                            Experience comfort and luxury at ${this.hotel.name}, located in the heart of ${this.hotel.city}. 
                            Our hotel offers modern amenities and exceptional service to make your stay memorable.
                        </p>
                    </div>

                    <div class="info-section">
                        <h3>Hotel Amenities</h3>
                        <div class="amenities-grid">
                            ${this.renderAmenities()}
                        </div>
                    </div>

                    <div class="info-section">
                        <h3>Location & Contact</h3>
                        <div class="location-info">
                            <div class="info-item">
                                <span class="info-label">Address:</span>
                                <span class="info-value">${this.hotel.address}, ${this.hotel.city}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Available Rooms:</span>
                                <span class="info-value availability-${hotelModel.isAvailable() ? 'available' : 'unavailable'}">
                                    ${hotelModel.getAvailabilityStatus()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Booking Sidebar -->
                <div class="booking-sidebar">
                    <div class="booking-card">
                        <div class="price-section">
                            <div class="price-display">
                                <span class="price">${hotelModel.getFormattedPrice()}</span>
                                <span class="price-unit">per night</span>
                            </div>
                            <div class="rating-display">
                                <span class="rating-stars">${hotelModel.getStarRating()}</span>
                                <span class="rating-text">${this.hotel.rating.toFixed(1)}</span>
                            </div>
                        </div>

                        <div class="booking-form">
                            <div class="date-inputs">
                                <div class="date-field">
                                    <label for="checkInDate">Check-in</label>
                                    <input type="date" id="checkInDate" name="checkIn" min="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="date-field">
                                    <label for="checkOutDate">Check-out</label>
                                    <input type="date" id="checkOutDate" name="checkOut">
                                </div>
                            </div>
                            
                            <div class="guests-field">
                                <label for="guestCount">Guests</label>
                                <select id="guestCount" name="guests">
                                    <option value="1">1 Guest</option>
                                    <option value="2">2 Guests</option>
                                    <option value="3">3 Guests</option>
                                    <option value="4">4 Guests</option>
                                    <option value="5">5+ Guests</option>
                                </select>
                            </div>

                            <div class="total-price" id="totalPrice" style="display: none;">
                                <div class="price-breakdown">
                                    <span class="nights-text"></span>
                                    <span class="total-amount"></span>
                                </div>
                            </div>

                            <button 
                                class="book-now-btn ${hotelModel.isAvailable() ? '' : 'disabled'}" 
                                id="bookNowBtn"
                                ${hotelModel.isAvailable() ? '' : 'disabled'}
                            >
                                ${hotelModel.isAvailable() ? 'Book Now' : 'Fully Booked'}
                            </button>

                            <div class="booking-note">
                                <small>You won't be charged yet</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reviews Section -->
            <div class="reviews-section" id="reviewsSection">
                <div class="reviews-header">
                    <h2>Guest Reviews</h2>
                    <div class="review-stats" id="reviewStats">
                        <!-- Review stats will be rendered here -->
                    </div>
                </div>

                <!-- Write Review (for authenticated users) -->
                <div class="write-review-section" id="writeReviewSection" style="display: none;">
                    <h3>Write a Review</h3>
                    <form class="review-form" id="reviewForm">
                        <div class="rating-input">
                            <label>Your Rating:</label>
                            <div class="star-rating-input" id="starRatingInput">
                                <span class="star" data-rating="1">☆</span>
                                <span class="star" data-rating="2">☆</span>
                                <span class="star" data-rating="3">☆</span>
                                <span class="star" data-rating="4">☆</span>
                                <span class="star" data-rating="5">☆</span>
                            </div>
                            <input type="hidden" name="rating" id="ratingValue" required>
                        </div>
                        
                        <div class="comment-input">
                            <label for="reviewComment">Your Review:</label>
                            <textarea 
                                id="reviewComment" 
                                name="comment" 
                                rows="4" 
                                placeholder="Share your experience..."
                                maxlength="1000"
                                required
                            ></textarea>
                            <div class="character-count">
                                <span id="charCount">0</span>/1000 characters
                            </div>
                        </div>
                        
                        <div class="review-actions">
                            <button type="submit" class="submit-review-btn">Submit Review</button>
                            <button type="button" class="cancel-review-btn">Cancel</button>
                        </div>
                    </form>
                </div>

                <!-- Reviews List -->
                <div class="reviews-list" id="reviewsList">
                    <!-- Reviews will be rendered here -->
                </div>

                <!-- Load More Reviews -->
                <div class="load-more-section" id="loadMoreSection" style="display: none;">
                    <button class="load-more-btn" id="loadMoreBtn">Load More Reviews</button>
                </div>
            </div>
        `;

        // Set default dates
        this.setDefaultDates();
        
        // Show write review section if user is authenticated
        if (this.authService && this.authService.isAuthenticated()) {
            const writeReviewSection = this.container.querySelector('#writeReviewSection');
            writeReviewSection.style.display = 'block';
        }
    }

    /**
     * Render image thumbnails
     */
    renderImageThumbnails() {
        // For now, use placeholder images
        const images = [
            '/assets/images/hotel-placeholder.jpg',
            '/assets/images/hotel-placeholder.jpg',
            '/assets/images/hotel-placeholder.jpg',
            '/assets/images/hotel-placeholder.jpg',
            '/assets/images/hotel-placeholder.jpg'
        ];

        return images.map((src, index) => `
            <img 
                src="${src}" 
                alt="Hotel image ${index + 1}" 
                class="thumbnail ${index === 0 ? 'active' : ''}"
                data-index="${index}"
            >
        `).join('');
    }

    /**
     * Render hotel amenities
     */
    renderAmenities() {
        const amenities = [
            { icon: '📶', name: 'Free WiFi' },
            { icon: '🅿️', name: 'Free Parking' },
            { icon: '🏊', name: 'Swimming Pool' },
            { icon: '🏋️', name: 'Fitness Center' },
            { icon: '🍽️', name: 'Restaurant' },
            { icon: '🛎️', name: '24/7 Front Desk' },
            { icon: '❄️', name: 'Air Conditioning' },
            { icon: '🧳', name: 'Luggage Storage' }
        ];

        return amenities.map(amenity => `
            <div class="amenity-item">
                <span class="amenity-icon">${amenity.icon}</span>
                <span class="amenity-name">${amenity.name}</span>
            </div>
        `).join('');
    }

    /**
     * Render review statistics
     */
    renderReviewStats() {
        if (!this.reviewStats) return;

        const statsContainer = this.container.querySelector('#reviewStats');
        const headerReviewCount = this.container.querySelector('#headerReviewCount');

        statsContainer.innerHTML = `
            <div class="rating-overview">
                <div class="average-rating">
                    <span class="rating-number">${this.reviewStats.averageRating.toFixed(1)}</span>
                    <div class="rating-stars">${this.getStarRating(this.reviewStats.averageRating)}</div>
                </div>
                <div class="rating-text">
                    <span class="rating-label">Excellent</span>
                    <span class="review-count">${this.reviewStats.totalReviews} reviews</span>
                </div>
            </div>
        `;

        if (headerReviewCount) {
            headerReviewCount.textContent = `(${this.reviewStats.totalReviews} reviews)`;
        }
    }

    /**
     * Render reviews list
     */
    renderReviews() {
        const reviewsList = this.container.querySelector('#reviewsList');
        const loadMoreSection = this.container.querySelector('#loadMoreSection');

        if (this.reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <div class="no-reviews-icon">💬</div>
                    <h3>No reviews yet</h3>
                    <p>Be the first to share your experience!</p>
                </div>
            `;
            return;
        }

        const reviewsHtml = this.reviews.map(review => this.renderReviewItem(review)).join('');
        reviewsList.innerHTML = reviewsHtml;

        // Show/hide load more button
        const hasMoreReviews = this.reviews.length < this.totalReviews;
        loadMoreSection.style.display = hasMoreReviews ? 'block' : 'none';
    }

    /**
     * Render individual review item
     */
    renderReviewItem(review) {
        const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.guestName.charAt(0).toUpperCase()}
                        </div>
                        <div class="reviewer-details">
                            <div class="reviewer-name">${review.guestName}</div>
                            <div class="review-date">${reviewDate}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        <span class="rating-stars">${this.getStarRating(review.rating)}</span>
                        <span class="rating-number">${review.rating.toFixed(1)}</span>
                    </div>
                </div>
                <div class="review-content">
                    <p class="review-comment">${review.comment}</p>
                </div>
            </div>
        `;
    }

    /**
     * Get star rating display
     */
    getStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    /**
     * Set default check-in and check-out dates
     */
    setDefaultDates() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const checkInInput = this.container.querySelector('#checkInDate');
        const checkOutInput = this.container.querySelector('#checkOutDate');

        checkInInput.value = today.toISOString().split('T')[0];
        checkOutInput.value = tomorrow.toISOString().split('T')[0];
        checkOutInput.min = tomorrow.toISOString().split('T')[0];

        this.calculateTotalPrice();
    }

    /**
     * Calculate and display total price
     */
    calculateTotalPrice() {
        const checkInInput = this.container.querySelector('#checkInDate');
        const checkOutInput = this.container.querySelector('#checkOutDate');
        const totalPriceDiv = this.container.querySelector('#totalPrice');

        if (!checkInInput.value || !checkOutInput.value || !this.hotel) {
            totalPriceDiv.style.display = 'none';
            return;
        }

        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        if (nights > 0) {
            const total = nights * this.hotel.pricePerNight;
            const nightsText = nights === 1 ? '1 night' : `${nights} nights`;
            
            totalPriceDiv.querySelector('.nights-text').textContent = nightsText;
            totalPriceDiv.querySelector('.total-amount').textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(total);
            
            totalPriceDiv.style.display = 'block';
        } else {
            totalPriceDiv.style.display = 'none';
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const loadingState = this.container.querySelector('.loading-state');
        const hotelContent = this.container.querySelector('#hotelContent');
        
        if (loading) {
            loadingState.style.display = 'block';
            hotelContent.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            hotelContent.style.display = 'block';
        }
    }

    /**
     * Set error state
     */
    setError(error) {
        this.error = error;
        const errorState = this.container.querySelector('.error-state');
        const errorMessage = this.container.querySelector('.error-message');
        const hotelContent = this.container.querySelector('#hotelContent');
        
        if (error) {
            errorMessage.textContent = error;
            errorState.style.display = 'block';
            hotelContent.style.display = 'none';
        } else {
            errorState.style.display = 'none';
            hotelContent.style.display = 'block';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Breadcrumb navigation
        this.container.addEventListener('click', (event) => {
            const breadcrumbLink = event.target.closest('.breadcrumb-link');
            if (breadcrumbLink && this.router) {
                event.preventDefault();
                this.router.navigate(breadcrumbLink.dataset.route);
            }
        });

        // Image gallery navigation
        const prevBtn = this.container.querySelector('#prevImage');
        const nextBtn = this.container.querySelector('#nextImage');
        if (prevBtn) prevBtn.addEventListener('click', () => this.handleImageNavigation('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.handleImageNavigation('next'));

        // Thumbnail clicks
        this.container.addEventListener('click', (event) => {
            const thumbnail = event.target.closest('.thumbnail');
            if (thumbnail) {
                this.currentImageIndex = parseInt(thumbnail.dataset.index);
                this.updateMainImage();
            }
        });

        // Date inputs
        const checkInInput = this.container.querySelector('#checkInDate');
        const checkOutInput = this.container.querySelector('#checkOutDate');
        if (checkInInput) {
            checkInInput.addEventListener('change', (event) => {
                const checkOutInput = this.container.querySelector('#checkOutDate');
                const checkInDate = new Date(event.target.value);
                const nextDay = new Date(checkInDate);
                nextDay.setDate(nextDay.getDate() + 1);
                checkOutInput.min = nextDay.toISOString().split('T')[0];
                
                if (new Date(checkOutInput.value) <= checkInDate) {
                    checkOutInput.value = nextDay.toISOString().split('T')[0];
                }
                this.calculateTotalPrice();
            });
        }
        if (checkOutInput) {
            checkOutInput.addEventListener('change', () => this.calculateTotalPrice());
        }

        // Book now button
        const bookNowBtn = this.container.querySelector('#bookNowBtn');
        if (bookNowBtn) {
            bookNowBtn.addEventListener('click', this.handleBookNow);
        }

        // Star rating input
        this.container.addEventListener('click', (event) => {
            const star = event.target.closest('.star');
            if (star) {
                const rating = parseInt(star.dataset.rating);
                this.setStarRating(rating);
            }
        });

        // Review form
        const reviewForm = this.container.querySelector('#reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', this.handleReviewSubmit);
        }

        // Character count for review
        const reviewComment = this.container.querySelector('#reviewComment');
        if (reviewComment) {
            reviewComment.addEventListener('input', (event) => {
                const charCount = this.container.querySelector('#charCount');
                charCount.textContent = event.target.value.length;
            });
        }

        // Load more reviews
        const loadMoreBtn = this.container.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', this.handleLoadMoreReviews);
        }

        // Retry button
        const retryBtn = this.container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadHotelDetails());
        }
    }

    /**
     * Handle image navigation
     */
    handleImageNavigation(direction) {
        const totalImages = 5; // Placeholder count
        
        if (direction === 'prev') {
            this.currentImageIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : totalImages - 1;
        } else {
            this.currentImageIndex = this.currentImageIndex < totalImages - 1 ? this.currentImageIndex + 1 : 0;
        }
        
        this.updateMainImage();
    }

    /**
     * Update main image and thumbnails
     */
    updateMainImage() {
        const thumbnails = this.container.querySelectorAll('.thumbnail');
        const imageCounter = this.container.querySelector('#imageCounter');
        
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentImageIndex);
        });
        
        if (imageCounter) {
            imageCounter.textContent = `${this.currentImageIndex + 1} / ${thumbnails.length}`;
        }
    }

    /**
     * Set star rating in review form
     */
    setStarRating(rating) {
        const stars = this.container.querySelectorAll('.star');
        const ratingValue = this.container.querySelector('#ratingValue');
        
        stars.forEach((star, index) => {
            star.textContent = index < rating ? '★' : '☆';
        });
        
        ratingValue.value = rating;
    }

    /**
     * Handle book now button click
     */
    handleBookNow() {
        if (!this.hotel || !this.hotel.availableRooms) return;

        const checkIn = this.container.querySelector('#checkInDate').value;
        const checkOut = this.container.querySelector('#checkOutDate').value;
        const guests = this.container.querySelector('#guestCount').value;

        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates');
            return;
        }

        // Navigate to booking page with parameters
        if (this.router) {
            const params = new URLSearchParams({
                hotelId: this.hotel.id,
                checkIn,
                checkOut,
                guests
            });
            this.router.navigate(`/bookings/new?${params.toString()}`);
        }
    }

    /**
     * Handle review form submission
     */
    async handleReviewSubmit(event) {
        event.preventDefault();
        
        if (!this.authService || !this.authService.isAuthenticated()) {
            alert('Please log in to submit a review');
            return;
        }

        const formData = new FormData(event.target);
        const reviewData = {
            hotelId: this.hotel.id,
            rating: parseInt(formData.get('rating')),
            comment: formData.get('comment').trim()
        };

        if (!reviewData.rating) {
            alert('Please select a rating');
            return;
        }

        if (!reviewData.comment) {
            alert('Please write a review comment');
            return;
        }

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authService.getToken()}`
                },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                // Reset form
                event.target.reset();
                this.setStarRating(0);
                this.container.querySelector('#charCount').textContent = '0';
                
                // Reload reviews
                await this.loadReviews(1);
                
                alert('Review submitted successfully!');
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review. Please try again.');
        }
    }

    /**
     * Handle load more reviews
     */
    async handleLoadMoreReviews() {
        await this.loadReviews(this.reviewsPage + 1);
    }

    /**
     * Refresh the component
     */
    async refresh() {
        if (this.hotelId) {
            await this.loadHotelDetails();
            await this.loadReviews(1);
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
window.HotelDetailComponent = HotelDetailComponent;


