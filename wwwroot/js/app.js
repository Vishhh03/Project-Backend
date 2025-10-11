/**
 * FinalDestination - Main Application Entry Point
 * 
 * This file serves as the main entry point for the frontend application.
 * It initializes the application, sets up event listeners, and manages
 * the overall application lifecycle.
 */

// Application namespace to avoid global pollution
window.FinalDestination = window.FinalDestination || {};

(function(app) {
    'use strict';

    /**
     * Application configuration
     */
    app.config = null; // Will be initialized by AppConfig

    /**
     * Application state
     */
    app.state = {
        isInitialized: false,
        currentUser: null,
        currentRoute: null,
        isLoading: false,
        isAuthenticated: false
    };

    /**
     * Application services
     */
    app.services = {
        auth: null,
        authStateManager: null,
        storage: null,
        apiClient: null,
        notification: null,
        errorHandler: null,
        offlineManager: null,
        hotel: null,
        booking: null,
        payment: null,
        review: null,
        loyalty: null,
        admin: null
    };

    /**
     * Application infrastructure
     */
    app.infrastructure = {
        config: null,
        buildConfig: null,
        lifecycle: null,
        stateManager: null,
        eventBus: null,
        componentIntegration: null,
        bundleOptimizer: null
    };

    /**
     * Current component reference
     */
    app.currentComponent = null;

    /**
     * Utility functions
     */
    app.utils = {
        /**
         * Log messages (only in debug mode)
         */
        log: function(message, type = 'info') {
            if (app.config.debug) {
                console[type](`[FinalDestination] ${message}`);
            }
        },

        /**
         * Show/hide loading spinner
         */
        setLoading: function(isLoading) {
            app.state.isLoading = isLoading;
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                if (isLoading) {
                    spinner.classList.add('show');
                    spinner.setAttribute('aria-hidden', 'false');
                } else {
                    spinner.classList.remove('show');
                    spinner.setAttribute('aria-hidden', 'true');
                }
            }
        },

        /**
         * Show notification toast
         */
        showNotification: function(message, type = 'info') {
            const container = document.getElementById('notification-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <span>${message}</span>
                    <button class="toast-close" aria-label="Close notification">&times;</button>
                </div>
            `;

            // Add to container
            container.appendChild(toast);

            // Show toast
            setTimeout(() => toast.classList.add('show'), 100);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 5000);

            // Manual close
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                });
            }
        },

        /**
         * Format date for display
         */
        formatDate: function(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        /**
         * Format currency
         */
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        },

        /**
         * Debounce function calls
         */
        debounce: function(func, wait) {
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
    };

    /**
     * DOM manipulation helpers
     */
    app.dom = {
        /**
         * Get element by ID
         */
        get: function(id) {
            return document.getElementById(id);
        },

        /**
         * Query selector
         */
        query: function(selector) {
            return document.querySelector(selector);
        },

        /**
         * Query selector all
         */
        queryAll: function(selector) {
            return document.querySelectorAll(selector);
        },

        /**
         * Create element with attributes
         */
        create: function(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });

            if (content) {
                element.textContent = content;
            }

            return element;
        },

        /**
         * Add event listener with cleanup tracking
         */
        on: function(element, event, handler, options = {}) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            
            if (element) {
                element.addEventListener(event, handler, options);
                
                // Track for cleanup if needed
                if (!app._eventListeners) {
                    app._eventListeners = [];
                }
                app._eventListeners.push({ element, event, handler });
            }
        }
    };

    /**
     * Router instance - using the enhanced Router class
     */
    app.router = null;

    /**
     * Set up authentication state listeners
     */
    function setupAuthStateListeners() {
        app.utils.log('Setting up authentication state listeners...');
        
        // Listen for authentication state changes
        app.services.authStateManager.onAuthStateChange((isAuthenticated, user) => {
            app.utils.log(`Auth state changed: ${isAuthenticated ? 'authenticated' : 'not authenticated'}`);
            
            // Update application state through state manager
            app.infrastructure.stateManager.setState({
                isAuthenticated,
                user
            }, 'auth:state:change');
            
            // Emit authentication events
            if (isAuthenticated && user) {
                app.infrastructure.eventBus.emit(EventBus.EVENTS.AUTH_LOGIN_SUCCESS, { user });
                app.utils.showNotification(`Welcome back, ${user.name}!`, 'success');
            } else {
                app.infrastructure.eventBus.emit(EventBus.EVENTS.AUTH_LOGOUT);
                app.utils.showNotification('You have been logged out', 'info');
            }
            
            // Update navigation
            updateNavigation(isAuthenticated, user);
        });
        
        // Subscribe to state changes for navigation updates
        app.infrastructure.stateManager.subscribeToProperty('isAuthenticated', (isAuthenticated) => {
            const user = app.infrastructure.stateManager.getStateProperty('user');
            updateNavigation(isAuthenticated, user);
        });
        
        app.utils.log('Authentication state listeners set up successfully');
    }

    /**
     * Update navigation based on authentication state
     */
    function updateNavigation(isAuthenticated, user) {
        const navMenu = app.dom.query('.navbar-nav');
        if (!navMenu) return;

        // Clear existing nav items (except logo)
        const existingItems = navMenu.querySelectorAll('.nav-item:not(.navbar-brand)');
        existingItems.forEach(item => item.remove());

        // Common navigation items
        const homeItem = app.dom.create('li', { className: 'nav-item' });
        homeItem.innerHTML = '<a href="#/" class="nav-link">Home</a>';
        navMenu.appendChild(homeItem);

        const hotelsItem = app.dom.create('li', { className: 'nav-item' });
        hotelsItem.innerHTML = '<a href="#/hotels" class="nav-link">Hotels</a>';
        navMenu.appendChild(hotelsItem);

        if (isAuthenticated && user) {
            // Authenticated user navigation
            const bookingsItem = app.dom.create('li', { className: 'nav-item' });
            bookingsItem.innerHTML = '<a href="#/bookings" class="nav-link">My Bookings</a>';
            navMenu.appendChild(bookingsItem);

            const loyaltyItem = app.dom.create('li', { className: 'nav-item' });
            loyaltyItem.innerHTML = '<a href="#/loyalty" class="nav-link">Loyalty</a>';
            navMenu.appendChild(loyaltyItem);

            // Role-specific navigation
            if (user.role === 3) { // Admin
                const adminItem = app.dom.create('li', { className: 'nav-item' });
                adminItem.innerHTML = '<a href="#/admin" class="nav-link">Admin</a>';
                navMenu.appendChild(adminItem);
            } else if (user.role === 2) { // Hotel Manager
                const manageItem = app.dom.create('li', { className: 'nav-item' });
                manageItem.innerHTML = '<a href="#/hotels/manage" class="nav-link">Manage Hotels</a>';
                navMenu.appendChild(manageItem);
            }

            // User dropdown
            const userDropdown = app.dom.create('li', { className: 'nav-item dropdown' });
            userDropdown.innerHTML = `
                <a href="#" class="nav-link dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                    ${user.name}
                </a>
                <div class="dropdown-menu">
                    <a href="#/profile" class="dropdown-item">Profile</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" id="logout-link">Logout</a>
                </div>
            `;
            navMenu.appendChild(userDropdown);

            // Add logout functionality
            const logoutLink = userDropdown.querySelector('#logout-link');
            if (logoutLink) {
                app.dom.on(logoutLink, 'click', async (e) => {
                    e.preventDefault();
                    try {
                        await app.services.auth.logout();
                        app.router.navigate('/');
                    } catch (error) {
                        app.utils.log(`Logout error: ${error.message}`, 'error');
                        app.utils.showNotification('Error during logout', 'error');
                    }
                });
            }

        } else {
            // Guest user navigation
            const loginItem = app.dom.create('li', { className: 'nav-item' });
            loginItem.innerHTML = '<a href="#/login" class="nav-link">Login</a>';
            navMenu.appendChild(loginItem);

            const registerItem = app.dom.create('li', { className: 'nav-item' });
            registerItem.innerHTML = '<a href="#/register" class="nav-link">Register</a>';
            navMenu.appendChild(registerItem);
        }
    }

    /**
     * Initialize mobile navigation
     */
    function initMobileNavigation() {
        const toggle = app.dom.query('.navbar-toggle');
        const menu = app.dom.query('.navbar-menu');

        if (toggle && menu) {
            app.dom.on(toggle, 'click', function() {
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                
                // Toggle menu visibility
                menu.classList.toggle('show');
                
                // Update ARIA attributes
                toggle.setAttribute('aria-expanded', !isExpanded);
                toggle.classList.toggle('active');
                
                // Update menu ARIA attributes
                menu.setAttribute('aria-hidden', isExpanded);
            });

            // Close menu when clicking outside
            app.dom.on(document, 'click', function(event) {
                if (!toggle.contains(event.target) && !menu.contains(event.target)) {
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.classList.remove('active');
                    menu.setAttribute('aria-hidden', 'true');
                }
            });

            // Close menu on escape key
            app.dom.on(document, 'keydown', function(event) {
                if (event.key === 'Escape' && menu.classList.contains('show')) {
                    menu.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.classList.remove('active');
                    menu.setAttribute('aria-hidden', 'true');
                    toggle.focus();
                }
            });
        }
    }

    /**
     * Initialize configuration
     */
    async function initConfiguration() {
        console.log('[FinalDestination] Initializing configuration...');
        
        // Initialize configuration manager
        app.infrastructure.config = new AppConfig();
        
        // Validate configuration
        const validation = app.infrastructure.config.validate();
        if (!validation.isValid) {
            throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Update app.config for backward compatibility
        app.config = {
            apiBaseUrl: app.infrastructure.config.get('api.baseUrl'),
            version: app.infrastructure.config.get('version'),
            debug: app.infrastructure.config.get('debug')
        };
        
        console.log('[FinalDestination] Configuration initialized successfully');
    }

    /**
     * Initialize lifecycle manager
     */
    async function initLifecycle() {
        console.log('[FinalDestination] Initializing lifecycle manager...');
        
        // Initialize lifecycle manager
        app.infrastructure.lifecycle = new AppLifecycle();
        
        // Add initialization steps
        app.infrastructure.lifecycle.addInitializationStep('configuration', initConfiguration);
        app.infrastructure.lifecycle.addInitializationStep('infrastructure', initInfrastructure, ['configuration']);
        app.infrastructure.lifecycle.addInitializationStep('services', initServices, ['infrastructure']);
        app.infrastructure.lifecycle.addInitializationStep('components', initComponentIntegration, ['services']);
        app.infrastructure.lifecycle.addInitializationStep('router', initRouter, ['components']);
        app.infrastructure.lifecycle.addInitializationStep('auth-listeners', setupAuthStateListeners, ['router']);
        app.infrastructure.lifecycle.addInitializationStep('mobile-nav', initMobileNavigation, ['router']);
        
        // Add shutdown steps
        app.infrastructure.lifecycle.addShutdownStep('components', async () => {
            if (app.infrastructure.componentIntegration) {
                app.infrastructure.componentIntegration.destroyAllComponents();
            }
        });
        
        app.infrastructure.lifecycle.addShutdownStep('services', async () => {
            // Clean up services
            if (app.services.auth) {
                await app.services.auth.logout();
            }
        });
        
        // Add error handlers
        app.infrastructure.lifecycle.addErrorHandler(async (error) => {
            app.utils.showNotification('Application error occurred. Please refresh the page.', 'error');
        });
        
        console.log('[FinalDestination] Lifecycle manager initialized successfully');
    }

    /**
     * Initialize infrastructure
     */
    async function initInfrastructure() {
        console.log('[FinalDestination] Initializing application infrastructure...');
        
        // Initialize production configuration
        if (typeof ProductionConfig !== 'undefined') {
            app.infrastructure.productionConfig = new ProductionConfig();
        }
        
        // Initialize build configuration
        app.infrastructure.buildConfig = new BuildConfig();
        app.infrastructure.buildConfig.applyOptimizations();
        
        // Initialize bundle optimizer
        app.infrastructure.bundleOptimizer = new BundleOptimizer(app.infrastructure.config.getAll());
        app.infrastructure.bundleOptimizer.preloadCriticalResources();
        
        // Initialize state manager
        app.infrastructure.stateManager = new StateManager();
        
        // Initialize event bus
        app.infrastructure.eventBus = new EventBus();
        app.infrastructure.eventBus.setDebugMode(app.infrastructure.config.get('debug'));
        
        console.log('[FinalDestination] Infrastructure initialized successfully');
    }

    /**
     * Initialize services
     */
    async function initServices() {
        console.log('[FinalDestination] Initializing services...');
        
        // Initialize error handling and notification services first
        app.services.errorHandler = window.errorHandler; // Global instance created by error-handler.js
        app.services.notification = window.notificationService; // Global instance created by notification-service.js
        app.services.offlineManager = window.offlineManager; // Global instance created by offline-manager.js
        
        // Initialize storage service with configuration
        app.services.storage = new StorageService();
        
        // Initialize API client with configuration
        app.services.apiClient = new ApiClient(app.infrastructure.config.get('api.baseUrl'));
        
        // Configure API client with settings
        if (app.services.apiClient.setTimeout) {
            app.services.apiClient.setTimeout(app.infrastructure.config.get('api.timeout'));
        }
        
        // Initialize auth service
        app.services.auth = new AuthService(app.services.apiClient, app.services.storage);
        
        // Initialize auth state manager
        app.services.authStateManager = new AuthStateManager(app.services.auth);
        
        // Initialize business services
        if (typeof HotelService !== 'undefined') {
            app.services.hotel = new HotelService(app.services.apiClient);
        }
        
        if (typeof BookingService !== 'undefined') {
            app.services.booking = new BookingService(app.services.apiClient);
        }
        
        if (typeof PaymentService !== 'undefined') {
            app.services.payment = new PaymentService(app.services.apiClient);
        }
        
        if (typeof ReviewService !== 'undefined') {
            app.services.review = new ReviewService(app.services.apiClient);
        }
        
        if (typeof LoyaltyService !== 'undefined') {
            app.services.loyalty = new LoyaltyService(app.services.apiClient);
        }
        
        if (typeof AdminService !== 'undefined') {
            app.services.admin = new AdminService(app.services.apiClient);
        }
        
        console.log('[FinalDestination] Services initialized successfully');
    }

    /**
     * Initialize component integration
     */
    async function initComponentIntegration() {
        console.log('[FinalDestination] Initializing component integration...');
        
        // Create component integration manager
        app.infrastructure.componentIntegration = new ComponentIntegration(
            app.infrastructure.stateManager,
            app.infrastructure.eventBus,
            app.services
        );
        
        // Initialize component integration
        await app.infrastructure.componentIntegration.initialize();
        
        console.log('[FinalDestination] Component integration initialized successfully');
    }

    /**
     * Initialize router and routes
     */
    async function initRouter() {
        app.utils.log('Initializing router...');
        
        // Create router instance
        app.router = new Router();

        // Initialize auth state manager with router and auth service
        await app.services.authStateManager.initialize(app.services.auth, app.router);

        // Home route
        app.router.addRoute('/', function() {
            app.utils.log('Loading home page');
            const container = app.dom.get('app-container');
            if (container) {
                container.innerHTML = `
                    <div class="hero-section text-center fade-in-up">
                        <h1 class="hero-title gradient-text">Welcome to FinalDestination</h1>
                        <p class="hero-subtitle">Discover luxury accommodations and unforgettable experiences</p>
                        <div class="btn-group">
                            <a href="#/hotels" class="btn btn-primary btn-lg scale-on-hover">
                                <span>🏨</span> Browse Hotels
                            </a>
                            <a href="#/login" class="btn btn-outline btn-lg scale-on-hover">
                                <span>👤</span> Sign In
                            </a>
                        </div>
                    </div>
                    
                    <div class="grid-3">
                        <div class="card stagger-item">
                            <div class="card-body text-center">
                                <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary-color);">⚡</div>
                                <h3>Easy Booking</h3>
                                <p>Book your hotel in just a few clicks with our simple and intuitive interface. No hidden fees, no complications.</p>
                            </div>
                        </div>
                        <div class="card stagger-item">
                            <div class="card-body text-center">
                                <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--hotel-gold);">💰</div>
                                <h3>Best Prices</h3>
                                <p>We offer competitive prices and exclusive deals on hotels worldwide. Save more on your next adventure.</p>
                            </div>
                        </div>
                        <div class="card stagger-item">
                            <div class="card-body text-center">
                                <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--success-color);">🎧</div>
                                <h3>24/7 Support</h3>
                                <p>Our customer support team is available around the clock to help you with any questions or concerns.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center" style="margin-top: 3rem; padding: 2rem; background: var(--hotel-cream); border-radius: 1rem;">
                        <h2 style="color: var(--gray-900); margin-bottom: 1rem;">Why Choose FinalDestination?</h2>
                        <div class="grid-3" style="margin-top: 2rem;">
                            <div class="text-center">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌟</div>
                                <h4>Premium Quality</h4>
                                <p style="font-size: 0.9rem; color: var(--gray-600);">Handpicked hotels with excellent ratings</p>
                            </div>
                            <div class="text-center">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒</div>
                                <h4>Secure Booking</h4>
                                <p style="font-size: 0.9rem; color: var(--gray-600);">Your data is protected with industry-standard security</p>
                            </div>
                            <div class="text-center">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
                                <h4>Perfect Match</h4>
                                <p style="font-size: 0.9rem; color: var(--gray-600);">Smart recommendations based on your preferences</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // Hotels route
        app.router.addRoute('/hotels', async function() {
            app.utils.log('Loading hotels page');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create hotel list component
                container.innerHTML = '<div id="hotel-list-container"></div>';
                
                try {
                    const { instance } = await app.infrastructure.componentIntegration.createComponent(
                        'hotel-list',
                        'hotel-list-container'
                    );
                    app.currentComponent = instance;
                } catch (error) {
                    app.utils.log(`Error loading hotel list component: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="text-center p-responsive">
                            <h1>Hotels</h1>
                            <p>Error loading hotels. Please try again.</p>
                            <a href="#/" class="btn btn-primary">Back to Home</a>
                        </div>
                    `;
                }
            }
        });

        // Hotel detail route with parameter
        app.router.addRoute('/hotels/:id', function(params) {
            app.utils.log(`Loading hotel detail page for ID: ${params.id}`);
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create hotel detail component
                container.innerHTML = '<div id="hotel-detail-container"></div>';
                
                try {
                    if (typeof HotelDetailComponent !== 'undefined') {
                        const hotelDetailContainer = document.getElementById('hotel-detail-container');
                        const hotelService = new HotelService(app.services.apiClient);
                        const hotelDetailComponent = new HotelDetailComponent(
                            hotelDetailContainer,
                            hotelService,
                            app.services.auth,
                            app.router
                        );
                        
                        // Initialize with hotel ID
                        hotelDetailComponent.init(params.id);
                        app.currentComponent = hotelDetailComponent;
                    } else {
                        // Fallback if component not loaded
                        container.innerHTML = `
                            <div class="text-center p-responsive">
                                <h1>Hotel Details</h1>
                                <p>Hotel ID: ${params.id}</p>
                                <p>Hotel detail component not available. Please check that all required files are loaded.</p>
                                <a href="#/hotels" class="btn btn-primary">Back to Hotels</a>
                            </div>
                        `;
                    }
                } catch (error) {
                    app.utils.log(`Error loading hotel detail component: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="text-center p-responsive">
                            <h1>Hotel Details</h1>
                            <p>Error loading hotel details. Please try again.</p>
                            <a href="#/hotels" class="btn btn-primary">Back to Hotels</a>
                        </div>
                    `;
                }
            }
        });

        // Login route - redirect if already authenticated
        app.router.addRoute('/login', function() {
            // Redirect if already authenticated
            if (app.services.authStateManager.isAuthenticated()) {
                app.utils.log('User already authenticated, redirecting to home');
                app.router.navigate('/');
                return;
            }
            
            app.utils.log('Loading login page');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create login component
                container.innerHTML = '<div id="login-container"></div>';
                
                // Initialize login component
                try {
                    if (typeof LoginComponent !== 'undefined') {
                        const loginComponent = new LoginComponent('login-container');
                        app.currentComponent = loginComponent;
                        
                        // Set up success callback for login redirect
                        loginComponent.onLoginSuccess = () => {
                            app.services.authStateManager.handleLoginSuccess();
                        };
                    } else {
                        // Fallback login form
                        container.innerHTML = `
                            <div class="auth-container">
                                <div class="auth-card">
                                    <h1>Login</h1>
                                    <p>Login component not available. Please check that all required files are loaded.</p>
                                    <a href="#/" class="btn btn-primary">Back to Home</a>
                                </div>
                            </div>
                        `;
                    }
                } catch (error) {
                    app.utils.log(`Error loading login component: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="auth-container">
                            <div class="auth-card">
                                <h1>Login</h1>
                                <p>Error loading login form. Please refresh the page.</p>
                                <a href="#/" class="btn btn-primary">Back to Home</a>
                            </div>
                        </div>
                    `;
                }
            }
        });

        // Register route - redirect if already authenticated
        app.router.addRoute('/register', function() {
            // Redirect if already authenticated
            if (app.services.authStateManager.isAuthenticated()) {
                app.utils.log('User already authenticated, redirecting to home');
                app.router.navigate('/');
                return;
            }
            
            app.utils.log('Loading register page');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create register component
                container.innerHTML = '<div id="register-container"></div>';
                
                // Initialize register component
                try {
                    if (typeof RegisterComponent !== 'undefined') {
                        const registerComponent = new RegisterComponent('register-container');
                        app.currentComponent = registerComponent;
                        
                        // Set up success callback for registration redirect
                        registerComponent.onRegisterSuccess = () => {
                            app.services.authStateManager.handleLoginSuccess();
                        };
                    } else {
                        // Fallback register form
                        container.innerHTML = `
                            <div class="auth-container">
                                <div class="auth-card">
                                    <h1>Register</h1>
                                    <p>Registration component not available. Please check that all required files are loaded.</p>
                                    <a href="#/" class="btn btn-primary">Back to Home</a>
                                </div>
                            </div>
                        `;
                    }
                } catch (error) {
                    app.utils.log(`Error loading register component: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="auth-container">
                            <div class="auth-card">
                                <h1>Register</h1>
                                <p>Error loading registration form. Please refresh the page.</p>
                                <a href="#/" class="btn btn-primary">Back to Home</a>
                            </div>
                        </div>
                    `;
                }
            }
        });

        // Bookings route (protected)
        app.router.addRoute('/bookings', async function() {
            if (!app.services.authStateManager.isAuthenticated()) {
                app.utils.log('Redirecting to login - bookings requires authentication');
                app.router.navigate('/login');
                return;
            }
            
            app.utils.log('Loading bookings page');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create booking list component
                container.innerHTML = '<div id="booking-list-container"></div>';
                
                try {
                    const { instance } = await app.infrastructure.componentIntegration.createComponent(
                        'booking-list',
                        'booking-list-container'
                    );
                    app.currentComponent = instance;
                } catch (error) {
                    app.utils.log(`Error loading booking list component: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="text-center p-responsive">
                            <h1>My Bookings</h1>
                            <p>Error loading bookings. Please try again.</p>
                            <a href="#/" class="btn btn-primary">Back to Home</a>
                        </div>
                    `;
                }
            }
        });

        // Loyalty route (protected)
        app.router.addRoute('/loyalty', async function() {
            if (!app.services.authStateManager.isAuthenticated()) {
                app.utils.log('Redirecting to login - loyalty requires authentication');
                app.router.navigate('/login');
                return;
            }
            
            app.utils.log('Loading loyalty page');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create loyalty dashboard component
                container.innerHTML = '<div id="loyalty-dashboard-container"></div>';
                
                try {
                    const { instance } = await app.infrastructure.componentIntegration.createComponent(
                        'loyalty-dashboard',
                        'loyalty-dashboard-container'
                    );
                    app.currentComponent = instance;
                } catch (error) {
                    app.utils.log(`Error loading loyalty dashboard component: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="text-center p-responsive">
                            <h1>Loyalty Program</h1>
                            <p>Error loading loyalty dashboard. Please try again.</p>
                            <a href="#/" class="btn btn-primary">Back to Home</a>
                        </div>
                    `;
                }
            }
        });

        // Profile route (protected)
        app.router.addRoute('/profile', function() {
            if (!app.services.authStateManager.isAuthenticated()) {
                app.utils.log('Redirecting to login - profile requires authentication');
                app.router.navigate('/login');
                return;
            }
            
            app.utils.log('Loading profile page');
            const container = app.dom.get('app-container');
            if (container) {
                const user = app.services.authStateManager.getCurrentUser();
                container.innerHTML = `
                    <div class="text-center p-responsive">
                        <h1>User Profile</h1>
                        <div class="card" style="max-width: 500px; margin: 0 auto;">
                            <div class="card-body">
                                <h3>${user ? user.name : 'Unknown User'}</h3>
                                <p><strong>Email:</strong> ${user ? user.email : 'N/A'}</p>
                                <p><strong>Role:</strong> ${user ? app.services.auth.getRoleName(user.role) : 'N/A'}</p>
                                <p><strong>Member Since:</strong> ${user ? app.utils.formatDate(user.createdAt) : 'N/A'}</p>
                            </div>
                        </div>
                        <a href="#/" class="btn btn-primary mt-3">Back to Home</a>
                    </div>
                `;
            }
        });

        // Admin route (admin only)
        app.router.addRoute('/admin', function() {
            if (!app.services.authStateManager.isAuthenticated()) {
                app.utils.log('Redirecting to login - admin requires authentication');
                app.router.navigate('/login');
                return;
            }
            
            const user = app.services.authStateManager.getCurrentUser();
            if (!user || user.role !== 3) {
                app.utils.log('Access denied - admin role required');
                app.utils.showNotification('Access denied. Admin privileges required.', 'error');
                app.router.navigate('/');
                return;
            }
            
            app.utils.log('Loading admin dashboard');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create admin dashboard component
                container.innerHTML = '<div id="admin-dashboard-container"></div>';
                
                try {
                    if (typeof AdminDashboardComponent !== 'undefined') {
                        const adminContainer = document.getElementById('admin-dashboard-container');
                        const adminDashboard = new AdminDashboardComponent(adminContainer);
                        app.currentComponent = adminDashboard;
                        
                        // Make admin dashboard available globally for event handlers
                        window.adminDashboard = adminDashboard;
                    } else {
                        // Fallback if component not loaded
                        container.innerHTML = `
                            <div class="error-container">
                                <div class="error-message">
                                    <h2>Admin Dashboard</h2>
                                    <p>Admin dashboard component not available. Please check that all required files are loaded.</p>
                                    <a href="#/" class="btn btn-primary">Back to Home</a>
                                </div>
                            </div>
                        `;
                    }
                } catch (error) {
                    app.utils.log(`Error loading admin dashboard: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="error-container">
                            <div class="error-message">
                                <h2>Error</h2>
                                <p>Failed to load admin dashboard: ${error.message}</p>
                                <a href="#/" class="btn btn-primary">Back to Home</a>
                            </div>
                        </div>
                    `;
                }
            }
        });

        // Hotel management route (hotel manager and admin only)
        app.router.addRoute('/hotels/manage', function() {
            if (!app.services.authStateManager.isAuthenticated()) {
                app.utils.log('Redirecting to login - hotel management requires authentication');
                app.router.navigate('/login');
                return;
            }
            
            const user = app.services.authStateManager.getCurrentUser();
            if (!user || (user.role !== 2 && user.role !== 3)) {
                app.utils.log('Access denied - hotel manager or admin role required');
                app.utils.showNotification('Access denied. Hotel Manager or Admin privileges required.', 'error');
                app.router.navigate('/');
                return;
            }
            
            app.utils.log('Loading hotel management page');
            const container = app.dom.get('app-container');
            if (container) {
                // Clear container and create hotel management component
                container.innerHTML = '<div id="hotel-management-container"></div>';
                
                try {
                    if (typeof HotelManagementComponent !== 'undefined') {
                        const managementContainer = document.getElementById('hotel-management-container');
                        const hotelManagement = new HotelManagementComponent(managementContainer);
                        app.currentComponent = hotelManagement;
                        
                        // Make hotel management available globally for event handlers
                        window.hotelManagement = hotelManagement;
                    } else {
                        // Fallback if component not loaded
                        container.innerHTML = `
                            <div class="error-container">
                                <div class="error-message">
                                    <h2>Hotel Management</h2>
                                    <p>Hotel management component not available. Please check that all required files are loaded.</p>
                                    <a href="#/" class="btn btn-primary">Back to Home</a>
                                </div>
                            </div>
                        `;
                    }
                } catch (error) {
                    app.utils.log(`Error loading hotel management: ${error.message}`, 'error');
                    container.innerHTML = `
                        <div class="error-container">
                            <div class="error-message">
                                <h2>Error</h2>
                                <p>Failed to load hotel management: ${error.message}</p>
                                <a href="#/" class="btn btn-primary">Back to Home</a>
                            </div>
                        </div>
                    `;
                }
            }
        });

        // 404 route
        app.router.addRoute('*', function() {
            app.utils.log('404 - Page not found');
            const container = app.dom.get('app-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center p-responsive">
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <a href="#/" class="btn btn-primary">Go Home</a>
                    </div>
                `;
            }
        });

        app.utils.log('Router initialized with routes');
    }

    /**
     * Initialize the application with comprehensive error handling and recovery
     */
    app.init = async function() {
        if (app.state.isInitialized) {
            console.log('[FinalDestination] Application already initialized');
            return;
        }

        console.log('[FinalDestination] Initializing FinalDestination application...');
        
        // Show loading indicator
        app.utils.setLoading(true);

        try {
            // Initialize lifecycle manager first
            await initLifecycle();
            
            // Use lifecycle manager to initialize application
            const success = await app.infrastructure.lifecycle.initialize();
            
            if (!success) {
                throw new Error('Application initialization failed');
            }

            // Validate critical dependencies
            await app.validateCriticalDependencies();
            
            // Initialize error recovery mechanisms
            app.setupErrorRecovery();
            
            // Set up application health monitoring
            app.setupHealthMonitoring();
            
            // Mark as initialized
            app.state.isInitialized = true;

            console.log('[FinalDestination] Application initialized successfully');
            
            // Hide loading indicator
            app.utils.setLoading(false);
            
            // Show welcome message
            app.utils.showNotification('Welcome to FinalDestination!', 'success');

            // Perform final optimizations
            app.performFinalOptimizations();

            // Navigate to current route or home
            const currentHash = window.location.hash.slice(1) || '/';
            if (app.router) {
                app.router.navigate(currentHash);
            }
            
            // Emit application ready event
            if (app.infrastructure.eventBus) {
                app.infrastructure.eventBus.emit('app:ready', {
                    timestamp: Date.now(),
                    version: app.infrastructure.config.get('version')
                });
            }

        } catch (error) {
            console.error('[FinalDestination] Initialization error:', error);
            
            // Hide loading indicator
            app.utils.setLoading(false);
            
            // Show error message
            app.utils.showNotification('Failed to initialize application. Please refresh the page.', 'error');
            
            // Attempt graceful degradation
            await app.attemptGracefulDegradation(error);
        }
    };
    
    /**
     * Validate critical dependencies are available
     */
    app.validateCriticalDependencies = async function() {
        const criticalDependencies = [
            'infrastructure.config',
            'infrastructure.stateManager',
            'infrastructure.eventBus',
            'services.apiClient',
            'services.auth',
            'router'
        ];
        
        const missing = [];
        
        for (const dep of criticalDependencies) {
            const parts = dep.split('.');
            let current = app;
            
            for (const part of parts) {
                if (!current || !current[part]) {
                    missing.push(dep);
                    break;
                }
                current = current[part];
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Critical dependencies missing: ${missing.join(', ')}`);
        }
        
        console.log('[FinalDestination] All critical dependencies validated');
    };
    
    /**
     * Set up error recovery mechanisms
     */
    app.setupErrorRecovery = function() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('[FinalDestination] Global error:', event.error);
            
            if (app.infrastructure.eventBus) {
                app.infrastructure.eventBus.emit('error:global', {
                    error: event.error,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            }
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[FinalDestination] Unhandled promise rejection:', event.reason);
            
            if (app.infrastructure.eventBus) {
                app.infrastructure.eventBus.emit('error:unhandled-promise', {
                    reason: event.reason
                });
            }
        });
        
        // Service worker error recovery
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('error', (event) => {
                console.error('[FinalDestination] Service worker error:', event);
            });
        }
        
        console.log('[FinalDestination] Error recovery mechanisms set up');
    };
    
    /**
     * Set up application health monitoring
     */
    app.setupHealthMonitoring = function() {
        // Monitor API connectivity
        setInterval(async () => {
            try {
                if (app.services.apiClient) {
                    await app.services.apiClient.get('/health');
                    app.infrastructure.stateManager.setState({ apiHealthy: true }, 'health:api');
                }
            } catch (error) {
                app.infrastructure.stateManager.setState({ apiHealthy: false }, 'health:api');
                console.warn('[FinalDestination] API health check failed:', error.message);
            }
        }, 60000); // Check every minute
        
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryUsage = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit
                };
                
                app.infrastructure.stateManager.setState({ memoryUsage }, 'health:memory');
                
                // Warn if memory usage is high
                if (memoryUsage.used / memoryUsage.limit > 0.8) {
                    console.warn('[FinalDestination] High memory usage detected');
                }
            }, 30000); // Check every 30 seconds
        }
        
        console.log('[FinalDestination] Health monitoring set up');
    };
    
    /**
     * Attempt graceful degradation on initialization failure
     */
    app.attemptGracefulDegradation = async function(error) {
        console.log('[FinalDestination] Attempting graceful degradation...');
        
        try {
            // Try to initialize minimal functionality
            const container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-container text-center p-responsive">
                        <h1>Service Temporarily Unavailable</h1>
                        <p>We're experiencing technical difficulties. Please try refreshing the page.</p>
                        <div class="btn-group">
                            <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                            <button onclick="window.FinalDestination.retryInitialization()" class="btn btn-outline">Retry</button>
                        </div>
                        <details class="mt-3">
                            <summary>Technical Details</summary>
                            <pre class="error-details">${error.message}</pre>
                        </details>
                    </div>
                `;
            }
            
            // Set up retry mechanism
            app.retryInitialization = async function() {
                app.state.isInitialized = false;
                await app.init();
            };
            
        } catch (degradationError) {
            console.error('[FinalDestination] Graceful degradation failed:', degradationError);
            
            // Last resort: show basic error page
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                    <h1>Application Error</h1>
                    <p>The application failed to load. Please refresh the page or contact support.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px;">Refresh Page</button>
                </div>
            `;
        }
    };

    /**
     * Perform final optimizations after initialization
     */
    app.performFinalOptimizations = function() {
        console.log('[FinalDestination] Performing final optimizations...');
        
        // Optimize images
        if (app.infrastructure.bundleOptimizer) {
            app.infrastructure.bundleOptimizer.optimizeImages();
        }
        
        // Set up performance monitoring
        app.setupPerformanceMonitoring();
        
        // Clean up initialization artifacts
        app.cleanupInitialization();
        
        // Report performance metrics
        app.reportPerformanceMetrics();
        
        console.log('[FinalDestination] Final optimizations complete');
    };

    /**
     * Set up performance monitoring
     */
    app.setupPerformanceMonitoring = function() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        console.log(`[Performance] ${entry.entryType}:`, entry.value || entry.duration);
                    }
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (error) {
                console.warn('[FinalDestination] Performance monitoring not fully supported');
            }
        }
    };

    /**
     * Clean up initialization artifacts
     */
    app.cleanupInitialization = function() {
        // Remove loading spinner
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.remove();
        }
        
        // Optimize DOM
        app.optimizeDOM();
    };

    /**
     * Optimize DOM structure
     */
    app.optimizeDOM = function() {
        // Optimize images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('alt')) {
                img.alt = '';
            }
            if (!img.hasAttribute('loading') && 'loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
        });
    };

    /**
     * Report performance metrics
     */
    app.reportPerformanceMetrics = function() {
        if (app.config && app.config.debug) {
            setTimeout(() => {
                const metrics = {
                    navigation: performance.getEntriesByType('navigation')[0],
                    paint: performance.getEntriesByType('paint'),
                    resources: performance.getEntriesByType('resource').length
                };
                
                console.group('[FinalDestination] Performance Metrics');
                console.log('Navigation timing:', metrics.navigation);
                console.log('Paint timing:', metrics.paint);
                console.log('Resources loaded:', metrics.resources);
                
                if (app.infrastructure.bundleOptimizer) {
                    console.log('Bundle metrics:', app.infrastructure.bundleOptimizer.getMetrics());
                }
                
                console.groupEnd();
            }, 2000);
        }
    };

    /**
     * Cleanup function for page unload
     */
    app.cleanup = function() {
        // Cleanup current component
        if (app.currentComponent && typeof app.currentComponent.destroy === 'function') {
            app.currentComponent.destroy();
            app.currentComponent = null;
        }

        // Cleanup auth state manager
        if (app.services.authStateManager && typeof app.services.authStateManager.destroy === 'function') {
            app.services.authStateManager.destroy();
        }

        // Remove event listeners
        if (app._eventListeners) {
            app._eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            app._eventListeners = [];
        }

        // Cleanup router
        if (app.router) {
            app.router.destroy();
        }

        console.log('[FinalDestination] Application cleanup completed');
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', app.init);
    } else {
        app.init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', app.cleanup);

})(window.FinalDestination);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.FinalDestination;
}



