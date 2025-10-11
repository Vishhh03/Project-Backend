/**
 * HotelListComponent - Component for displaying hotel listings with search and filtering
 * Supports grid/list view toggle, search, filtering, sorting, and pagination
 */
class HotelListComponent {
    constructor(container, hotelService, router) {
        this.container = container;
        this.hotelService = hotelService || new HotelService();
        this.router = router;
        
        // Component state
        this.hotels = [];
        this.filteredHotels = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.isLoading = false;
        this.error = null;
        
        // Search and filter state
        this.searchCriteria = {
            city: '',
            maxPrice: null,
            minRating: null,
            sortBy: 'name',
            sortOrder: 'asc'
        };

        // Bind methods
        this.handleSearch = this.handleSearch.bind(this);
        this.handleViewToggle = this.handleViewToggle.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleHotelClick = this.handleHotelClick.bind(this);
    }

    /**
     * Initialize the component
     */
    async init() {
        this.render();
        await this.loadHotels();
        this.bindEvents();
    }

    /**
     * Load hotels from service
     */
    async loadHotels() {
        this.setLoading(true);
        this.setError(null);

        try {
            this.hotels = await this.hotelService.getAllHotels();
            this.applyFiltersAndSort();
            this.renderHotels();
            this.renderPagination();
        } catch (error) {
            console.error('Failed to load hotels:', error);
            this.setError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Apply search filters and sorting
     */
    applyFiltersAndSort() {
        let filtered = [...this.hotels];

        // Apply filters
        if (this.searchCriteria.city) {
            filtered = filtered.filter(hotel => 
                hotel.city.toLowerCase().includes(this.searchCriteria.city.toLowerCase())
            );
        }

        if (this.searchCriteria.maxPrice) {
            filtered = filtered.filter(hotel => 
                hotel.pricePerNight <= this.searchCriteria.maxPrice
            );
        }

        if (this.searchCriteria.minRating) {
            filtered = filtered.filter(hotel => 
                hotel.rating >= this.searchCriteria.minRating
            );
        }

        // Apply sorting
        filtered = this.hotelService.sortHotels(
            filtered, 
            this.searchCriteria.sortBy, 
            this.searchCriteria.sortOrder
        );

        this.filteredHotels = filtered;
        this.currentPage = 1; // Reset to first page when filters change
    }

    /**
     * Get paginated hotels for current page
     */
    getPaginatedHotels() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredHotels.slice(startIndex, endIndex);
    }

    /**
     * Get total number of pages
     */
    getTotalPages() {
        return Math.ceil(this.filteredHotels.length / this.itemsPerPage);
    }

    /**
     * Render the component
     */
    render() {
        this.container.innerHTML = `
            <div class="hotel-list-container">
                <!-- Search and Filter Section -->
                <div class="search-filter-section">
                    <div class="search-header">
                        <h2>Find Your Perfect Hotel</h2>
                        <div class="view-controls">
                            <button class="view-toggle-btn" data-view="grid" title="Grid View">
                                <span class="icon">⊞</span>
                            </button>
                            <button class="view-toggle-btn" data-view="list" title="List View">
                                <span class="icon">☰</span>
                            </button>
                        </div>
                    </div>
                    
                    <form class="search-form" id="hotelSearchForm">
                        <div class="search-row">
                            <div class="search-field">
                                <label for="citySearch">City</label>
                                <input type="text" id="citySearch" name="city" placeholder="Enter city name">
                            </div>
                            
                            <div class="search-field">
                                <label for="maxPrice">Max Price per Night</label>
                                <input type="number" id="maxPrice" name="maxPrice" min="0" step="0.01" placeholder="Any price">
                            </div>
                            
                            <div class="search-field">
                                <label for="minRating">Minimum Rating</label>
                                <select id="minRating" name="minRating">
                                    <option value="">Any rating</option>
                                    <option value="1">1+ Stars</option>
                                    <option value="2">2+ Stars</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="5">5 Stars</option>
                                </select>
                            </div>
                            
                            <div class="search-actions">
                                <button type="submit" class="search-btn">Search</button>
                                <button type="button" class="clear-btn" id="clearSearch">Clear</button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Results Section -->
                <div class="results-section">
                    <div class="results-header">
                        <div class="results-info">
                            <span class="results-count">0 hotels found</span>
                        </div>
                        
                        <div class="sort-controls">
                            <label for="sortBy">Sort by:</label>
                            <select id="sortBy" name="sortBy">
                                <option value="name">Name</option>
                                <option value="price">Price</option>
                                <option value="rating">Rating</option>
                                <option value="city">City</option>
                            </select>
                            
                            <select id="sortOrder" name="sortOrder">
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div class="loading-state" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Loading hotels...</p>
                    </div>

                    <!-- Error State -->
                    <div class="error-state" style="display: none;">
                        <div class="error-message"></div>
                        <button class="retry-btn">Try Again</button>
                    </div>

                    <!-- Hotels Grid/List -->
                    <div class="hotels-container grid-view" id="hotelsContainer">
                        <!-- Hotels will be rendered here -->
                    </div>

                    <!-- Pagination -->
                    <div class="pagination-container" id="paginationContainer">
                        <!-- Pagination will be rendered here -->
                    </div>
                </div>
            </div>
        `;

        // Set initial view mode
        this.updateViewMode();
    }

    /**
     * Render hotels in the container
     */
    renderHotels() {
        const container = this.container.querySelector('#hotelsContainer');
        const paginatedHotels = this.getPaginatedHotels();

        if (paginatedHotels.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🏨</div>
                    <h3>No hotels found</h3>
                    <p>Try adjusting your search criteria to find more hotels.</p>
                </div>
            `;
            this.updateResultsCount(0);
            return;
        }

        const hotelsHtml = paginatedHotels.map(hotel => this.renderHotelCard(hotel)).join('');
        container.innerHTML = hotelsHtml;
        this.updateResultsCount(this.filteredHotels.length);
    }

    /**
     * Render individual hotel card
     */
    renderHotelCard(hotel) {
        const hotelModel = new Hotel(hotel);
        
        return `
            <div class="hotel-card" data-hotel-id="${hotel.id}">
                <div class="hotel-image">
                    <img src="/assets/images/hotel-placeholder.jpg" alt="${hotel.name}" loading="lazy">
                    <div class="hotel-rating">
                        <span class="rating-stars">${hotelModel.getStarRating()}</span>
                        <span class="rating-number">${hotel.rating.toFixed(1)}</span>
                    </div>
                </div>
                
                <div class="hotel-info">
                    <h3 class="hotel-name">${hotel.name}</h3>
                    <p class="hotel-location">
                        <span class="location-icon">📍</span>
                        ${hotel.city}
                    </p>
                    <p class="hotel-address">${hotel.address}</p>
                    
                    <div class="hotel-details">
                        <div class="price-info">
                            <span class="price">${hotelModel.getFormattedPrice()}</span>
                            <span class="price-unit">per night</span>
                        </div>
                        
                        <div class="availability-info">
                            <span class="availability ${hotelModel.isAvailable() ? 'available' : 'unavailable'}">
                                ${hotelModel.getAvailabilityStatus()}
                            </span>
                        </div>
                    </div>
                    
                    <div class="hotel-actions">
                        <button class="view-details-btn" data-hotel-id="${hotel.id}">
                            View Details
                        </button>
                        ${hotelModel.isAvailable() ? 
                            `<button class="book-now-btn" data-hotel-id="${hotel.id}">Book Now</button>` : 
                            `<button class="book-now-btn" disabled>Fully Booked</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        const container = this.container.querySelector('#paginationContainer');
        const totalPages = this.getTotalPages();

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHtml = '<div class="pagination">';

        // Previous button
        if (this.currentPage > 1) {
            paginationHtml += `<button class="page-btn" data-page="${this.currentPage - 1}">Previous</button>`;
        }

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            paginationHtml += `<button class="page-btn ${isActive}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<span class="page-ellipsis">...</span>`;
            }
            paginationHtml += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHtml += `<button class="page-btn" data-page="${this.currentPage + 1}">Next</button>`;
        }

        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;
    }

    /**
     * Update results count display
     */
    updateResultsCount(count) {
        const resultsCount = this.container.querySelector('.results-count');
        const text = count === 1 ? '1 hotel found' : `${count} hotels found`;
        resultsCount.textContent = text;
    }

    /**
     * Update view mode (grid/list)
     */
    updateViewMode() {
        const container = this.container.querySelector('#hotelsContainer');
        const viewButtons = this.container.querySelectorAll('.view-toggle-btn');

        // Update container class
        container.className = `hotels-container ${this.viewMode}-view`;

        // Update button states
        viewButtons.forEach(btn => {
            const isActive = btn.dataset.view === this.viewMode;
            btn.classList.toggle('active', isActive);
        });
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const loadingState = this.container.querySelector('.loading-state');
        const resultsSection = this.container.querySelector('.results-section');
        
        if (loading) {
            loadingState.style.display = 'block';
            resultsSection.style.opacity = '0.5';
        } else {
            loadingState.style.display = 'none';
            resultsSection.style.opacity = '1';
        }
    }

    /**
     * Set error state
     */
    setError(error) {
        this.error = error;
        const errorState = this.container.querySelector('.error-state');
        const errorMessage = this.container.querySelector('.error-message');
        
        if (error) {
            errorMessage.textContent = error;
            errorState.style.display = 'block';
        } else {
            errorState.style.display = 'none';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search form
        const searchForm = this.container.querySelector('#hotelSearchForm');
        searchForm.addEventListener('submit', this.handleSearch);

        // Clear search
        const clearBtn = this.container.querySelector('#clearSearch');
        clearBtn.addEventListener('click', this.handleClearSearch.bind(this));

        // View toggle
        const viewButtons = this.container.querySelectorAll('.view-toggle-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', this.handleViewToggle);
        });

        // Sort controls
        const sortBy = this.container.querySelector('#sortBy');
        const sortOrder = this.container.querySelector('#sortOrder');
        sortBy.addEventListener('change', this.handleSort);
        sortOrder.addEventListener('change', this.handleSort);

        // Hotel cards
        this.container.addEventListener('click', this.handleHotelClick);

        // Pagination
        this.container.addEventListener('click', this.handlePageChange);

        // Retry button
        const retryBtn = this.container.querySelector('.retry-btn');
        retryBtn.addEventListener('click', () => this.loadHotels());
    }

    /**
     * Handle search form submission
     */
    handleSearch(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        this.searchCriteria = {
            city: formData.get('city') || '',
            maxPrice: formData.get('maxPrice') ? parseFloat(formData.get('maxPrice')) : null,
            minRating: formData.get('minRating') ? parseFloat(formData.get('minRating')) : null,
            sortBy: this.searchCriteria.sortBy,
            sortOrder: this.searchCriteria.sortOrder
        };

        this.applyFiltersAndSort();
        this.renderHotels();
        this.renderPagination();
    }

    /**
     * Handle clear search
     */
    handleClearSearch() {
        // Reset form
        const form = this.container.querySelector('#hotelSearchForm');
        form.reset();

        // Reset search criteria
        this.searchCriteria = {
            city: '',
            maxPrice: null,
            minRating: null,
            sortBy: 'name',
            sortOrder: 'asc'
        };

        // Reset sort controls
        this.container.querySelector('#sortBy').value = 'name';
        this.container.querySelector('#sortOrder').value = 'asc';

        this.applyFiltersAndSort();
        this.renderHotels();
        this.renderPagination();
    }

    /**
     * Handle view toggle
     */
    handleViewToggle(event) {
        this.viewMode = event.currentTarget.dataset.view;
        this.updateViewMode();
    }

    /**
     * Handle sort change
     */
    handleSort(event) {
        const sortBy = this.container.querySelector('#sortBy').value;
        const sortOrder = this.container.querySelector('#sortOrder').value;

        this.searchCriteria.sortBy = sortBy;
        this.searchCriteria.sortOrder = sortOrder;

        this.applyFiltersAndSort();
        this.renderHotels();
        this.renderPagination();
    }

    /**
     * Handle hotel card clicks
     */
    handleHotelClick(event) {
        const viewDetailsBtn = event.target.closest('.view-details-btn');
        const bookNowBtn = event.target.closest('.book-now-btn');
        const hotelCard = event.target.closest('.hotel-card');

        if (viewDetailsBtn || (hotelCard && !bookNowBtn)) {
            const hotelId = viewDetailsBtn?.dataset.hotelId || hotelCard?.dataset.hotelId;
            if (hotelId && this.router) {
                this.router.navigate(`/hotels/${hotelId}`);
            }
        } else if (bookNowBtn && !bookNowBtn.disabled) {
            const hotelId = bookNowBtn.dataset.hotelId;
            if (hotelId && this.router) {
                this.router.navigate(`/bookings/new?hotelId=${hotelId}`);
            }
        }
    }

    /**
     * Handle pagination clicks
     */
    handlePageChange(event) {
        const pageBtn = event.target.closest('.page-btn');
        if (pageBtn && pageBtn.dataset.page) {
            this.currentPage = parseInt(pageBtn.dataset.page);
            this.renderHotels();
            this.renderPagination();
            
            // Scroll to top of results
            this.container.querySelector('.results-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }

    /**
     * Refresh the hotel list
     */
    async refresh() {
        await this.loadHotels();
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Remove event listeners and clean up
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
window.HotelListComponent = HotelListComponent;


