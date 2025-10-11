/**
 * Event Bus for Component Communication
 * 
 * Provides a centralized event system for components to communicate
 * without tight coupling. Supports event namespacing and middleware.
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.middleware = [];
        this.debugMode = false;
        
        // Bind methods
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
        this.emit = this.emit.bind(this);
        this.once = this.once.bind(this);
    }
    
    /**
     * Subscribe to an event
     */
    on(event, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            namespace: options.namespace || null,
            id: this.generateId()
        };
        
        const listeners = this.events.get(event);
        listeners.push(listener);
        
        // Sort by priority (higher priority first)
        listeners.sort((a, b) => b.priority - a.priority);
        
        this.log(`Subscribed to event: ${event}`, listener);
        
        // Return unsubscribe function
        return () => this.off(event, listener.id);
    }
    
    /**
     * Subscribe to an event once
     */
    once(event, callback, options = {}) {
        return this.on(event, callback, { ...options, once: true });
    }
    
    /**
     * Unsubscribe from an event
     */
    off(event, callbackOrId) {
        if (!this.events.has(event)) {
            return false;
        }
        
        const listeners = this.events.get(event);
        let removed = false;
        
        if (typeof callbackOrId === 'string') {
            // Remove by ID
            const index = listeners.findIndex(listener => listener.id === callbackOrId);
            if (index > -1) {
                listeners.splice(index, 1);
                removed = true;
            }
        } else if (typeof callbackOrId === 'function') {
            // Remove by callback function
            const index = listeners.findIndex(listener => listener.callback === callbackOrId);
            if (index > -1) {
                listeners.splice(index, 1);
                removed = true;
            }
        } else {
            // Remove all listeners for this event
            this.events.delete(event);
            removed = true;
        }
        
        // Clean up empty event arrays
        if (listeners.length === 0) {
            this.events.delete(event);
        }
        
        if (removed) {
            this.log(`Unsubscribed from event: ${event}`);
        }
        
        return removed;
    }
    
    /**
     * Emit an event
     */
    async emit(event, data = null, options = {}) {
        this.log(`Emitting event: ${event}`, data);
        
        // Apply middleware
        let processedData = data;
        for (const middleware of this.middleware) {
            try {
                processedData = await middleware(event, processedData, options);
            } catch (error) {
                console.error(`[EventBus] Middleware error for event ${event}:`, error);
            }
        }
        
        if (!this.events.has(event)) {
            this.log(`No listeners for event: ${event}`);
            return [];
        }
        
        const listeners = this.events.get(event);
        const results = [];
        const listenersToRemove = [];
        
        for (const listener of listeners) {
            try {
                // Check namespace filter
                if (options.namespace && listener.namespace && 
                    options.namespace !== listener.namespace) {
                    continue;
                }
                
                const result = await listener.callback(processedData, event, options);
                results.push(result);
                
                // Mark once listeners for removal
                if (listener.once) {
                    listenersToRemove.push(listener.id);
                }
                
            } catch (error) {
                console.error(`[EventBus] Error in listener for event ${event}:`, error);
                results.push({ error });
            }
        }
        
        // Remove once listeners
        for (const id of listenersToRemove) {
            this.off(event, id);
        }
        
        return results;
    }
    
    /**
     * Emit event synchronously (non-async callbacks only)
     */
    emitSync(event, data = null, options = {}) {
        this.log(`Emitting sync event: ${event}`, data);
        
        if (!this.events.has(event)) {
            this.log(`No listeners for event: ${event}`);
            return [];
        }
        
        const listeners = this.events.get(event);
        const results = [];
        const listenersToRemove = [];
        
        for (const listener of listeners) {
            try {
                // Check namespace filter
                if (options.namespace && listener.namespace && 
                    options.namespace !== listener.namespace) {
                    continue;
                }
                
                const result = listener.callback(data, event, options);
                results.push(result);
                
                // Mark once listeners for removal
                if (listener.once) {
                    listenersToRemove.push(listener.id);
                }
                
            } catch (error) {
                console.error(`[EventBus] Error in sync listener for event ${event}:`, error);
                results.push({ error });
            }
        }
        
        // Remove once listeners
        for (const id of listenersToRemove) {
            this.off(event, id);
        }
        
        return results;
    }
    
    /**
     * Add middleware for event processing
     */
    addMiddleware(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        
        this.middleware.push(middleware);
        this.log('Added middleware');
    }
    
    /**
     * Remove middleware
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
            this.log('Removed middleware');
            return true;
        }
        return false;
    }
    
    /**
     * Get all event names
     */
    getEvents() {
        return Array.from(this.events.keys());
    }
    
    /**
     * Get listener count for an event
     */
    getListenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }
    
    /**
     * Clear all listeners
     */
    clear() {
        this.events.clear();
        this.log('Cleared all event listeners');
    }
    
    /**
     * Clear listeners by namespace
     */
    clearNamespace(namespace) {
        for (const [event, listeners] of this.events) {
            const filteredListeners = listeners.filter(listener => 
                listener.namespace !== namespace
            );
            
            if (filteredListeners.length === 0) {
                this.events.delete(event);
            } else {
                this.events.set(event, filteredListeners);
            }
        }
        
        this.log(`Cleared listeners for namespace: ${namespace}`);
    }
    
    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * Log debug messages
     */
    log(message, data = null) {
        if (this.debugMode || (window.FinalDestination && window.FinalDestination.config && window.FinalDestination.config.debug)) {
            if (data) {
                console.log(`[EventBus] ${message}`, data);
            } else {
                console.log(`[EventBus] ${message}`);
            }
        }
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Predefined event constants for better maintainability
EventBus.EVENTS = {
    // Authentication events
    AUTH_LOGIN_SUCCESS: 'auth:login:success',
    AUTH_LOGIN_FAILED: 'auth:login:failed',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_TOKEN_EXPIRED: 'auth:token:expired',
    AUTH_STATE_CHANGED: 'auth:state:changed',
    
    // Navigation events
    ROUTE_CHANGED: 'route:changed',
    ROUTE_BEFORE_CHANGE: 'route:before:change',
    
    // Hotel events
    HOTEL_SELECTED: 'hotel:selected',
    HOTEL_SEARCH: 'hotel:search',
    HOTEL_LOADED: 'hotel:loaded',
    HOTELS_LOADED: 'hotels:loaded',
    
    // Booking events
    BOOKING_CREATED: 'booking:created',
    BOOKING_UPDATED: 'booking:updated',
    BOOKING_CANCELLED: 'booking:cancelled',
    BOOKING_PAYMENT_SUCCESS: 'booking:payment:success',
    
    // Review events
    REVIEW_SUBMITTED: 'review:submitted',
    REVIEW_UPDATED: 'review:updated',
    REVIEW_DELETED: 'review:deleted',
    
    // Loyalty events
    LOYALTY_POINTS_EARNED: 'loyalty:points:earned',
    LOYALTY_POINTS_REDEEMED: 'loyalty:points:redeemed',
    LOYALTY_ACCOUNT_UPDATED: 'loyalty:account:updated',
    
    // UI events
    NOTIFICATION_SHOW: 'notification:show',
    NOTIFICATION_HIDE: 'notification:hide',
    LOADING_START: 'loading:start',
    LOADING_END: 'loading:end',
    ERROR_OCCURRED: 'error:occurred',
    
    // Component events
    COMPONENT_MOUNTED: 'component:mounted',
    COMPONENT_UNMOUNTED: 'component:unmounted',
    COMPONENT_UPDATED: 'component:updated'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
} else {
    window.EventBus = EventBus;
}


