/**
 * StorageService - Client-side data persistence with secure token storage
 * Provides localStorage and sessionStorage wrappers with expiration handling
 * and data serialization/deserialization
 */
class StorageService {
    constructor() {
        this.localStorage = window.localStorage;
        this.sessionStorage = window.sessionStorage;
        this.TOKEN_KEY = 'hotel_auth_token';
        this.TOKEN_EXPIRY_KEY = 'hotel_auth_token_expiry';
        this.USER_KEY = 'hotel_current_user';
    }

    /**
     * Set data in localStorage with optional expiration
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @param {number} expirationMinutes - Optional expiration in minutes
     */
    setLocal(key, value, expirationMinutes = null) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                expiry: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
            };
            
            this.localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error setting localStorage item:', error);
            return false;
        }
    }

    /**
     * Get data from localStorage with expiration check
     * @param {string} key - Storage key
     * @returns {any} Stored value or null if expired/not found
     */
    getLocal(key) {
        try {
            const item = this.localStorage.getItem(key);
            if (!item) return null;

            const data = JSON.parse(item);
            
            // Check if item has expired
            if (data.expiry && Date.now() > data.expiry) {
                this.removeLocal(key);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('Error getting localStorage item:', error);
            return null;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    removeLocal(key) {
        try {
            this.localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage item:', error);
            return false;
        }
    }

    /**
     * Set data in sessionStorage with optional expiration
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @param {number} expirationMinutes - Optional expiration in minutes
     */
    setSession(key, value, expirationMinutes = null) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                expiry: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
            };
            
            this.sessionStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error setting sessionStorage item:', error);
            return false;
        }
    }

    /**
     * Get data from sessionStorage with expiration check
     * @param {string} key - Storage key
     * @returns {any} Stored value or null if expired/not found
     */
    getSession(key) {
        try {
            const item = this.sessionStorage.getItem(key);
            if (!item) return null;

            const data = JSON.parse(item);
            
            // Check if item has expired
            if (data.expiry && Date.now() > data.expiry) {
                this.removeSession(key);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('Error getting sessionStorage item:', error);
            return null;
        }
    }

    /**
     * Remove item from sessionStorage
     * @param {string} key - Storage key
     */
    removeSession(key) {
        try {
            this.sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing sessionStorage item:', error);
            return false;
        }
    }

    /**
     * Secure token storage with automatic expiration
     * @param {string} token - JWT token
     * @param {number} expirationMinutes - Token expiration in minutes (default: 60)
     */
    setToken(token, expirationMinutes = 60) {
        try {
            // Store token with expiration
            const success = this.setLocal(this.TOKEN_KEY, token, expirationMinutes);
            
            if (success) {
                // Store expiration timestamp for easy checking
                const expiryTime = Date.now() + (expirationMinutes * 60 * 1000);
                this.setLocal(this.TOKEN_EXPIRY_KEY, expiryTime);
            }
            
            return success;
        } catch (error) {
            console.error('Error storing token:', error);
            return false;
        }
    }

    /**
     * Get stored token if not expired
     * @returns {string|null} JWT token or null if expired/not found
     */
    getToken() {
        return this.getLocal(this.TOKEN_KEY);
    }

    /**
     * Check if token exists and is not expired
     * @returns {boolean} True if valid token exists
     */
    hasValidToken() {
        const token = this.getToken();
        return token !== null;
    }

    /**
     * Get token expiration time
     * @returns {number|null} Expiration timestamp or null
     */
    getTokenExpiry() {
        return this.getLocal(this.TOKEN_EXPIRY_KEY);
    }

    /**
     * Check if token will expire within specified minutes
     * @param {number} minutes - Minutes to check ahead
     * @returns {boolean} True if token expires within specified time
     */
    isTokenExpiringSoon(minutes = 5) {
        const expiry = this.getTokenExpiry();
        if (!expiry) return false;
        
        const warningTime = Date.now() + (minutes * 60 * 1000);
        return expiry <= warningTime;
    }

    /**
     * Remove stored token and related data
     */
    clearToken() {
        this.removeLocal(this.TOKEN_KEY);
        this.removeLocal(this.TOKEN_EXPIRY_KEY);
        this.removeLocal(this.USER_KEY);
    }

    /**
     * Store current user data
     * @param {object} user - User object
     */
    setCurrentUser(user) {
        return this.setLocal(this.USER_KEY, user);
    }

    /**
     * Get current user data
     * @returns {object|null} User object or null
     */
    getCurrentUser() {
        return this.getLocal(this.USER_KEY);
    }

    /**
     * Clear current user data
     */
    clearCurrentUser() {
        this.removeLocal(this.USER_KEY);
    }

    /**
     * Serialize complex objects for storage
     * @param {any} data - Data to serialize
     * @returns {string} Serialized data
     */
    serialize(data) {
        try {
            return JSON.stringify(data);
        } catch (error) {
            console.error('Error serializing data:', error);
            return null;
        }
    }

    /**
     * Deserialize stored data
     * @param {string} serializedData - Serialized data string
     * @returns {any} Deserialized data or null
     */
    deserialize(serializedData) {
        try {
            return JSON.parse(serializedData);
        } catch (error) {
            console.error('Error deserializing data:', error);
            return null;
        }
    }

    /**
     * Clear all stored data (localStorage and sessionStorage)
     */
    clearAll() {
        try {
            this.localStorage.clear();
            this.sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {object} Storage usage stats
     */
    getStorageInfo() {
        try {
            const localStorageSize = new Blob(Object.values(this.localStorage)).size;
            const sessionStorageSize = new Blob(Object.values(this.sessionStorage)).size;
            
            return {
                localStorage: {
                    itemCount: this.localStorage.length,
                    estimatedSize: localStorageSize
                },
                sessionStorage: {
                    itemCount: this.sessionStorage.length,
                    estimatedSize: sessionStorageSize
                }
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    /**
     * Check if storage is available
     * @returns {object} Storage availability status
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            const testValue = 'test';
            
            // Test localStorage
            let localStorageAvailable = false;
            try {
                this.localStorage.setItem(testKey, testValue);
                if (this.localStorage.getItem(testKey) === testValue) {
                    localStorageAvailable = true;
                    this.localStorage.removeItem(testKey);
                }
            } catch (e) {
                localStorageAvailable = false;
            }
            
            // Test sessionStorage
            let sessionStorageAvailable = false;
            try {
                this.sessionStorage.setItem(testKey, testValue);
                if (this.sessionStorage.getItem(testKey) === testValue) {
                    sessionStorageAvailable = true;
                    this.sessionStorage.removeItem(testKey);
                }
            } catch (e) {
                sessionStorageAvailable = false;
            }
            
            return {
                localStorage: localStorageAvailable,
                sessionStorage: sessionStorageAvailable
            };
        } catch (error) {
            console.error('Error checking storage availability:', error);
            return {
                localStorage: false,
                sessionStorage: false
            };
        }
    }

    /**
     * Clean up expired items from storage
     */
    cleanupExpiredItems() {
        try {
            const now = Date.now();
            
            // Clean localStorage
            for (let i = this.localStorage.length - 1; i >= 0; i--) {
                const key = this.localStorage.key(i);
                if (key) {
                    try {
                        const item = this.localStorage.getItem(key);
                        const data = JSON.parse(item);
                        
                        if (data.expiry && now > data.expiry) {
                            this.localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Skip invalid items
                        continue;
                    }
                }
            }
            
            // Clean sessionStorage
            for (let i = this.sessionStorage.length - 1; i >= 0; i--) {
                const key = this.sessionStorage.key(i);
                if (key) {
                    try {
                        const item = this.sessionStorage.getItem(key);
                        const data = JSON.parse(item);
                        
                        if (data.expiry && now > data.expiry) {
                            this.sessionStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Skip invalid items
                        continue;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error cleaning up expired items:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}

// Make available globally
window.StorageService = StorageService;


