/**
 * ReviewComponent - Main review component that combines form and list
 * Manages the overall review functionality for a hotel
 */
class ReviewComponent {
    constructor(container, reviewService, authService, notificationService) {
        this.container = container;
        this.reviewService = reviewService;
        this.authService = authService;
        this.notificationService = notificationService;
        this.hotelId = null;
        this.reviewFormComponent = null;
        this.reviewListComponent = null;
        this.currentUser = null;
        this.userReview = null;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        if (this.authService.isAuthenticated()) {
            try {
                this.currentUser = await this.authService.getCurrentUser();
            } catch (error) {
                console.error('Error getting current user:', error);
            }
        }
        
        this.render();
        this.initializeSubComponents();
    }

    /**
     * Load reviews for a specific hotel
     * @param {number} hotelId Hotel ID
     */
    async loadHotelReviews(hotelId) {
        this.hotelId = hotelId;
        
        // Check if user has already reviewed this hotel
        if (this.currentUser) {
            try {
                this.userReview = await this.reviewService.getUserReviewForHotel(hotelId);
            } catch (error) {
                console.error('Error checking user review:', error);
            }
        }
        
        // Update UI based on user review status
        this.updateReviewButton();
        
        // Load reviews in the list component
        if (this.reviewListComponent) {
            await this.reviewListComponent.loadReviews(hotelId);
        }
    }

    /**
     * Render the component HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="review-component">
                <div class="review-header">
                    <h2>Reviews & Ratings</h2>
                    <div class="review-actions" id="reviewActions">
                        <!-- Review actions will be populated dynamically -->
                    </div>
                </div>

                <!-- Review Form Modal -->
                <div class="review-modal" id="reviewModal" style="display: none;">
                    <div class="modal-backdrop" id="modalBackdrop"></div>
                    <div class="modal-content">
                        <div id="reviewFormContainer">
                            <!-- Review form will be rendered here -->
                        </div>
                    </div>
                </div>

                <!-- Review List -->
                <div id="reviewListContainer">
                    <!-- Review list will be rendered here -->
                </div>
            </div>
        `;
    }

    /**
     * Initialize sub-components
     */
    initializeSubComponents() {
        // Initialize review form component
        const formContainer = this.container.querySelector('#reviewFormContainer');
        this.reviewFormComponent = new ReviewFormComponent(
            formContainer,
            this.reviewService,
            this.authService,
            this.notificationService
        );

        // Initialize review list component
        const listContainer = this.container.querySelector('#reviewListContainer');
        this.reviewListComponent = new ReviewListComponent(
            listContainer,
            this.reviewService,
            this.authService,
            this.notificationService
        );

        // Set up callbacks
        this.reviewListComponent.setCallbacks(
            this.handleEditReview.bind(this),
            this.handleReplyToReview.bind(this)
        );

        this.bindEvents();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const modal = this.container.querySelector('#reviewModal');
        const backdrop = this.container.querySelector('#modalBackdrop');

        // Modal backdrop click to close
        backdrop.addEventListener('click', this.closeReviewModal.bind(this));

        // Escape key to close modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                this.closeReviewModal();
            }
        });

        // Review actions (delegated event handling)
        this.container.addEventListener('click', this.handleReviewAction.bind(this));
    }

    /**
     * Handle review actions
     * @param {Event} event Click event
     */
    handleReviewAction(event) {
        const action = event.target.dataset.action;

        switch (action) {
            case 'write-review':
                this.showWriteReviewForm();
                break;
            case 'edit-my-review':
                this.showEditReviewForm();
                break;
        }
    }

    /**
     * Update review button based on user status
     */
    updateReviewButton() {
        const actionsContainer = this.container.querySelector('#reviewActions');
        
        if (!this.authService.isAuthenticated()) {
            actionsContainer.innerHTML = `
                <p class="login-prompt">
                    <a href="#/login" class="btn btn-primary">Login to Write a Review</a>
                </p>
            `;
            return;
        }

        if (this.userReview) {
            actionsContainer.innerHTML = `
                <div class="user-review-status">
                    <p>You have already reviewed this hotel</p>
                    <button class="btn btn-outline" data-action="edit-my-review">
                        Edit My Review
                    </button>
                </div>
            `;
        } else {
            actionsContainer.innerHTML = `
                <button class="btn btn-primary" data-action="write-review">
                    Write a Review
                </button>
            `;
        }
    }

    /**
     * Show write review form
     */
    async showWriteReviewForm() {
        if (!this.authService.isAuthenticated()) {
            this.notificationService?.showError('Please login to write a review');
            return;
        }

        // Check if user can review this hotel
        const canReview = await this.reviewService.canUserReviewHotel(this.hotelId);
        if (!canReview) {
            this.notificationService?.showError('You can only review hotels you have stayed at');
            return;
        }

        // Check if user has already reviewed
        if (this.userReview) {
            this.notificationService?.showError('You have already reviewed this hotel. You can edit your existing review.');
            return;
        }

        this.reviewFormComponent.setupForCreate(
            this.hotelId,
            this.handleReviewSubmitted.bind(this),
            this.closeReviewModal.bind(this)
        );

        this.showReviewModal();
    }

    /**
     * Show edit review form
     */
    showEditReviewForm() {
        if (!this.userReview) {
            this.notificationService?.showError('No review found to edit');
            return;
        }

        this.reviewFormComponent.setupForEdit(
            this.userReview,
            this.handleReviewUpdated.bind(this),
            this.closeReviewModal.bind(this)
        );

        this.showReviewModal();
    }

    /**
     * Handle edit review from list
     * @param {Review} review Review to edit
     */
    handleEditReview(review) {
        this.reviewFormComponent.setupForEdit(
            review,
            this.handleReviewUpdated.bind(this),
            this.closeReviewModal.bind(this)
        );

        this.showReviewModal();
    }

    /**
     * Handle reply to review (placeholder for future implementation)
     * @param {Review} review Review to reply to
     */
    handleReplyToReview(review) {
        this.notificationService?.showInfo('Reply functionality coming soon!');
    }

    /**
     * Handle successful review submission
     * @param {Review} review Submitted review
     */
    handleReviewSubmitted(review) {
        this.userReview = review;
        this.updateReviewButton();
        this.reviewListComponent.addReview(review);
        this.closeReviewModal();
        
        // Scroll to the new review
        setTimeout(() => {
            const reviewCard = this.container.querySelector(`[data-review-id="${review.id}"]`);
            if (reviewCard) {
                reviewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reviewCard.style.animation = 'highlight 2s ease-in-out';
            }
        }, 100);
    }

    /**
     * Handle successful review update
     * @param {Review} review Updated review
     */
    handleReviewUpdated(review) {
        if (this.userReview && this.userReview.id === review.id) {
            this.userReview = review;
        }
        
        this.reviewListComponent.updateReview(review);
        this.closeReviewModal();
        
        // Scroll to the updated review
        setTimeout(() => {
            const reviewCard = this.container.querySelector(`[data-review-id="${review.id}"]`);
            if (reviewCard) {
                reviewCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reviewCard.style.animation = 'highlight 2s ease-in-out';
            }
        }, 100);
    }

    /**
     * Show review modal
     */
    showReviewModal() {
        const modal = this.container.querySelector('#reviewModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on the first form element
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, button');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    /**
     * Close review modal
     */
    closeReviewModal() {
        const modal = this.container.querySelector('#reviewModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * Refresh all reviews
     */
    async refresh() {
        if (this.hotelId) {
            await this.loadHotelReviews(this.hotelId);
        }
    }

    /**
     * Get review statistics
     * @returns {Object} Review statistics
     */
    getReviewStats() {
        if (!this.reviewListComponent || !this.reviewListComponent.reviews) {
            return {
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const reviews = this.reviewListComponent.reviews;
        return {
            totalReviews: reviews.length,
            averageRating: this.reviewService.calculateAverageRating(reviews),
            ratingDistribution: this.reviewService.getRatingDistribution(reviews)
        };
    }

    /**
     * Show the component
     */
    show() {
        this.container.style.display = 'block';
    }

    /**
     * Hide the component
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.reviewFormComponent) {
            this.reviewFormComponent.destroy();
        }
        if (this.reviewListComponent) {
            this.reviewListComponent.destroy();
        }
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewComponent;
}


