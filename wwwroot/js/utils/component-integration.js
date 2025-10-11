/**
 * Component Integration Manager
 * 
 * Manages the integration of all application components with proper data flow,
 * state management, and event communication.
 */

class ComponentIntegration {
    constructor(stateManager, eventBus, services) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.services = services;
        this.components = new Map();
        this.componentInstances = new Map();
        
        // Bind methods
        this.registerComponent = this.registerComponent.bind(this);
        this.createComponent = this.createComponent.bind(this);
        this.destroyComponent = this.destroyComponent.bind(this);
        this.setupGlobalEventHandlers = this.setupGlobalEventHandlers.bind(this);
    }
    
    /**
     * Initialize component integration
     */
    async initialize() {
        console.log('[ComponentIntegration] Initializing component integration...');
        
        // Register all available components
        this.registerComponents();
        
        // Set up global event handlers
        this.setupGlobalEventHandlers();
        
        // Set up state synchronization
        this.setupStateSync();
        
        console.log('[ComponentIntegration] Component integration initialized');
    }
    
    /**
     * Register all available components
     */
    registerComponents() {
        // Authentication components
        if (typeof LoginComponent !== 'undefined') {
            this.registerComponent('login', LoginComponent, {
                dependencies: ['auth', 'authStateManager', 'notification'],
                events: ['AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILED']
            });
        }
        
        if (typeof RegisterComponent !== 'undefined') {
            this.registerComponent('register', RegisterComponent, {
                dependencies: ['auth', 'authStateManager', 'notification'],
                events: ['AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILED']
            });
        }
        
        // Hotel components
        if (typeof HotelListComponent !== 'undefined') {
            this.registerComponent('hotel-list', HotelListComponent, {
                dependencies: ['hotel', 'auth', 'notification'],
                events: ['HOTELS_LOADED', 'HOTEL_SELECTED', 'HOTEL_SEARCH']
            });
        }
        
        if (typeof HotelDetailComponent !== 'undefined') {
            this.registerComponent('hotel-detail', HotelDetailComponent, {
                dependencies: ['hotel', 'auth', 'review', 'booking', 'notification'],
                events: ['HOTEL_LOADED', 'REVIEW_SUBMITTED', 'BOOKING_CREATED']
            });
        }
        
        if (typeof HotelSearchComponent !== 'undefined') {
            this.registerComponent('hotel-search', HotelSearchComponent, {
                dependencies: ['hotel', 'notification'],
                events: ['HOTEL_SEARCH', 'HOTELS_LOADED']
            });
        }
        
        // Booking components
        if (typeof BookingFormComponent !== 'undefined') {
            this.registerComponent('booking-form', BookingFormComponent, {
                dependencies: ['booking', 'payment', 'loyalty', 'notification'],
                events: ['BOOKING_CREATED', 'BOOKING_PAYMENT_SUCCESS', 'LOYALTY_POINTS_EARNED']
            });
        }
        
        if (typeof EnhancedBookingFormComponent !== 'undefined') {
            this.registerComponent('enhanced-booking-form', EnhancedBookingFormComponent, {
                dependencies: ['booking', 'payment', 'loyalty', 'notification'],
                events: ['BOOKING_CREATED', 'BOOKING_PAYMENT_SUCCESS', 'LOYALTY_POINTS_EARNED']
            });
        }
        
        if (typeof BookingListComponent !== 'undefined') {
            this.registerComponent('booking-list', BookingListComponent, {
                dependencies: ['booking', 'auth', 'notification'],
                events: ['BOOKING_UPDATED', 'BOOKING_CANCELLED']
            });
        }
        
        if (typeof BookingDetailComponent !== 'undefined') {
            this.registerComponent('booking-detail', BookingDetailComponent, {
                dependencies: ['booking', 'payment', 'notification'],
                events: ['BOOKING_UPDATED', 'BOOKING_CANCELLED']
            });
        }
        
        // Payment components
        if (typeof PaymentComponent !== 'undefined') {
            this.registerComponent('payment', PaymentComponent, {
                dependencies: ['payment', 'booking', 'notification'],
                events: ['BOOKING_PAYMENT_SUCCESS']
            });
        }
        
        if (typeof PaymentHistoryComponent !== 'undefined') {
            this.registerComponent('payment-history', PaymentHistoryComponent, {
                dependencies: ['payment', 'auth', 'notification'],
                events: []
            });
        }
        
        if (typeof PaymentConfirmationComponent !== 'undefined') {
            this.registerComponent('payment-confirmation', PaymentConfirmationComponent, {
                dependencies: ['payment', 'booking', 'notification'],
                events: ['BOOKING_PAYMENT_SUCCESS']
            });
        }
        
        // Review components
        if (typeof ReviewFormComponent !== 'undefined') {
            this.registerComponent('review-form', ReviewFormComponent, {
                dependencies: ['review', 'auth', 'notification'],
                events: ['REVIEW_SUBMITTED']
            });
        }
        
        if (typeof ReviewListComponent !== 'undefined') {
            this.registerComponent('review-list', ReviewListComponent, {
                dependencies: ['review', 'notification'],
                events: ['REVIEW_UPDATED', 'REVIEW_DELETED', 'REVIEW_SUBMITTED']
            });
        }
        
        if (typeof ReviewComponent !== 'undefined') {
            this.registerComponent('review', ReviewComponent, {
                dependencies: ['review', 'auth', 'notification'],
                events: ['REVIEW_SUBMITTED', 'REVIEW_UPDATED', 'REVIEW_DELETED']
            });
        }
        
        // Loyalty components
        if (typeof LoyaltyDashboardComponent !== 'undefined') {
            this.registerComponent('loyalty-dashboard', LoyaltyDashboardComponent, {
                dependencies: ['loyalty', 'auth', 'notification'],
                events: ['LOYALTY_ACCOUNT_UPDATED', 'LOYALTY_POINTS_EARNED', 'LOYALTY_POINTS_REDEEMED']
            });
        }
        
        if (typeof LoyaltyPointsWidget !== 'undefined') {
            this.registerComponent('loyalty-points-widget', LoyaltyPointsWidget, {
                dependencies: ['loyalty', 'auth', 'notification'],
                events: ['LOYALTY_POINTS_EARNED', 'LOYALTY_POINTS_REDEEMED', 'LOYALTY_ACCOUNT_UPDATED']
            });
        }
        
        if (typeof LoyaltyNotificationComponent !== 'undefined') {
            this.registerComponent('loyalty-notification', LoyaltyNotificationComponent, {
                dependencies: ['loyalty', 'notification'],
                events: ['LOYALTY_POINTS_EARNED', 'LOYALTY_POINTS_REDEEMED']
            });
        }
        
        // Admin components
        if (typeof AdminDashboardComponent !== 'undefined') {
            this.registerComponent('admin-dashboard', AdminDashboardComponent, {
                dependencies: ['admin', 'auth', 'notification'],
                events: ['BOOKING_UPDATED', 'BOOKING_CANCELLED']
            });
        }
        
        if (typeof HotelManagementComponent !== 'undefined') {
            this.registerComponent('hotel-management', HotelManagementComponent, {
                dependencies: ['admin', 'hotel', 'auth', 'notification'],
                events: ['HOTEL_LOADED', 'HOTELS_LOADED']
            });
        }
        
        console.log(`[ComponentIntegration] Registered ${this.components.size} components`);
    }
    
    /**
     * Register a component with its configuration
     */
    registerComponent(name, componentClass, config = {}) {
        this.components.set(name, {
            class: componentClass,
            dependencies: config.dependencies || [],
            events: config.events || [],
            instances: new Set()
        });
    }
    
    /**
     * Create and initialize a component instance
     */
    async createComponent(name, container, options = {}) {
        const componentConfig = this.components.get(name);
        if (!componentConfig) {
            throw new Error(`Component '${name}' not registered`);
        }
        
        // Prepare dependencies
        const dependencies = this.prepareDependencies(componentConfig.dependencies);
        
        // Create component instance
        let instance;
        try {
            if (typeof container === 'string') {
                container = document.getElementById(container);
            }
            
            // Different component constructors may have different signatures
            switch (name) {
                case 'hotel-detail':
                    instance = new componentConfig.class(
                        container,
                        dependencies.hotel,
                        dependencies.auth,
                        window.FinalDestination.router
                    );
                    break;
                    
                case 'booking-form':
                case 'enhanced-booking-form':
                    instance = new componentConfig.class(
                        container,
                        dependencies.booking,
                        dependencies.payment,
                        dependencies.loyalty
                    );
                    break;
                    
                case 'hotel-list':
                    instance = new componentConfig.class(
                        container,
                        dependencies.hotel,
                        dependencies.auth
                    );
                    break;
                    
                case 'hotel-search':
                    instance = new componentConfig.class(
                        container,
                        dependencies.hotel
                    );
                    break;
                    
                case 'booking-list':
                    instance = new componentConfig.class(
                        container,
                        dependencies.booking,
                        dependencies.auth
                    );
                    break;
                    
                case 'booking-detail':
                    instance = new componentConfig.class(
                        container,
                        dependencies.booking,
                        dependencies.payment
                    );
                    break;
                    
                case 'payment':
                case 'payment-confirmation':
                    instance = new componentConfig.class(
                        container,
                        dependencies.payment,
                        dependencies.booking
                    );
                    break;
                    
                case 'payment-history':
                    instance = new componentConfig.class(
                        container,
                        dependencies.payment,
                        dependencies.auth
                    );
                    break;
                    
                case 'review-form':
                case 'review':
                    instance = new componentConfig.class(
                        container,
                        dependencies.review,
                        dependencies.auth
                    );
                    break;
                    
                case 'review-list':
                    instance = new componentConfig.class(
                        container,
                        dependencies.review
                    );
                    break;
                    
                case 'loyalty-dashboard':
                case 'loyalty-points-widget':
                    instance = new componentConfig.class(
                        container,
                        dependencies.loyalty,
                        dependencies.auth
                    );
                    break;
                    
                case 'loyalty-notification':
                    instance = new componentConfig.class(
                        container,
                        dependencies.loyalty
                    );
                    break;
                    
                case 'admin-dashboard':
                case 'hotel-management':
                    instance = new componentConfig.class(
                        container,
                        dependencies.admin,
                        dependencies.auth
                    );
                    break;
                    
                case 'login':
                case 'register':
                    instance = new componentConfig.class(container);
                    break;
                    
                default:
                    // Generic constructor with container and all dependencies
                    instance = new componentConfig.class(container, dependencies);
                    break;
            }
            
            // Set up component integration
            this.setupComponentIntegration(instance, name, componentConfig);
            
            // Track instance
            const instanceId = this.generateId();
            this.componentInstances.set(instanceId, {
                name,
                instance,
                container,
                options
            });
            componentConfig.instances.add(instanceId);
            
            // Initialize component if it has an init method
            if (typeof instance.init === 'function') {
                await instance.init(options);
            }
            
            // Emit component mounted event
            this.eventBus.emit(EventBus.EVENTS.COMPONENT_MOUNTED, {
                name,
                instanceId,
                instance
            });
            
            console.log(`[ComponentIntegration] Created component: ${name}`);
            return { instance, instanceId };
            
        } catch (error) {
            console.error(`[ComponentIntegration] Error creating component '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Destroy a component instance
     */
    destroyComponent(instanceId) {
        const componentData = this.componentInstances.get(instanceId);
        if (!componentData) {
            return false;
        }
        
        const { name, instance } = componentData;
        
        try {
            // Call component destroy method if available
            if (typeof instance.destroy === 'function') {
                instance.destroy();
            }
            
            // Remove from tracking
            this.componentInstances.delete(instanceId);
            const componentConfig = this.components.get(name);
            if (componentConfig) {
                componentConfig.instances.delete(instanceId);
            }
            
            // Emit component unmounted event
            this.eventBus.emit(EventBus.EVENTS.COMPONENT_UNMOUNTED, {
                name,
                instanceId,
                instance
            });
            
            console.log(`[ComponentIntegration] Destroyed component: ${name}`);
            return true;
            
        } catch (error) {
            console.error(`[ComponentIntegration] Error destroying component '${name}':`, error);
            return false;
        }
    }
    
    /**
     * Set up component integration with state and events
     */
    setupComponentIntegration(instance, name, config) {
        // Set up state subscription if component has state handling
        if (typeof instance.onStateChange === 'function') {
            const unsubscribe = this.stateManager.subscribe((prevState, newState, updates) => {
                instance.onStateChange(newState, prevState, updates);
            });
            
            // Store unsubscribe function for cleanup
            instance._stateUnsubscribe = unsubscribe;
        }
        
        // Set up event bus integration
        if (typeof instance.onEvent === 'function') {
            // Subscribe to relevant events
            for (const eventName of config.events) {
                const unsubscribe = this.eventBus.on(EventBus.EVENTS[eventName], (data) => {
                    instance.onEvent(eventName, data);
                });
                
                // Store unsubscribe functions for cleanup
                if (!instance._eventUnsubscribes) {
                    instance._eventUnsubscribes = [];
                }
                instance._eventUnsubscribes.push(unsubscribe);
            }
        }
        
        // Provide event bus and state manager to component
        instance.eventBus = this.eventBus;
        instance.stateManager = this.stateManager;
        
        // Provide utility methods
        instance.setState = (updates) => {
            this.stateManager.setState(updates, `component:${name}`);
        };
        
        instance.emit = (event, data) => {
            this.eventBus.emit(event, data);
        };
    }
    
    /**
     * Prepare service dependencies for component
     */
    prepareDependencies(dependencyNames) {
        const dependencies = {};
        
        for (const depName of dependencyNames) {
            if (this.services[depName]) {
                dependencies[depName] = this.services[depName];
            } else {
                console.warn(`[ComponentIntegration] Dependency '${depName}' not found`);
            }
        }
        
        return dependencies;
    }
    
    /**
     * Set up global event handlers for component communication
     */
    setupGlobalEventHandlers() {
        // Authentication events
        this.eventBus.on(EventBus.EVENTS.AUTH_LOGIN_SUCCESS, (data) => {
            this.stateManager.setState({
                isAuthenticated: true,
                user: data.user
            }, 'auth:login');
            
            // Load user-specific data
            this.loadUserData(data.user);
        });
        
        this.eventBus.on(EventBus.EVENTS.AUTH_LOGOUT, () => {
            this.stateManager.setState({
                isAuthenticated: false,
                user: null,
                bookings: [],
                loyaltyAccount: null,
                payments: [],
                reviews: []
            }, 'auth:logout');
        });
        
        // Hotel events
        this.eventBus.on(EventBus.EVENTS.HOTELS_LOADED, (data) => {
            this.stateManager.setState({
                hotels: data.hotels || data
            }, 'hotels:loaded');
        });
        
        this.eventBus.on(EventBus.EVENTS.HOTEL_SELECTED, (data) => {
            this.stateManager.setState({
                selectedHotel: data.hotel || data
            }, 'hotel:selected');
        });
        
        this.eventBus.on(EventBus.EVENTS.HOTEL_SEARCH, (data) => {
            this.stateManager.setState({
                searchFilters: data.filters || data
            }, 'hotel:search');
        });
        
        // Booking events
        this.eventBus.on(EventBus.EVENTS.BOOKING_CREATED, (data) => {
            const currentBookings = this.stateManager.getStateProperty('bookings') || [];
            this.stateManager.setState({
                bookings: [...currentBookings, data.booking || data]
            }, 'booking:created');
            
            // Show success notification
            this.showNotification('Booking created successfully!', 'success');
        });
        
        this.eventBus.on(EventBus.EVENTS.BOOKING_UPDATED, (data) => {
            const currentBookings = this.stateManager.getStateProperty('bookings') || [];
            const updatedBookings = currentBookings.map(booking => 
                booking.id === (data.booking?.id || data.id) ? (data.booking || data) : booking
            );
            this.stateManager.setState({
                bookings: updatedBookings
            }, 'booking:updated');
        });
        
        this.eventBus.on(EventBus.EVENTS.BOOKING_CANCELLED, (data) => {
            const currentBookings = this.stateManager.getStateProperty('bookings') || [];
            const updatedBookings = currentBookings.map(booking => 
                booking.id === (data.booking?.id || data.id) 
                    ? { ...(data.booking || data), status: 'Cancelled' }
                    : booking
            );
            this.stateManager.setState({
                bookings: updatedBookings
            }, 'booking:cancelled');
            
            // Show cancellation notification
            this.showNotification('Booking cancelled successfully', 'info');
        });
        
        this.eventBus.on(EventBus.EVENTS.BOOKING_PAYMENT_SUCCESS, (data) => {
            // Update booking status
            const currentBookings = this.stateManager.getStateProperty('bookings') || [];
            const updatedBookings = currentBookings.map(booking => 
                booking.id === (data.booking?.id || data.bookingId) 
                    ? { ...booking, status: 'Confirmed', paymentStatus: 'Paid' }
                    : booking
            );
            
            // Add payment record
            const currentPayments = this.stateManager.getStateProperty('payments') || [];
            const newPayment = data.payment || {
                id: data.paymentId,
                bookingId: data.booking?.id || data.bookingId,
                amount: data.amount,
                status: 'Completed',
                createdAt: new Date().toISOString()
            };
            
            this.stateManager.setState({
                bookings: updatedBookings,
                payments: [...currentPayments, newPayment]
            }, 'booking:payment:success');
            
            // Show success notification
            this.showNotification('Payment processed successfully!', 'success');
        });
        
        // Review events
        this.eventBus.on(EventBus.EVENTS.REVIEW_SUBMITTED, (data) => {
            const currentReviews = this.stateManager.getStateProperty('reviews') || [];
            this.stateManager.setState({
                reviews: [...currentReviews, data.review || data]
            }, 'review:submitted');
            
            // Show success notification
            this.showNotification('Review submitted successfully!', 'success');
        });
        
        this.eventBus.on(EventBus.EVENTS.REVIEW_UPDATED, (data) => {
            const currentReviews = this.stateManager.getStateProperty('reviews') || [];
            const updatedReviews = currentReviews.map(review => 
                review.id === (data.review?.id || data.id) ? (data.review || data) : review
            );
            this.stateManager.setState({
                reviews: updatedReviews
            }, 'review:updated');
        });
        
        this.eventBus.on(EventBus.EVENTS.REVIEW_DELETED, (data) => {
            const currentReviews = this.stateManager.getStateProperty('reviews') || [];
            const filteredReviews = currentReviews.filter(review => 
                review.id !== (data.review?.id || data.id)
            );
            this.stateManager.setState({
                reviews: filteredReviews
            }, 'review:deleted');
        });
        
        // Loyalty events
        this.eventBus.on(EventBus.EVENTS.LOYALTY_POINTS_EARNED, (data) => {
            const currentAccount = this.stateManager.getStateProperty('loyaltyAccount');
            if (currentAccount) {
                this.stateManager.setState({
                    loyaltyAccount: {
                        ...currentAccount,
                        pointsBalance: currentAccount.pointsBalance + (data.points || 0),
                        totalPointsEarned: (currentAccount.totalPointsEarned || 0) + (data.points || 0)
                    }
                }, 'loyalty:points:earned');
                
                // Show points earned notification
                this.showNotification(`You earned ${data.points || 0} loyalty points!`, 'success');
            }
        });
        
        this.eventBus.on(EventBus.EVENTS.LOYALTY_POINTS_REDEEMED, (data) => {
            const currentAccount = this.stateManager.getStateProperty('loyaltyAccount');
            if (currentAccount) {
                this.stateManager.setState({
                    loyaltyAccount: {
                        ...currentAccount,
                        pointsBalance: currentAccount.pointsBalance - (data.points || 0),
                        totalPointsRedeemed: (currentAccount.totalPointsRedeemed || 0) + (data.points || 0)
                    }
                }, 'loyalty:points:redeemed');
                
                // Show points redeemed notification
                this.showNotification(`You redeemed ${data.points || 0} loyalty points!`, 'info');
            }
        });
        
        this.eventBus.on(EventBus.EVENTS.LOYALTY_ACCOUNT_UPDATED, (data) => {
            this.stateManager.setState({
                loyaltyAccount: data.account || data
            }, 'loyalty:account:updated');
        });
        
        // UI events
        this.eventBus.on(EventBus.EVENTS.LOADING_START, () => {
            this.stateManager.setState({ isLoading: true }, 'ui:loading:start');
        });
        
        this.eventBus.on(EventBus.EVENTS.LOADING_END, () => {
            this.stateManager.setState({ isLoading: false }, 'ui:loading:end');
        });
        
        this.eventBus.on(EventBus.EVENTS.ERROR_OCCURRED, (data) => {
            const currentErrors = this.stateManager.getStateProperty('errors') || [];
            this.stateManager.setState({
                errors: [...currentErrors, data.error || data]
            }, 'error:occurred');
            
            // Show error notification
            this.showNotification(data.message || 'An error occurred', 'error');
        });
        
        this.eventBus.on(EventBus.EVENTS.NOTIFICATION_SHOW, (data) => {
            this.showNotification(data.message, data.type || 'info');
        });
        
        // Route change events
        this.eventBus.on(EventBus.EVENTS.ROUTE_CHANGED, (data) => {
            this.stateManager.setState({
                currentRoute: data.route || data
            }, 'route:changed');
        });
    }
    
    /**
     * Load user-specific data after authentication
     */
    async loadUserData(user) {
        try {
            // Load user bookings
            if (this.services.booking) {
                const bookings = await this.services.booking.getUserBookings();
                this.stateManager.setState({ bookings }, 'user:bookings:loaded');
            }
            
            // Load loyalty account
            if (this.services.loyalty) {
                const loyaltyAccount = await this.services.loyalty.getAccount();
                this.stateManager.setState({ loyaltyAccount }, 'user:loyalty:loaded');
            }
            
            // Load payment history
            if (this.services.payment) {
                const payments = await this.services.payment.getPaymentHistory();
                this.stateManager.setState({ payments }, 'user:payments:loaded');
            }
            
        } catch (error) {
            console.error('[ComponentIntegration] Error loading user data:', error);
        }
    }
    
    /**
     * Show notification helper
     */
    showNotification(message, type = 'info') {
        if (window.FinalDestination && window.FinalDestination.utils) {
            window.FinalDestination.utils.showNotification(message, type);
        }
        
        // Also update state
        const currentNotifications = this.stateManager.getStateProperty('notifications') || [];
        this.stateManager.setState({
            notifications: [...currentNotifications, { message, type, timestamp: Date.now() }]
        }, 'notification:added');
    }
    
    /**
     * Set up state synchronization with services
     */
    setupStateSync() {
        // Sync authentication state
        this.stateManager.subscribeToProperty('isAuthenticated', (isAuthenticated) => {
            if (this.services.authStateManager) {
                // Update auth state manager if needed
            }
        });
        
        // Sync loading state with UI
        this.stateManager.subscribeToProperty('isLoading', (isLoading) => {
            if (window.FinalDestination && window.FinalDestination.utils) {
                window.FinalDestination.utils.setLoading(isLoading);
            }
        });
        
        // Sync notifications
        this.stateManager.subscribeToProperty('notifications', (notifications) => {
            // Handle notification display
            if (notifications && notifications.length > 0) {
                const latestNotification = notifications[notifications.length - 1];
                if (window.FinalDestination && window.FinalDestination.utils) {
                    window.FinalDestination.utils.showNotification(
                        latestNotification.message,
                        latestNotification.type
                    );
                }
            }
        });
    }
    
    /**
     * Get all active component instances
     */
    getActiveComponents() {
        return Array.from(this.componentInstances.values());
    }
    
    /**
     * Get component instances by name
     */
    getComponentsByName(name) {
        return Array.from(this.componentInstances.values())
            .filter(comp => comp.name === name);
    }
    
    /**
     * Destroy all components
     */
    destroyAllComponents() {
        const instanceIds = Array.from(this.componentInstances.keys());
        for (const instanceId of instanceIds) {
            this.destroyComponent(instanceId);
        }
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentIntegration;
} else {
    window.ComponentIntegration = ComponentIntegration;
}


