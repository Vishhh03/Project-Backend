/**
 * Application State Manager
 * 
 * Centralized state management for the FinalDestination application.
 * Provides reactive state updates and component communication.
 */

class StateManager {
    constructor() {
        this.state = {
            // User state
            user: null,
            isAuthenticated: false,
            
            // Application state
            isLoading: false,
            currentRoute: null,
            
            // Data state
            hotels: [],
            bookings: [],
            reviews: [],
            loyaltyAccount: null,
            payments: [],
            
            // UI state
            notifications: [],
            errors: [],
            searchFilters: {},
            selectedHotel: null,
            
            // Cache state
            cache: new Map(),
            cacheTimestamps: new Map()
        };
        
        this.subscribers = new Map();
        this.middleware = [];
        
        // Bind methods
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
    }
    
    /**
     * Get current state (immutable copy)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    /**
     * Get specific state property
     */
    getStateProperty(path) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Set state with optional middleware processing
     */
    setState(updates, source = 'unknown') {
        const previousState = this.getState();
        
        // Apply middleware
        let processedUpdates = updates;
        for (const middleware of this.middleware) {
            processedUpdates = middleware(processedUpdates, previousState, source);
        }
        
        // Merge updates into state
        this.state = this.deepMerge(this.state, processedUpdates);
        
        // Notify subscribers
        this.notifySubscribers(previousState, this.getState(), processedUpdates, source);
        
        // Log state changes in debug mode
        if (window.FinalDestination && window.FinalDestination.config && window.FinalDestination.config.debug) {
            console.log('[StateManager] State updated:', {
                source,
                updates: processedUpdates,
                newState: this.getState()
            });
        }
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(callback, filter = null) {
        const id = this.generateId();
        this.subscribers.set(id, { callback, filter });
        
        return () => this.unsubscribe(id);
    }
    
    /**
     * Subscribe to specific state property changes
     */
    subscribeToProperty(property, callback) {
        return this.subscribe((prevState, newState, updates) => {
            const prevValue = this.getPropertyFromState(prevState, property);
            const newValue = this.getPropertyFromState(newState, property);
            
            if (prevValue !== newValue) {
                callback(newValue, prevValue, updates);
            }
        });
    }
    
    /**
     * Unsubscribe from state changes
     */
    unsubscribe(id) {
        return this.subscribers.delete(id);
    }
    
    /**
     * Add middleware for state processing
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }
    
    /**
     * Remove middleware
     */
    removeMiddleware(middleware) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
        }
    }
    
    /**
     * Reset state to initial values
     */
    reset() {
        const initialState = {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            currentRoute: null,
            hotels: [],
            bookings: [],
            reviews: [],
            loyaltyAccount: null,
            payments: [],
            notifications: [],
            errors: [],
            searchFilters: {},
            selectedHotel: null,
            cache: new Map(),
            cacheTimestamps: new Map()
        };
        
        this.setState(initialState, 'reset');
    }
    
    /**
     * Cache management
     */
    setCache(key, data, ttl = 300000) { // 5 minutes default TTL
        this.state.cache.set(key, data);
        this.state.cacheTimestamps.set(key, Date.now() + ttl);
    }
    
    getCache(key) {
        const timestamp = this.state.cacheTimestamps.get(key);
        if (!timestamp || Date.now() > timestamp) {
            this.state.cache.delete(key);
            this.state.cacheTimestamps.delete(key);
            return null;
        }
        
        return this.state.cache.get(key);
    }
    
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const key of this.state.cache.keys()) {
                if (regex.test(key)) {
                    this.state.cache.delete(key);
                    this.state.cacheTimestamps.delete(key);
                }
            }
        } else {
            this.state.cache.clear();
            this.state.cacheTimestamps.clear();
        }
    }
    
    /**
     * Notify all subscribers of state changes
     */
    notifySubscribers(previousState, newState, updates, source) {
        for (const [id, { callback, filter }] of this.subscribers) {
            try {
                if (!filter || filter(previousState, newState, updates, source)) {
                    callback(previousState, newState, updates, source);
                }
            } catch (error) {
                console.error(`[StateManager] Error in subscriber ${id}:`, error);
            }
        }
    }
    
    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Get property from state object using dot notation
     */
    getPropertyFromState(state, property) {
        const keys = property.split('.');
        let value = state;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Generate unique ID for subscribers
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
} else {
    window.StateManager = StateManager;
}


