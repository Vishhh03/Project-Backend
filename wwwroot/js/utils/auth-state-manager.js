/**
 * AuthStateManager - Manages authentication state across the application
 * Handles automatic login status checking, protected routes, and state persistence
 */
class AuthStateManager {
    constructor() {
        this.authService = null;
        this.router = null;
        this.storageService = new StorageService();
        this.isInitialized = false;
        this.authStateListeners = [];
        this.protectedRoutes = new Set();
        this.publicRoutes = new Set(['/login', '/register', '/', '/hotels']);
        this.roleBasedRoutes = new Map();
        
        // Bind methods to preserve context
        this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.checkAuthOnVisibilityChange = this.checkAuthOnVisibilityChange.bind(this);
        this.checkAuthOnFocus = this.checkAuthOnFocus.bind(this);
    }

    /**
     * Initialize the authentication state manager
     * @param {AuthService} authService - Authentication service instance
     * @param {Router} router - Router instance
     */
    async initialize(authService, router) {
        if (this.isInitialized) {
            console.warn('AuthStateManager already initialized');
            return;
        }

        this.authService = authService;
        this.router = router;

        // Set up protected routes
        this.setupProtectedRoutes();

        // Set up role-based routes
        this.setupRoleBasedRoutes();

        // Listen for auth state changes
        this.authService.onAuthStateChange(this.handleAuthStateChange);

        // Listen for route changes
        if (this.router && typeof this.router.onRouteChange === 'function') {
            this.router.onRouteChange(this.handleRouteChange);
        }

        // Set up browser event listeners
        this.setupBrowserEventListeners();

        // Perform initial authentication check
        await this.performInitialAuthCheck();

        this.isInitialized = true;
        console.log('AuthStateManager initialized');
    }

    /**
     * Set up protected routes that require authentication
     */
    setupProtectedRoutes() {
        const protectedPaths = [
            '/bookings',
            '/bookings/new',
            '/profile',
            '/loyalty',
            '/admin',
            '/hotels/manage',
            '/reviews/new'
        ];

        protectedPaths.forEach(path => this.protectedRoutes.add(path));
    }

    /**
     * Set up role-based route access
     */
    setupRoleBasedRoutes() {
        // Admin only routes
        this.roleBasedRoutes.set('/admin', [3]); // Admin role
        
        // Hotel Manager routes
        this.roleBasedRoutes.set('/hotels/manage', [2, 3]); // Hotel Manager and Admin
        
        // Guest and above routes (all authenticated users)
        this.roleBasedRoutes.set('/bookings', [1, 2, 3]);
        this.roleBasedRoutes.set('/bookings/new', [1, 2, 3]);
        this.roleBasedRoutes.set('/profile', [1, 2, 3]);
        this.roleBasedRoutes.set('/loyalty', [1, 2, 3]);
        this.roleBasedRoutes.set('/reviews/new', [1, 2, 3]);
    }

    /**
     * Perform initial authentication check on app startup
     */
    async performInitialAuthCheck() {
        try {
            const token = this.storageService.getToken();
            
            if (token) {
                // Token exists, verify it's still valid
                try {
                    await this.authService.getCurrentUser();
                    console.log('User authenticated on app initialization');
                } catch (error) {
                    console.log('Token invalid on app initialization, logging out');
                    await this.authService.logout();
                }
            } else {
                console.log('No token found on app initialization');
            }

            // Check current route access
            await this.checkCurrentRouteAccess();
            
        } catch (error) {
            console.error('Error during initial auth check:', error);
        }
    }

    /**
     * Handle authentication state changes
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @param {Object|null} user - User data or null
     */
    handleAuthStateChange(isAuthenticated, user) {
        console.log('Auth state changed:', { isAuthenticated, user: user?.email });
        
        // Notify all listeners
        this.notifyAuthStateListeners(isAuthenticated, user);
        
        // Handle route access based on new auth state
        this.handleRouteAccessOnAuthChange(isAuthenticated, user);
    }

    /**
     * Handle route access when authentication state changes
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @param {Object|null} user - User data or null
     */
    handleRouteAccessOnAuthChange(isAuthenticated, user) {
        const currentPath = this.getCurrentPath();
        
        if (!isAuthenticated) {
            // User logged out, redirect from protected routes
            if (this.isProtectedRoute(currentPath)) {
                console.log('Redirecting from protected route after logout');
                this.redirectToLogin(currentPath);
            }
        } else {
            // User logged in, check if they have access to current route
            if (!this.hasRouteAccess(currentPath, user)) {
                console.log('User does not have access to current route');
                this.redirectToDefaultRoute(user);
            }
        }
    }

    /**
     * Handle route changes
     * @param {string} newPath - New route path
     * @param {string} oldPath - Previous route path
     */
    async handleRouteChange(newPath, oldPath) {
        console.log('Route changed:', { from: oldPath, to: newPath });
        
        // Check access to the new route
        await this.checkRouteAccess(newPath);
    }

    /**
     * Check access to a specific route
     * @param {string} path - Route path to check
     */
    async checkRouteAccess(path) {
        const isAuthenticated = this.authService.isAuthenticated();
        const user = this.authService.getCurrentUserData();

        // Check if route requires authentication
        if (this.isProtectedRoute(path) && !isAuthenticated) {
            console.log('Protected route accessed without authentication');
            this.redirectToLogin(path);
            return;
        }

        // Check role-based access
        if (isAuthenticated && !this.hasRouteAccess(path, user)) {
            console.log('User does not have required role for route');
            this.redirectToUnauthorized();
            return;
        }

        // Route access is allowed
        console.log('Route access granted:', path);
    }

    /**
     * Check current route access
     */
    async checkCurrentRouteAccess() {
        const currentPath = this.getCurrentPath();
        await this.checkRouteAccess(currentPath);
    }

    /**
     * Check if a route is protected (requires authentication)
     * @param {string} path - Route path
     * @returns {boolean} True if route is protected
     */
    isProtectedRoute(path) {
        return this.protectedRoutes.has(path);
    }

    /**
     * Check if user has access to a specific route
     * @param {string} path - Route path
     * @param {Object} user - User data
     * @returns {boolean} True if user has access
     */
    hasRouteAccess(path, user) {
        // Public routes are accessible to everyone
        if (this.publicRoutes.has(path)) {
            return true;
        }

        // If not authenticated, only public routes are accessible
        if (!user) {
            return false;
        }

        // Check role-based access
        const requiredRoles = this.roleBasedRoutes.get(path);
        if (requiredRoles) {
            return requiredRoles.includes(user.role);
        }

        // If route is not in role-based routes but user is authenticated,
        // allow access (for general authenticated routes)
        return true;
    }

    /**
     * Redirect to login page
     * @param {string} returnUrl - URL to return to after login
     */
    redirectToLogin(returnUrl = null) {
        const loginPath = '/login';
        
        if (returnUrl && returnUrl !== loginPath) {
            // Store return URL for after login
            this.storageService.setSession('returnUrl', returnUrl, 30); // 30 minutes
        }
        
        if (this.router) {
            this.router.navigate(loginPath);
        } else {
            window.location.href = '#login';
        }
    }

    /**
     * Redirect to unauthorized page or default route
     */
    redirectToUnauthorized() {
        // For now, redirect to home page
        // In a full app, you might have a dedicated unauthorized page
        if (this.router) {
            this.router.navigate('/');
        } else {
            window.location.href = '/';
        }
    }

    /**
     * Redirect to default route based on user role
     * @param {Object} user - User data
     */
    redirectToDefaultRoute(user) {
        let defaultRoute = '/';
        
        if (user) {
            switch (user.role) {
                case 3: // Admin
                    defaultRoute = '/admin';
                    break;
                case 2: // Hotel Manager
                    defaultRoute = '/hotels/manage';
                    break;
                case 1: // Guest
                default:
                    defaultRoute = '/hotels';
                    break;
            }
        }
        
        if (this.router) {
            this.router.navigate(defaultRoute);
        } else {
            window.location.href = defaultRoute;
        }
    }

    /**
     * Handle successful login redirect
     */
    handleLoginSuccess() {
        // Check for stored return URL
        const returnUrl = this.storageService.getSession('returnUrl');
        
        if (returnUrl) {
            this.storageService.removeSession('returnUrl');
            
            if (this.router) {
                this.router.navigate(returnUrl);
            } else {
                window.location.href = returnUrl;
            }
        } else {
            // Redirect to default route based on user role
            const user = this.authService.getCurrentUserData();
            this.redirectToDefaultRoute(user);
        }
    }

    /**
     * Set up browser event listeners for auth state checking
     */
    setupBrowserEventListeners() {
        // Check auth when page becomes visible (user switches back to tab)
        document.addEventListener('visibilitychange', this.checkAuthOnVisibilityChange);
        
        // Check auth when window gains focus
        window.addEventListener('focus', this.checkAuthOnFocus);
        
        // Check auth on page load/refresh
        window.addEventListener('load', () => {
            setTimeout(() => this.performInitialAuthCheck(), 100);
        });
    }

    /**
     * Check authentication when page visibility changes
     */
    async checkAuthOnVisibilityChange() {
        if (!document.hidden && this.authService.isAuthenticated()) {
            try {
                // Verify token is still valid when user returns to tab
                await this.authService.getCurrentUser();
            } catch (error) {
                console.log('Token invalid on visibility change, logging out');
                await this.authService.logout();
            }
        }
    }

    /**
     * Check authentication when window gains focus
     */
    async checkAuthOnFocus() {
        if (this.authService.isAuthenticated()) {
            try {
                // Verify token is still valid when window gains focus
                await this.authService.getCurrentUser();
            } catch (error) {
                console.log('Token invalid on focus, logging out');
                await this.authService.logout();
            }
        }
    }

    /**
     * Get current path from router or URL
     * @returns {string} Current path
     */
    getCurrentPath() {
        if (this.router && typeof this.router.getCurrentRoute === 'function') {
            return this.router.getCurrentRoute();
        }
        
        // Fallback to hash or pathname
        const hash = window.location.hash.substring(1);
        return hash || window.location.pathname;
    }

    /**
     * Add authentication state listener
     * @param {Function} callback - Callback function
     */
    onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.push(callback);
        }
    }

    /**
     * Remove authentication state listener
     * @param {Function} callback - Callback function to remove
     */
    removeAuthStateListener(callback) {
        this.authStateListeners = this.authStateListeners.filter(
            listener => listener !== callback
        );
    }

    /**
     * Notify all auth state listeners
     * @param {boolean} isAuthenticated - Whether user is authenticated
     * @param {Object|null} user - User data or null
     */
    notifyAuthStateListeners(isAuthenticated, user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(isAuthenticated, user);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Add a protected route
     * @param {string} path - Route path to protect
     */
    addProtectedRoute(path) {
        this.protectedRoutes.add(path);
    }

    /**
     * Remove a protected route
     * @param {string} path - Route path to unprotect
     */
    removeProtectedRoute(path) {
        this.protectedRoutes.delete(path);
    }

    /**
     * Add role-based route access
     * @param {string} path - Route path
     * @param {Array<number>} roles - Array of role IDs that can access the route
     */
    addRoleBasedRoute(path, roles) {
        this.roleBasedRoutes.set(path, roles);
    }

    /**
     * Remove role-based route access
     * @param {string} path - Route path
     */
    removeRoleBasedRoute(path) {
        this.roleBasedRoutes.delete(path);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        return this.authService ? this.authService.isAuthenticated() : false;
    }

    /**
     * Get current user data
     * @returns {Object|null} Current user data or null
     */
    getCurrentUser() {
        return this.authService ? this.authService.getCurrentUserData() : null;
    }

    /**
     * Force authentication check
     */
    async forceAuthCheck() {
        if (this.authService) {
            try {
                await this.authService.getCurrentUser();
            } catch (error) {
                console.log('Force auth check failed, logging out');
                await this.authService.logout();
            }
        }
    }

    /**
     * Cleanup event listeners and timers
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.checkAuthOnVisibilityChange);
        window.removeEventListener('focus', this.checkAuthOnFocus);
        
        // Clear listeners
        this.authStateListeners = [];
        
        // Remove auth service listener
        if (this.authService) {
            this.authService.removeAuthStateListener(this.handleAuthStateChange);
        }
        
        this.isInitialized = false;
        console.log('AuthStateManager destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthStateManager;
}

// Make available globally
window.AuthStateManager = AuthStateManager;


