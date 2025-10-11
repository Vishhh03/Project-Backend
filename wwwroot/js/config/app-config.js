/**
 * Application Configuration Manager
 * 
 * Centralized configuration management for the FinalDestination application.
 * Handles environment-specific settings, API endpoints, and feature flags.
 */

class AppConfig {
    constructor() {
        this.config = {
            // Environment settings
            environment: 'development', // development, staging, production
            version: '1.0.0',
            debug: true,
            
            // API Configuration
            api: {
                baseUrl: '/api',
                timeout: 30000, // 30 seconds
                retryAttempts: 3,
                retryDelay: 1000, // 1 second
                endpoints: {
                    auth: {
                        login: '/auth/login',
                        register: '/auth/register',
                        refresh: '/auth/refresh',
                        logout: '/auth/logout'
                    },
                    hotels: {
                        list: '/hotels',
                        detail: '/hotels/{id}',
                        search: '/hotels/search',
                        create: '/hotels',
                        update: '/hotels/{id}',
                        delete: '/hotels/{id}'
                    },
                    bookings: {
                        list: '/bookings',
                        detail: '/bookings/{id}',
                        create: '/bookings',
                        update: '/bookings/{id}',
                        cancel: '/bookings/{id}/cancel',
                        search: '/bookings/search'
                    },
                    payments: {
                        process: '/payments/process',
                        history: '/payments/history',
                        refund: '/payments/{id}/refund'
                    },
                    reviews: {
                        list: '/reviews',
                        create: '/reviews',
                        update: '/reviews/{id}',
                        delete: '/reviews/{id}',
                        byHotel: '/hotels/{hotelId}/reviews'
                    },
                    loyalty: {
                        account: '/loyalty/account',
                        transactions: '/loyalty/transactions',
                        redeem: '/loyalty/redeem'
                    },
                    admin: {
                        users: '/admin/users',
                        bookings: '/admin/bookings',
                        hotels: '/admin/hotels',
                        refunds: '/admin/refunds'
                    }
                }
            },
            
            // UI Configuration
            ui: {
                theme: 'default',
                language: 'en',
                dateFormat: 'MM/DD/YYYY',
                currencyFormat: 'USD',
                itemsPerPage: 10,
                searchDebounceDelay: 300,
                notificationTimeout: 5000,
                loadingTimeout: 30000
            },
            
            // Cache Configuration
            cache: {
                enabled: true,
                defaultTTL: 300000, // 5 minutes
                maxSize: 100, // Maximum number of cached items
                strategies: {
                    hotels: 600000, // 10 minutes
                    bookings: 60000, // 1 minute
                    reviews: 300000, // 5 minutes
                    loyalty: 120000 // 2 minutes
                }
            },
            
            // Security Configuration
            security: {
                tokenStorageKey: 'simple_hotel_token',
                tokenRefreshThreshold: 300000, // 5 minutes before expiry
                maxLoginAttempts: 5,
                lockoutDuration: 900000, // 15 minutes
                csrfEnabled: true,
                httpsOnly: false // Set to true in production
            },
            
            // Performance Configuration
            performance: {
                lazyLoadImages: true,
                virtualScrolling: true,
                componentCaching: true,
                bundleOptimization: true,
                compressionEnabled: true
            },
            
            // Accessibility Configuration
            accessibility: {
                highContrast: false,
                reducedMotion: false,
                screenReaderSupport: true,
                keyboardNavigation: true,
                focusManagement: true
            },
            
            // Feature Flags
            features: {
                loyaltyProgram: true,
                paymentProcessing: true,
                reviewSystem: true,
                adminPanel: true,
                hotelManagement: true,
                offlineSupport: true,
                pushNotifications: false,
                socialLogin: false,
                multiLanguage: false
            },
            
            // Validation Rules
            validation: {
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                },
                password: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: false
                },
                booking: {
                    maxAdvanceBookingDays: 365,
                    minAdvanceBookingHours: 2,
                    maxGuestsPerRoom: 4
                },
                review: {
                    minRating: 1,
                    maxRating: 5,
                    maxCommentLength: 1000
                }
            }
        };
        
        // Load environment-specific overrides
        this.loadEnvironmentConfig();
        
        // Load user preferences
        this.loadUserPreferences();
    }
    
    /**
     * Get configuration value by path
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        
        // Save user preferences if it's a UI setting
        if (path.startsWith('ui.') || path.startsWith('accessibility.')) {
            this.saveUserPreferences();
        }
    }
    
    /**
     * Get API endpoint URL with parameter substitution
     */
    getApiEndpoint(path, params = {}) {
        const endpoint = this.get(`api.endpoints.${path}`);
        if (!endpoint) {
            throw new Error(`API endpoint not found: ${path}`);
        }
        
        let url = this.get('api.baseUrl') + endpoint;
        
        // Substitute parameters
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`{${key}}`, encodeURIComponent(value));
        }
        
        return url;
    }
    
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    }
    
    /**
     * Get validation rules for a field
     */
    getValidationRules(field) {
        return this.get(`validation.${field}`, {});
    }
    
    /**
     * Load environment-specific configuration
     */
    loadEnvironmentConfig() {
        // Detect environment
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.config.environment = 'development';
            this.config.debug = true;
            this.config.security.httpsOnly = false;
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            this.config.environment = 'staging';
            this.config.debug = false;
            this.config.security.httpsOnly = true;
        } else {
            this.config.environment = 'production';
            this.config.debug = false;
            this.config.security.httpsOnly = true;
            this.config.performance.bundleOptimization = true;
            this.config.performance.compressionEnabled = true;
        }
        
        // Adjust API timeout based on environment
        if (this.config.environment === 'development') {
            this.config.api.timeout = 60000; // 1 minute for development
        }
        
        // Load from meta tags if available
        const configMeta = document.querySelector('meta[name="app-config"]');
        if (configMeta) {
            try {
                const metaConfig = JSON.parse(configMeta.content);
                this.mergeConfig(metaConfig);
            } catch (error) {
                console.warn('[AppConfig] Failed to parse meta config:', error);
            }
        }
    }
    
    /**
     * Load user preferences from storage
     */
    loadUserPreferences() {
        try {
            const stored = localStorage.getItem('simple_hotel_preferences');
            if (stored) {
                const preferences = JSON.parse(stored);
                
                // Merge UI preferences
                if (preferences.ui) {
                    this.mergeConfig({ ui: preferences.ui });
                }
                
                // Merge accessibility preferences
                if (preferences.accessibility) {
                    this.mergeConfig({ accessibility: preferences.accessibility });
                }
            }
        } catch (error) {
            console.warn('[AppConfig] Failed to load user preferences:', error);
        }
        
        // Load system preferences
        this.loadSystemPreferences();
    }
    
    /**
     * Load system preferences (media queries, etc.)
     */
    loadSystemPreferences() {
        // Check for reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.config.accessibility.reducedMotion = true;
        }
        
        // Check for high contrast preference
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            this.config.accessibility.highContrast = true;
        }
        
        // Check for color scheme preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.config.ui.theme = 'dark';
        }
    }
    
    /**
     * Save user preferences to storage
     */
    saveUserPreferences() {
        try {
            const preferences = {
                ui: this.config.ui,
                accessibility: this.config.accessibility
            };
            
            localStorage.setItem('simple_hotel_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('[AppConfig] Failed to save user preferences:', error);
        }
    }
    
    /**
     * Merge configuration objects
     */
    mergeConfig(newConfig) {
        this.config = this.deepMerge(this.config, newConfig);
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
     * Get all configuration
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.config));
    }
    
    /**
     * Reset to default configuration
     */
    reset() {
        localStorage.removeItem('simple_hotel_preferences');
        this.loadEnvironmentConfig();
        this.loadUserPreferences();
    }
    
    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        
        // Validate required settings
        if (!this.config.api.baseUrl) {
            errors.push('API base URL is required');
        }
        
        if (!this.config.version) {
            errors.push('Application version is required');
        }
        
        // Validate API endpoints
        const requiredEndpoints = ['auth.login', 'hotels.list', 'bookings.list'];
        for (const endpoint of requiredEndpoints) {
            if (!this.get(`api.endpoints.${endpoint}`)) {
                errors.push(`Required API endpoint missing: ${endpoint}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}


