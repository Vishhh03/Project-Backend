/**
 * ReviewListComponent - Displays and manages hotel reviews
 * Provides review display, filtering, sorting, and management capabilities
 */
class ReviewListComponent {
    constructor(container, reviewService, authService, notificationService) {
        this.container = container;
        this.reviewService = reviewService;
        this.authService = authService;
        this.notificationService = notificationService;
        this.reviews = [];
        this.filteredReviews = [];
        this.hotelId = null;
        this.currentUser = null;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalCount = 0;
        this.averageRating = 0;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.filterRating = null;
        this.searchTerm = '';
        this.onEditCallback = null;
        this.onReplyCallback = null;
        
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
        this.bindEvents();
    }

    /**
     * Load reviews for a specific hotel
     * @param {number} hotelId Hotel ID
     * @param {Object} options Loading options
     */
    async loadReviews(hotelId, options = {}) {
        this.hotelId = hotelId;
        const {
            page = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            minRating = null,
            maxRating = null,
            searchTerm = ''
        } = options;

        this.currentPage = page;
        this.pageSize = pageSize;
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.filterRating = minRating;
        this.searchTerm = searchTerm;

        try {
            this.showLoading();
            
            const result = await this.reviewService.getReviewsByHotel(hotelId, {
                page,
                pageSize,
                sortBy,
                sortOrder,
                minRating,
                maxRating
            });

            this.reviews = result.reviews;
            this.totalCount = result.totalCount;
            this.averageRating = result.averageRating;

            // Apply client-side search if needed
            if (searchTerm) {
                this.filteredReviews = this.reviewService.searchReviews(this.reviews, searchTerm);
            } else {
                this.filteredReviews = this.reviews;
            }

            this.renderReviews();
            this.renderPagination();
            this.renderStats();
            
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showError('Failed to load reviews');
        }
    }

    /**
     * Set callbacks for review actions
     * @param {Function} onEdit Callback for edit action
     * @param {Function} onReply Callback for reply action
     */
    setCallbacks(onEdit = null, onReply = null) {
        this.onEditCallback = onEdit;
        this.onReplyCallback = onReply;
    }

    /**
     * Render the component HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="review-list-container">
                <div class="review-list-header">
                    <div class="review-stats" id="reviewStats">
                        <!-- Stats will be populated dynamically -->
                    </div>
                    
                    <div class="review-controls">
                        <div class="review-filters">
                            <div class="filter-group">
                                <label for="sortSelect">Sort by:</label>
                                <select id="sortSelect" class="form-control">
                                    <option value="createdAt-desc">Newest First</option>
                                    <option value="createdAt-asc">Oldest First</option>
                                    <option value="rating-desc">Highest Rating</option>
                                    <option value="rating-asc">Lowest Rating</option>
                                    <option value="userName-asc">Name A-Z</option>
                                    <option value="userName-desc">Name Z-A</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="ratingFilter">Filter by rating:</label>
                                <select id="ratingFilter" class="form-control">
                                    <option value="">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="2">2+ Stars</option>
                                    <option value="1">1+ Stars</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="searchInput">Search reviews:</label>
                                <input 
                                    type="text" 
                                    id="searchInput" 
                                    class="form-control" 
                                    placeholder="Search comments or reviewers..."
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <div class="review-list-content">
                    <div class="loading-state" id="loadingState" style="display: none;">
                        <div class="spinner-large"></div>
                        <p>Loading reviews...</p>
                    </div>
                    
                    <div class="error-state" id="errorState" style="display: none;">
                        <div class="error-icon">⚠️</div>
                        <p class="error-message"></p>
                        <button class="btn btn-primary" id="retryBtn">Try Again</button>
                    </div>
                    
                    <div class="empty-state" id="emptyState" style="display: none;">
                        <div class="empty-icon">📝</div>
                        <h3>No Reviews Yet</h3>
                        <p>Be the first to share your experience with this hotel!</p>
                    </div>
                    
                    <div class="reviews-container" id="reviewsContainer">
                        <!-- Reviews will be populated dynamically -->
                    </div>
                </div>

                <div class="review-pagination" id="reviewPagination">
                    <!-- Pagination will be populated dynamically -->
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const sortSelect = this.container.querySelector('#sortSelect');
        const ratingFilter = this.container.querySelector('#ratingFilter');
        const searchInput = this.container.querySelector('#searchInput');
        const retryBtn = this.container.querySelector('#retryBtn');

        // Sort change
        sortSelect.addEventListener('change', this.handleSortChange.bind(this));

        // Rating filter change
        ratingFilter.addEventListener('change', this.handleRatingFilterChange.bind(this));

        // Search input with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', (event) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearchChange(event);
            }, 300);
        });

        // Retry button
        retryBtn.addEventListener('click', this.handleRetry.bind(this));

        // Review actions (delegated event handling)
        this.container.addEventListener('click', this.handleReviewAction.bind(this));
    }

    /**
     * Handle sort change
     * @param {Event} event Change event
     */
    handleSortChange(event) {
        const [sortBy, sortOrder] = event.target.value.split('-');
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.applyFiltersAndSort();
    }

    /**
     * Handle rating filter change
     * @param {Event} event Change event
     */
    handleRatingFilterChange(event) {
        this.filterRating = event.target.value ? parseInt(event.target.value) : null;
        this.applyFiltersAndSort();
    }

    /**
     * Handle search change
     * @param {Event} event Input event
     */
    handleSearchChange(event) {
        this.searchTerm = event.target.value.trim();
        this.applyFiltersAndSort();
    }

    /**
     * Handle retry button click
     */
    handleRetry() {
        if (this.hotelId) {
            this.loadReviews(this.hotelId);
        }
    }

    /**
     * Handle review actions (edit, delete, etc.)
     * @param {Event} event Click event
     */
    async handleReviewAction(event) {
        const action = event.target.dataset.action;
        const reviewId = event.target.dataset.reviewId;

        if (!action || !reviewId) return;

        const review = this.reviews.find(r => r.id === parseInt(reviewId));
        if (!review) return;

        switch (action) {
            case 'edit':
                if (this.onEditCallback) {
                    this.onEditCallback(review);
                }
                break;
            case 'delete':
                await this.handleDeleteReview(review);
                break;
            case 'reply':
                if (this.onReplyCallback) {
                    this.onReplyCallback(review);
                }
                break;
        }
    }

    /**
     * Handle review deletion
     * @param {Review} review Review to delete
     */
    async handleDeleteReview(review) {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            await this.reviewService.deleteReview(review.id);
            this.notificationService?.showSuccess('Review deleted successfully');
            
            // Remove from local arrays
            this.reviews = this.reviews.filter(r => r.id !== review.id);
            this.filteredReviews = this.filteredReviews.filter(r => r.id !== review.id);
            this.totalCount--;
            
            // Re-render
            this.renderReviews();
            this.renderStats();
            
        } catch (error) {
            console.error('Error deleting review:', error);
            this.notificationService?.showError('Failed to delete review');
        }
    }

    /**
     * Apply filters and sorting to reviews
     */
    applyFiltersAndSort() {
        let filtered = [...this.reviews];

        // Apply rating filter
        if (this.filterRating !== null) {
            filtered = this.reviewService.filterByRating(filtered, this.filterRating);
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = this.reviewService.searchReviews(filtered, this.searchTerm);
        }

        // Apply sorting
        filtered = this.reviewService.sortReviews(filtered, this.sortBy, this.sortOrder);

        this.filteredReviews = filtered;
        this.renderReviews();
    }

    /**
     * Render reviews list
     */
    renderReviews() {
        const container = this.container.querySelector('#reviewsContainer');
        
        if (this.filteredReviews.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideStates();

        container.innerHTML = this.filteredReviews.map(review => this.renderReviewCard(review)).join('');
    }

    /**
     * Render individual review card
     * @param {Review} review Review instance
     * @returns {string} HTML string
     */
    renderReviewCard(review) {
        const isOwner = this.currentUser && review.belongsToUser(this.currentUser.id);
        const canManage = isOwner || (this.currentUser && this.currentUser.role === 'Admin');

        return `
            <div class="review-card" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div class="reviewer-details">
                            <h4 class="reviewer-name">${this.escapeHtml(review.userName)}</h4>
                            <div class="review-date">${review.getFormattedDate()}</div>
                        </div>
                    </div>
                    
                    <div class="review-rating">
                        <div class="stars">${review.getStarRating()}</div>
                        <div class="rating-number">${review.rating}/5</div>
                    </div>
                </div>

                <div class="review-content">
                    <div class="review-comment">
                        ${review.comment ? this.escapeHtml(review.comment) : '<em>No comment provided</em>'}
                    </div>
                </div>

                ${canManage ? `
                    <div class="review-actions">
                        ${isOwner ? `
                            <button class="btn btn-sm btn-outline" data-action="edit" data-review-id="${review.id}">
                                Edit
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline btn-danger" data-action="delete" data-review-id="${review.id}">
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        const container = this.container.querySelector('#reviewPagination');
        
        if (this.totalCount <= this.pageSize) {
            container.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        const currentPage = this.currentPage;

        let paginationHtml = '<div class="pagination">';

        // Previous button
        if (currentPage > 1) {
            paginationHtml += `
                <button class="pagination-btn" data-page="${currentPage - 1}">
                    Previous
                </button>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHtml += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHtml += `
                <button class="pagination-btn" data-page="${currentPage + 1}">
                    Next
                </button>
            `;
        }

        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;

        // Bind pagination events
        container.addEventListener('click', this.handlePaginationClick.bind(this));
    }

    /**
     * Handle pagination click
     * @param {Event} event Click event
     */
    handlePaginationClick(event) {
        const page = event.target.dataset.page;
        if (page && this.hotelId) {
            this.loadReviews(this.hotelId, {
                page: parseInt(page),
                pageSize: this.pageSize,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                minRating: this.filterRating,
                searchTerm: this.searchTerm
            });
        }
    }

    /**
     * Render review statistics
     */
    renderStats() {
        const container = this.container.querySelector('#reviewStats');
        
        if (this.reviews.length === 0) {
            container.innerHTML = '';
            return;
        }

        const distribution = this.reviewService.getRatingDistribution(this.reviews);
        
        container.innerHTML = `
            <div class="review-summary">
                <div class="average-rating">
                    <div class="rating-number">${this.averageRating.toFixed(1)}</div>
                    <div class="rating-stars">${this.getStarRating(this.averageRating)}</div>
                    <div class="rating-count">${this.totalCount} review${this.totalCount !== 1 ? 's' : ''}</div>
                </div>
                
                <div class="rating-distribution">
                    ${[5, 4, 3, 2, 1].map(rating => {
                        const count = distribution[rating];
                        const percentage = this.totalCount > 0 ? (count / this.totalCount) * 100 : 0;
                        return `
                            <div class="rating-bar">
                                <span class="rating-label">${rating} ★</span>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="rating-count">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get star rating display for average rating
     * @param {number} rating Average rating
     * @returns {string} Star rating HTML
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
     * Show loading state
     */
    showLoading() {
        this.hideStates();
        this.container.querySelector('#loadingState').style.display = 'block';
    }

    /**
     * Show error state
     * @param {string} message Error message
     */
    showError(message) {
        this.hideStates();
        const errorState = this.container.querySelector('#errorState');
        errorState.querySelector('.error-message').textContent = message;
        errorState.style.display = 'block';
    }

    /**
     * Show empty state
     */
    showEmpty() {
        this.hideStates();
        this.container.querySelector('#emptyState').style.display = 'block';
    }

    /**
     * Hide all states
     */
    hideStates() {
        this.container.querySelector('#loadingState').style.display = 'none';
        this.container.querySelector('#errorState').style.display = 'none';
        this.container.querySelector('#emptyState').style.display = 'none';
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh reviews
     */
    async refresh() {
        if (this.hotelId) {
            await this.loadReviews(this.hotelId, {
                page: this.currentPage,
                pageSize: this.pageSize,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                minRating: this.filterRating,
                searchTerm: this.searchTerm
            });
        }
    }

    /**
     * Add a new review to the list
     * @param {Review} review New review
     */
    addReview(review) {
        this.reviews.unshift(review);
        this.totalCount++;
        this.applyFiltersAndSort();
        this.renderStats();
    }

    /**
     * Update an existing review in the list
     * @param {Review} updatedReview Updated review
     */
    updateReview(updatedReview) {
        const index = this.reviews.findIndex(r => r.id === updatedReview.id);
        if (index !== -1) {
            this.reviews[index] = updatedReview;
            this.applyFiltersAndSort();
            this.renderStats();
        }
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
    module.exports = ReviewListComponent;
}


