/**
 * HotelSearchComponent - Reusable search component for hotels
 * Provides advanced search functionality with filters and suggestions
 */
class HotelSearchComponent {
    constructor(container, hotelService, onSearchCallback) {
        this.container = container;
        this.hotelService = hotelService || new HotelService();
        this.onSearchCallback = onSearchCallback;
        
        // Component state
        this.cities = [];
        this.priceRange = { min: 0, max: 1000 };
        this.searchCriteria = {
            city: '',
            maxPrice: null,
            minRating: null,
            checkIn: '',
            checkOut: '',
            guests: 1
        };

        // Bind methods
        this.handleSearch = this.handleSearch.bind(this);
        this.handleCityInput = this.handleCityInput.bind(this);
        this.handlePriceRange = this.handlePriceRange.bind(this);
    }

    /**
     * Initialize the component
     */
    async init() {
        await this.loadSearchData();
        this.render();
        this.bindEvents();
    }

    /**
     * Load data needed for search (cities, price range)
     */
    async loadSearchData() {
        try {
            const [cities, priceRange] = await Promise.all([
                this.hotelService.getCities(),
                this.hotelService.getPriceRange()
            ]);
            
            this.cities = cities;
            this.priceRange = priceRange;
        } catch (error) {
            console.error('Failed to load search data:', error);
            // Use defaults if loading fails
            this.cities = [];
            this.priceRange = { min: 0, max: 1000 };
        }
    }

    /**
     * Render the search component
     */
    render() {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        this.container.innerHTML = `
            <div class="hotel-search-component">
                <form class="advanced-search-form" id="advancedSearchForm">
                    <div class="search-section">
                        <h3>Find Your Perfect Stay</h3>
                        
                        <div class="search-grid">
                            <!-- Destination -->
                            <div class="search-field destination-field">
                                <label for="destination">Destination</label>
                                <div class="input-with-suggestions">
                                    <input 
                                        type="text" 
                                        id="destination" 
                                        name="city" 
                                        placeholder="Where are you going?"
                                        autocomplete="off"
                                    >
                                    <div class="suggestions-dropdown" id="citySuggestions"></div>
                                </div>
                            </div>

                            <!-- Check-in Date -->
                            <div class="search-field">
                                <label for="checkIn">Check-in</label>
                                <input 
                                    type="date" 
                                    id="checkIn" 
                                    name="checkIn" 
                                    min="${today}"
                                    value="${today}"
                                >
                            </div>

                            <!-- Check-out Date -->
                            <div class="search-field">
                                <label for="checkOut">Check-out</label>
                                <input 
                                    type="date" 
                                    id="checkOut" 
                                    name="checkOut" 
                                    min="${tomorrow}"
                                    value="${tomorrow}"
                                >
                            </div>

                            <!-- Guests -->
                            <div class="search-field">
                                <label for="guests">Guests</label>
                                <select id="guests" name="guests">
                                    <option value="1">1 Guest</option>
                                    <option value="2">2 Guests</option>
                                    <option value="3">3 Guests</option>
                                    <option value="4">4 Guests</option>
                                    <option value="5">5+ Guests</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Filters -->
                    <div class="filters-section">
                        <div class="filters-toggle">
                            <button type="button" class="toggle-filters-btn" id="toggleFilters">
                                <span>Advanced Filters</span>
                                <span class="toggle-icon">▼</span>
                            </button>
                        </div>

                        <div class="filters-content" id="filtersContent" style="display: none;">
                            <div class="filters-grid">
                                <!-- Price Range -->
                                <div class="filter-group">
                                    <label>Price Range (per night)</label>
                                    <div class="price-range-container">
                                        <input 
                                            type="range" 
                                            id="priceRange" 
                                            name="maxPrice"
                                            min="${this.priceRange.min}" 
                                            max="${this.priceRange.max}" 
                                            value="${this.priceRange.max}"
                                            class="price-slider"
                                        >
                                        <div class="price-display">
                                            <span class="price-min">$${this.priceRange.min}</span>
                                            <span class="price-current" id="priceDisplay">$${this.priceRange.max}</span>
                                            <span class="price-max">$${this.priceRange.max}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Rating Filter -->
                                <div class="filter-group">
                                    <label>Minimum Rating</label>
                                    <div class="rating-filter">
                                        <div class="rating-options">
                                            <label class="rating-option">
                                                <input type="radio" name="minRating" value="">
                                                <span>Any Rating</span>
                                            </label>
                                            <label class="rating-option">
                                                <input type="radio" name="minRating" value="3">
                                                <span>3+ ★★★</span>
                                            </label>
                                            <label class="rating-option">
                                                <input type="radio" name="minRating" value="4">
                                                <span>4+ ★★★★</span>
                                            </label>
                                            <label class="rating-option">
                                                <input type="radio" name="minRating" value="5">
                                                <span>5 ★★★★★</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Amenities Filter (Future Enhancement) -->
                                <div class="filter-group">
                                    <label>Amenities</label>
                                    <div class="amenities-filter">
                                        <label class="amenity-option">
                                            <input type="checkbox" name="amenities" value="wifi">
                                            <span>Free WiFi</span>
                                        </label>
                                        <label class="amenity-option">
                                            <input type="checkbox" name="amenities" value="parking">
                                            <span>Free Parking</span>
                                        </label>
                                        <label class="amenity-option">
                                            <input type="checkbox" name="amenities" value="pool">
                                            <span>Swimming Pool</span>
                                        </label>
                                        <label class="amenity-option">
                                            <input type="checkbox" name="amenities" value="gym">
                                            <span>Fitness Center</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search Actions -->
                    <div class="search-actions">
                        <button type="submit" class="search-btn primary">
                            <span class="btn-icon">🔍</span>
                            Search Hotels
                        </button>
                        <button type="button" class="clear-btn secondary" id="clearFilters">
                            Clear All
                        </button>
                    </div>
                </form>

                <!-- Quick Filters -->
                <div class="quick-filters" id="quickFilters">
                    <div class="quick-filter-label">Popular destinations:</div>
                    <div class="quick-filter-buttons" id="quickFilterButtons">
                        <!-- Quick filter buttons will be populated here -->
                    </div>
                </div>
            </div>
        `;

        this.renderQuickFilters();
        this.updatePriceDisplay();
    }

    /**
     * Render quick filter buttons for popular cities
     */
    renderQuickFilters() {
        const container = this.container.querySelector('#quickFilterButtons');
        
        // Show top 5 cities as quick filters
        const topCities = this.cities.slice(0, 5);
        
        const buttonsHtml = topCities.map(city => 
            `<button type="button" class="quick-filter-btn" data-city="${city}">${city}</button>`
        ).join('');

        container.innerHTML = buttonsHtml;
    }

    /**
     * Update price display
     */
    updatePriceDisplay() {
        const priceSlider = this.container.querySelector('#priceRange');
        const priceDisplay = this.container.querySelector('#priceDisplay');
        
        if (priceSlider && priceDisplay) {
            priceDisplay.textContent = `$${priceSlider.value}`;
        }
    }

    /**
     * Show city suggestions
     */
    showCitySuggestions(query) {
        const suggestionsContainer = this.container.querySelector('#citySuggestions');
        
        if (!query || query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const filteredCities = this.cities.filter(city =>
            city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filteredCities.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const suggestionsHtml = filteredCities.map(city =>
            `<div class="suggestion-item" data-city="${city}">${city}</div>`
        ).join('');

        suggestionsContainer.innerHTML = suggestionsHtml;
        suggestionsContainer.style.display = 'block';
    }

    /**
     * Hide city suggestions
     */
    hideCitySuggestions() {
        setTimeout(() => {
            const suggestionsContainer = this.container.querySelector('#citySuggestions');
            suggestionsContainer.style.display = 'none';
        }, 200);
    }

    /**
     * Validate search dates
     */
    validateDates(checkIn, checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            throw new Error('Check-in date cannot be in the past');
        }

        if (checkOutDate <= checkInDate) {
            throw new Error('Check-out date must be after check-in date');
        }

        return true;
    }

    /**
     * Get search criteria from form
     */
    getSearchCriteria() {
        const form = this.container.querySelector('#advancedSearchForm');
        const formData = new FormData(form);

        const criteria = {
            city: formData.get('city')?.trim() || '',
            checkIn: formData.get('checkIn') || '',
            checkOut: formData.get('checkOut') || '',
            guests: parseInt(formData.get('guests')) || 1,
            maxPrice: formData.get('maxPrice') ? parseFloat(formData.get('maxPrice')) : null,
            minRating: formData.get('minRating') ? parseFloat(formData.get('minRating')) : null,
            amenities: formData.getAll('amenities') || []
        };

        return criteria;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const form = this.container.querySelector('#advancedSearchForm');
        const cityInput = this.container.querySelector('#destination');
        const priceSlider = this.container.querySelector('#priceRange');
        const toggleFiltersBtn = this.container.querySelector('#toggleFilters');
        const clearBtn = this.container.querySelector('#clearFilters');
        const checkInInput = this.container.querySelector('#checkIn');
        const checkOutInput = this.container.querySelector('#checkOut');

        // Form submission
        form.addEventListener('submit', this.handleSearch);

        // City input and suggestions
        cityInput.addEventListener('input', this.handleCityInput);
        cityInput.addEventListener('blur', this.hideCitySuggestions.bind(this));

        // City suggestions clicks
        this.container.addEventListener('click', (event) => {
            const suggestionItem = event.target.closest('.suggestion-item');
            if (suggestionItem) {
                cityInput.value = suggestionItem.dataset.city;
                this.hideCitySuggestions();
            }
        });

        // Price slider
        priceSlider.addEventListener('input', this.handlePriceRange);

        // Toggle filters
        toggleFiltersBtn.addEventListener('click', this.toggleFilters.bind(this));

        // Clear filters
        clearBtn.addEventListener('click', this.clearFilters.bind(this));

        // Quick filter buttons
        this.container.addEventListener('click', (event) => {
            const quickFilterBtn = event.target.closest('.quick-filter-btn');
            if (quickFilterBtn) {
                cityInput.value = quickFilterBtn.dataset.city;
                this.handleSearch(new Event('submit'));
            }
        });

        // Date validation
        checkInInput.addEventListener('change', this.handleDateChange.bind(this));
        checkOutInput.addEventListener('change', this.handleDateChange.bind(this));
    }

    /**
     * Handle search form submission
     */
    handleSearch(event) {
        event.preventDefault();

        try {
            const criteria = this.getSearchCriteria();
            
            // Validate dates if provided
            if (criteria.checkIn && criteria.checkOut) {
                this.validateDates(criteria.checkIn, criteria.checkOut);
            }

            this.searchCriteria = criteria;

            // Call the callback with search criteria
            if (this.onSearchCallback) {
                this.onSearchCallback(criteria);
            }

            console.log('Search criteria:', criteria);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Handle city input
     */
    handleCityInput(event) {
        const query = event.target.value;
        this.showCitySuggestions(query);
    }

    /**
     * Handle price range slider
     */
    handlePriceRange(event) {
        this.updatePriceDisplay();
    }

    /**
     * Handle date changes
     */
    handleDateChange(event) {
        const checkInInput = this.container.querySelector('#checkIn');
        const checkOutInput = this.container.querySelector('#checkOut');

        if (event.target === checkInInput) {
            // Update minimum check-out date
            const checkInDate = new Date(checkInInput.value);
            const nextDay = new Date(checkInDate);
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutInput.min = nextDay.toISOString().split('T')[0];

            // Update check-out if it's before new minimum
            if (checkOutInput.value && new Date(checkOutInput.value) <= checkInDate) {
                checkOutInput.value = nextDay.toISOString().split('T')[0];
            }
        }
    }

    /**
     * Toggle filters visibility
     */
    toggleFilters() {
        const filtersContent = this.container.querySelector('#filtersContent');
        const toggleIcon = this.container.querySelector('.toggle-icon');
        const isVisible = filtersContent.style.display !== 'none';

        filtersContent.style.display = isVisible ? 'none' : 'block';
        toggleIcon.textContent = isVisible ? '▼' : '▲';
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        const form = this.container.querySelector('#advancedSearchForm');
        form.reset();

        // Reset dates to today/tomorrow
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        this.container.querySelector('#checkIn').value = today;
        this.container.querySelector('#checkOut').value = tomorrow;
        this.container.querySelector('#priceRange').value = this.priceRange.max;

        this.updatePriceDisplay();
        this.hideCitySuggestions();

        // Trigger search with empty criteria
        this.handleSearch(new Event('submit'));
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create or update error display
        let errorDiv = this.container.querySelector('.search-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'search-error';
            this.container.querySelector('.search-actions').insertAdjacentElement('beforebegin', errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    /**
     * Set search criteria programmatically
     */
    setSearchCriteria(criteria) {
        const form = this.container.querySelector('#advancedSearchForm');
        
        if (criteria.city) {
            form.querySelector('#destination').value = criteria.city;
        }
        if (criteria.checkIn) {
            form.querySelector('#checkIn').value = criteria.checkIn;
        }
        if (criteria.checkOut) {
            form.querySelector('#checkOut').value = criteria.checkOut;
        }
        if (criteria.guests) {
            form.querySelector('#guests').value = criteria.guests;
        }
        if (criteria.maxPrice) {
            form.querySelector('#priceRange').value = criteria.maxPrice;
            this.updatePriceDisplay();
        }
        if (criteria.minRating) {
            const ratingInput = form.querySelector(`input[name="minRating"][value="${criteria.minRating}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
            }
        }
    }

    /**
     * Get current search criteria
     */
    getCurrentCriteria() {
        return { ...this.searchCriteria };
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
window.HotelSearchComponent = HotelSearchComponent;


