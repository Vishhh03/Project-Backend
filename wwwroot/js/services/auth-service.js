/**
 * AuthService - User authentication service
 * Handles login, register, logout, JWT token management, and role-based authorization
 */
class AuthService {
    constructor() {
        this.apiClient = new ApiClient();
        this.storageService = new StorageService();
        this.currentUser = null;
        this.authStateListeners = [];
        this.tokenRefreshTimer = null;
        
        // Initialize service
        this.initialize();
    }

    /**
     * Initialize the authentication service
     * Check for existing token and set up automatic refresh
     */
    initialize() {
        const token = this.storageService.getToken();
        if (token) {
            this.apiClient.setToken(token);
            this.currentUser = this.storageService.getCurrentUser();
            this.setupTokenRefresh();
        }
    }

    /**
     * Login with email and password
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<Object>} Authentication response with user data
     */
    async login(email, password) {
        try {
            const loginData = {
                email: email.trim(),
                password: password
            };

            const response = await this.apiClient.post('/auth/login', loginData);
            
            if (response.token) {
                // Store token with expiration
                const expirationMinutes = this.calculateTokenExpirationMinutes(response.expiresAt);
                this.storageService.setToken(response.token, expirationMinutes);
                
                // Store user data
                this.storageService.setCurrentUser(response.user);
                
                // Set token in API client
                this.apiClient.setToken(response.token);
                
                // Update current user
                this.currentUser = response.user;
                
                // Setup automatic token refresh
                this.setupTokenRefresh();
                
                // Notify listeners of auth state change
                this.notifyAuthStateChange(true, response.user);
                
                return response;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    }

    /**
     * Register a new user account
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Authentication response with user data
     */
    async register(userData) {
        try {
            const registerData = {
                name: userData.name.trim(),
                email: userData.email.trim(),
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                role: userData.role || 1, // Default to Guest (1)
                contactNumber: userData.contactNumber?.trim() || null
            };

            const response = await this.apiClient.post('/auth/register', registerData);
            
            if (response.token) {
                // Store token with expiration
                const expirationMinutes = this.calculateTokenExpirationMinutes(response.expiresAt);
                this.storageService.setToken(response.token, expirationMinutes);
                
                // Store user data
                this.storageService.setCurrentUser(response.user);
                
                // Set token in API client
                this.apiClient.setToken(response.token);
                
                // Update current user
                this.currentUser = response.user;
                
                // Setup automatic token refresh
                this.setupTokenRefresh();
                
                // Notify listeners of auth state change
                this.notifyAuthStateChange(true, response.user);
                
                return response;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }

    /**
     * Logout the current user
     * Clears all stored authentication data
     */
    async logout() {
        try {
            // Clear token refresh timer
            if (this.tokenRefreshTimer) {
                clearTimeout(this.tokenRefreshTimer);
                this.tokenRefreshTimer = null;
            }
            
            // Clear stored data
            this.storageService.clearToken();
            this.storageService.clearCurrentUser();
            
            // Clear API client token
            this.apiClient.clearToken();
            
            // Clear current user
            this.currentUser = null;
            
            // Notify listeners of auth state change
            this.notifyAuthStateChange(false, null);
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, we should clear local data
            this.storageService.clearToken();
            this.storageService.clearCurrentUser();
            this.apiClient.clearToken();
            this.currentUser = null;
            this.notifyAuthStateChange(false, null);
            return true;
        }
    }

    /**
     * Get current user information from the server
     * @returns {Promise<Object>} Current user data
     */
    async getCurrentUser() {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const response = await this.apiClient.get('/auth/me');
            
            // Update stored user data
            this.storageService.setCurrentUser(response);
            this.currentUser = response;
            
            return response;
        } catch (error) {
            console.error('Failed to get current user:', error);
            
            // If token is invalid, logout
            if (error.status === 401) {
                await this.logout();
            }
            
            throw error;
        }
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean} True if user has valid token
     */
    isAuthenticated() {
        return this.storageService.hasValidToken() && this.currentUser !== null;
    }

    /**
     * Get the current JWT token
     * @returns {string|null} JWT token or null if not authenticated
     */
    getToken() {
        return this.storageService.getToken();
    }

    /**
     * Check if current user has specific role
     * @param {string|number} role - Role to check (name or ID)
     * @returns {boolean} True if user has the specified role
     */
    hasRole(role) {
        if (!this.currentUser) {
            return false;
        }

        // Convert role names to numbers for comparison
        const roleMap = {
            'guest': 1,
            'hotelmanager': 2,
            'admin': 3
        };

        let targetRole;
        if (typeof role === 'string') {
            targetRole = roleMap[role.toLowerCase()];
        } else {
            targetRole = role;
        }

        return this.currentUser.role === targetRole;
    }

    /**
     * Check if current user has any of the specified roles
     * @param {Array} roles - Array of roles to check
     * @returns {boolean} True if user has any of the specified roles
     */
    hasAnyRole(roles) {
        return roles.some(role => this.hasRole(role));
    }

    /**
     * Check if current user has admin privileges
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Check if current user is a hotel manager
     * @returns {boolean} True if user is hotel manager
     */
    isHotelManager() {
        return this.hasRole('hotelmanager');
    }

    /**
     * Check if current user is a guest
     * @returns {boolean} True if user is guest
     */
    isGuest() {
        return this.hasRole('guest');
    }

    /**
     * Refresh the JWT token
     * @returns {Promise<boolean>} True if refresh successful
     */
    async refreshToken() {
        try {
            // For now, we'll get current user which validates the token
            // In a full implementation, you might have a dedicated refresh endpoint
            await this.getCurrentUser();
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            
            // If refresh fails, logout the user
            await this.logout();
            return false;
        }
    }

    /**
     * Setup automatic token refresh
     * Refreshes token when it's about to expire
     */
    setupTokenRefresh() {
        // Clear existing timer
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }

        const expiry = this.storageService.getTokenExpiry();
        if (!expiry) return;

        // Refresh token 5 minutes before expiration
        const refreshTime = expiry - Date.now() - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
            this.tokenRefreshTimer = setTimeout(async () => {
                try {
                    await this.refreshToken();
                } catch (error) {
                    console.error('Automatic token refresh failed:', error);
                }
            }, refreshTime);
        }
    }

    /**
     * Add listener for authentication state changes
     * @param {Function} callback - Callback function to call on auth state change
     */
    onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.push(callback);
        }
    }

    /**
     * Remove authentication state change listener
     * @param {Function} callback - Callback function to remove
     */
    removeAuthStateListener(callback) {
        this.authStateListeners = this.authStateListeners.filter(
            listener => listener !== callback
        );
    }

    /**
     * Notify all listeners of authentication state change
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @param {Object|null} user - User data or null
     */
    notifyAuthStateChange(isAuthenticated, user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(isAuthenticated, user);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Calculate token expiration in minutes from expiration date
     * @param {string} expiresAt - ISO date string
     * @returns {number} Minutes until expiration
     */
    calculateTokenExpirationMinutes(expiresAt) {
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();
        const diffInMinutes = Math.floor((expirationTime - currentTime) / (1000 * 60));
        
        // Ensure minimum of 1 minute, maximum of 24 hours
        return Math.max(1, Math.min(diffInMinutes, 24 * 60));
    }

    /**
     * Get user role name from role ID
     * @param {number} roleId - Role ID
     * @returns {string} Role name
     */
    getRoleName(roleId) {
        const roleNames = {
            1: 'Guest',
            2: 'Hotel Manager',
            3: 'Admin'
        };
        
        return roleNames[roleId] || 'Unknown';
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if email is valid
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        
        if (password.length > 100) {
            errors.push('Password cannot exceed 100 characters');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one digit');
        }
        
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get current user data (cached)
     * @returns {Object|null} Current user data or null
     */
    getCurrentUserData() {
        return this.currentUser;
    }

    /**
     * Check if token is expiring soon
     * @param {number} minutes - Minutes to check ahead (default: 5)
     * @returns {boolean} True if token expires within specified time
     */
    isTokenExpiringSoon(minutes = 5) {
        return this.storageService.isTokenExpiringSoon(minutes);
    }

    /**
     * Force token refresh if expiring soon
     * @returns {Promise<boolean>} True if refresh was performed or not needed
     */
    async ensureTokenFresh() {
        if (this.isTokenExpiringSoon()) {
            return await this.refreshToken();
        }
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}

// Make available globally
window.AuthService = AuthService;


