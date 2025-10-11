/**
 * ReviewFormComponent - Handles review submission and editing
 * Provides rating input, comment validation, and form submission
 */
class ReviewFormComponent {
    constructor(container, reviewService, authService, notificationService) {
        this.container = container;
        this.reviewService = reviewService;
        this.authService = authService;
        this.notificationService = notificationService;
        this.currentReview = null;
        this.isEditing = false;
        this.hotelId = null;
        this.onSubmitCallback = null;
        this.onCancelCallback = null;
        
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
     * Set up the form for creating a new review
     * @param {number} hotelId Hotel ID
     * @param {Function} onSubmit Callback for successful submission
     * @param {Function} onCancel Callback for form cancellation
     */
    setupForCreate(hotelId, onSubmit = null, onCancel = null) {
        this.hotelId = hotelId;
        this.currentReview = null;
        this.isEditing = false;
        this.onSubmitCallback = onSubmit;
        this.onCancelCallback = onCancel;
        this.render();
    }

    /**
     * Set up the form for editing an existing review
     * @param {Review} review Review to edit
     * @param {Function} onSubmit Callback for successful submission
     * @param {Function} onCancel Callback for form cancellation
     */
    setupForEdit(review, onSubmit = null, onCancel = null) {
        this.currentReview = review;
        this.hotelId = review.hotelId;
        this.isEditing = true;
        this.onSubmitCallback = onSubmit;
        this.onCancelCallback = onCancel;
        this.render();
        this.populateForm();
    }

    /**
     * Render the component HTML
     */
    render() {
        const title = this.isEditing ? 'Edit Review' : 'Write a Review';
        const submitText = this.isEditing ? 'Update Review' : 'Submit Review';

        this.container.innerHTML = `
            <div class="review-form-container">
                <div class="review-form-header">
                    <h3>${title}</h3>
                    <button type="button" class="close-btn" id="closeReviewForm">
                        <span>&times;</span>
                    </button>
                </div>
                
                <form id="reviewForm" class="review-form">
                    <div class="form-group">
                        <label for="rating" class="form-label">
                            Rating <span class="required">*</span>
                        </label>
                        <div class="rating-input" id="ratingInput">
                            <div class="stars">
                                ${[1, 2, 3, 4, 5].map(star => `
                                    <button type="button" class="star-btn" data-rating="${star}">
                                        <span class="star">☆</span>
                                    </button>
                                `).join('')}
                            </div>
                            <div class="rating-text" id="ratingText">Click to rate</div>
                        </div>
                        <input type="hidden" id="ratingValue" name="rating" value="0">
                        <div class="error-message" id="ratingError"></div>
                    </div>

                    <div class="form-group">
                        <label for="comment" class="form-label">
                            Comment
                        </label>
                        <textarea 
                            id="comment" 
                            name="comment" 
                            class="form-control" 
                            rows="4" 
                            placeholder="Share your experience with this hotel..."
                            maxlength="1000"
                        ></textarea>
                        <div class="character-count">
                            <span id="characterCount">0</span>/1000 characters
                        </div>
                        <div class="error-message" id="commentError"></div>
                        <div class="help-text">
                            Minimum 10 characters required. Only letters, numbers, spaces, and common punctuation allowed.
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelBtn">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="submitBtn" disabled>
                            <span class="btn-text">${submitText}</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span>
                                ${this.isEditing ? 'Updating...' : 'Submitting...'}
                            </span>
                        </button>
                    </div>
                </form>

                <div class="review-guidelines">
                    <h4>Review Guidelines</h4>
                    <ul>
                        <li>Be honest and fair in your review</li>
                        <li>Focus on your personal experience</li>
                        <li>Avoid offensive language or personal attacks</li>
                        <li>Include specific details about your stay</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const form = this.container.querySelector('#reviewForm');
        const ratingInput = this.container.querySelector('#ratingInput');
        const commentInput = this.container.querySelector('#comment');
        const closeBtn = this.container.querySelector('#closeReviewForm');
        const cancelBtn = this.container.querySelector('#cancelBtn');

        // Rating input events
        ratingInput.addEventListener('click', this.handleRatingClick.bind(this));
        ratingInput.addEventListener('mouseover', this.handleRatingHover.bind(this));
        ratingInput.addEventListener('mouseleave', this.handleRatingLeave.bind(this));

        // Comment input events
        commentInput.addEventListener('input', this.handleCommentInput.bind(this));
        commentInput.addEventListener('blur', this.validateComment.bind(this));

        // Form submission
        form.addEventListener('submit', this.handleSubmit.bind(this));

        // Cancel/close events
        closeBtn.addEventListener('click', this.handleCancel.bind(this));
        cancelBtn.addEventListener('click', this.handleCancel.bind(this));

        // Real-time validation
        form.addEventListener('input', this.validateForm.bind(this));
    }

    /**
     * Handle rating star click
     * @param {Event} event Click event
     */
    handleRatingClick(event) {
        if (event.target.classList.contains('star-btn') || event.target.classList.contains('star')) {
            const button = event.target.closest('.star-btn');
            const rating = parseInt(button.dataset.rating);
            this.setRating(rating);
            this.validateForm();
        }
    }

    /**
     * Handle rating star hover
     * @param {Event} event Mouseover event
     */
    handleRatingHover(event) {
        if (event.target.classList.contains('star-btn') || event.target.classList.contains('star')) {
            const button = event.target.closest('.star-btn');
            const rating = parseInt(button.dataset.rating);
            this.highlightStars(rating);
        }
    }

    /**
     * Handle rating star mouse leave
     */
    handleRatingLeave() {
        const currentRating = parseInt(this.container.querySelector('#ratingValue').value);
        this.highlightStars(currentRating);
    }

    /**
     * Set the rating value
     * @param {number} rating Rating value (1-5)
     */
    setRating(rating) {
        const ratingValue = this.container.querySelector('#ratingValue');
        const ratingText = this.container.querySelector('#ratingText');
        
        ratingValue.value = rating;
        this.highlightStars(rating);
        
        const ratingTexts = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        
        ratingText.textContent = ratingTexts[rating] || 'Click to rate';
        
        // Clear rating error
        this.clearError('ratingError');
    }

    /**
     * Highlight stars up to the specified rating
     * @param {number} rating Rating value
     */
    highlightStars(rating) {
        const stars = this.container.querySelectorAll('.star-btn .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '★';
                star.classList.add('filled');
            } else {
                star.textContent = '☆';
                star.classList.remove('filled');
            }
        });
    }

    /**
     * Handle comment input
     * @param {Event} event Input event
     */
    handleCommentInput(event) {
        const comment = event.target.value;
        const characterCount = this.container.querySelector('#characterCount');
        
        characterCount.textContent = comment.length;
        
        // Update character count color based on length
        if (comment.length > 900) {
            characterCount.style.color = '#dc3545'; // Red
        } else if (comment.length > 800) {
            characterCount.style.color = '#ffc107'; // Yellow
        } else {
            characterCount.style.color = '#6c757d'; // Gray
        }
        
        this.validateForm();
    }

    /**
     * Validate comment field
     */
    validateComment() {
        const comment = this.container.querySelector('#comment').value.trim();
        const errors = [];

        if (comment.length > 0 && comment.length < 10) {
            errors.push('Comment must be at least 10 characters long');
        }

        if (comment.length > 1000) {
            errors.push('Comment cannot exceed 1000 characters');
        }

        if (comment.length > 0 && !/^[a-zA-Z0-9\s\.\,\!\?\-\(\)\'\""\:;]*$/.test(comment)) {
            errors.push('Comment contains invalid characters');
        }

        if (errors.length > 0) {
            this.showError('commentError', errors[0]);
            return false;
        } else {
            this.clearError('commentError');
            return true;
        }
    }

    /**
     * Validate the entire form
     * @returns {boolean} True if form is valid
     */
    validateForm() {
        const rating = parseInt(this.container.querySelector('#ratingValue').value);
        const comment = this.container.querySelector('#comment').value.trim();
        const submitBtn = this.container.querySelector('#submitBtn');

        let isValid = true;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            this.showError('ratingError', 'Please select a rating');
            isValid = false;
        } else {
            this.clearError('ratingError');
        }

        // Validate comment
        if (!this.validateComment()) {
            isValid = false;
        }

        // Enable/disable submit button
        submitBtn.disabled = !isValid;

        return isValid;
    }

    /**
     * Handle form submission
     * @param {Event} event Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        if (!this.authService.isAuthenticated()) {
            this.notificationService?.showError('You must be logged in to submit a review');
            return;
        }

        const submitBtn = this.container.querySelector('#submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        try {
            // Show loading state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';

            const formData = this.getFormData();
            let result;

            if (this.isEditing && this.currentReview) {
                result = await this.reviewService.updateReview(this.currentReview.id, formData);
                this.notificationService?.showSuccess('Review updated successfully!');
            } else {
                result = await this.reviewService.createReview(formData);
                this.notificationService?.showSuccess('Review submitted successfully!');
            }

            // Call success callback
            if (this.onSubmitCallback) {
                this.onSubmitCallback(result);
            }

            // Reset form
            this.resetForm();

        } catch (error) {
            console.error('Error submitting review:', error);
            this.notificationService?.showError(error.message || 'Failed to submit review');
        } finally {
            // Hide loading state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    /**
     * Handle form cancellation
     */
    handleCancel() {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        this.resetForm();
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        const rating = parseInt(this.container.querySelector('#ratingValue').value);
        const comment = this.container.querySelector('#comment').value.trim();

        return {
            hotelId: this.hotelId,
            rating,
            comment
        };
    }

    /**
     * Populate form with existing review data
     */
    populateForm() {
        if (!this.currentReview) return;

        this.setRating(this.currentReview.rating);
        this.container.querySelector('#comment').value = this.currentReview.comment;
        this.container.querySelector('#characterCount').textContent = this.currentReview.comment.length;
        this.validateForm();
    }

    /**
     * Reset the form
     */
    resetForm() {
        this.container.querySelector('#reviewForm').reset();
        this.container.querySelector('#ratingValue').value = '0';
        this.container.querySelector('#ratingText').textContent = 'Click to rate';
        this.container.querySelector('#characterCount').textContent = '0';
        this.highlightStars(0);
        this.clearAllErrors();
        this.container.querySelector('#submitBtn').disabled = true;
    }

    /**
     * Show error message
     * @param {string} errorId Error element ID
     * @param {string} message Error message
     */
    showError(errorId, message) {
        const errorElement = this.container.querySelector(`#${errorId}`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Clear error message
     * @param {string} errorId Error element ID
     */
    clearError(errorId) {
        const errorElement = this.container.querySelector(`#${errorId}`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    /**
     * Clear all error messages
     */
    clearAllErrors() {
        const errorElements = this.container.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
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
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewFormComponent;
}


