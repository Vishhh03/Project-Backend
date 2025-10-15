// Authentication Manager

const Auth = {
    currentUser: null,

    // Initialize auth
    init() {
        this.currentUser = this.getCurrentUser();
        this.updateNavigation();
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!API.getToken();
    },

    // Get current user from token
    getCurrentUser() {
        const token = API.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.sub || payload.nameid,
                name: payload.name,
                email: payload.email,
                role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            };
        } catch (error) {
            console.error('Invalid token:', error);
            API.removeToken();
            return null;
        }
    },

    // Login
    async login(email, password) {
        try {
            const response = await API.auth.login(email, password);
            API.setToken(response.token);
            this.currentUser = this.getCurrentUser();
            this.updateNavigation();
            Utils.showToast('Welcome back!', 'success');
            return response;
        } catch (error) {
            Utils.showToast(error.message || 'Login failed', 'error');
            throw error;
        }
    },

    // Register
    async register(data) {
        try {
            const response = await API.auth.register(data);
            API.setToken(response.token);
            this.currentUser = this.getCurrentUser();
            this.updateNavigation();
            Utils.showToast('Account created successfully!', 'success');
            return response;
        } catch (error) {
            Utils.showToast(error.message || 'Registration failed', 'error');
            throw error;
        }
    },

    // Logout
    logout() {
        API.removeToken();
        Utils.storage.remove(APP_CONFIG.userKey);
        this.currentUser = null;
        this.updateNavigation();
        Utils.showToast('Logged out successfully', 'success');
        Router.navigate('/');
    },

    // Update navigation based on auth state
    updateNavigation() {
        const authLink = Utils.$('#auth-link');
        const bookingsLink = Utils.$('#bookings-link');
        const loyaltyLink = Utils.$('#loyalty-link');
        const adminLink = Utils.$('#admin-link');

        if (this.isLoggedIn() && this.currentUser) {
            authLink.textContent = 'Logout';
            authLink.href = '#/logout';
            bookingsLink.style.display = 'block';
            loyaltyLink.style.display = 'block';

            // Show admin link only for admins
            if (this.currentUser.role === 'Admin') {
                adminLink.style.display = 'block';
            } else {
                adminLink.style.display = 'none';
            }
        } else {
            authLink.textContent = 'Login';
            authLink.href = '#/login';
            bookingsLink.style.display = 'none';
            loyaltyLink.style.display = 'none';
            adminLink.style.display = 'none';
        }
    },

    // Check if user has role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },

    // Require authentication
    requireAuth() {
        if (!this.isLoggedIn()) {
            Utils.showToast('Please login to continue', 'warning');
            Router.navigate('/login');
            return false;
        }
        return true;
    },

    // Require specific role
    requireRole(role) {
        if (!this.requireAuth()) return false;
        
        if (!this.hasRole(role)) {
            Utils.showToast('You do not have permission to access this page', 'error');
            Router.navigate('/');
            return false;
        }
        return true;
    }
};
