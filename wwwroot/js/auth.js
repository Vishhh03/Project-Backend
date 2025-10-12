// Simple authentication manager
const Auth = {
    currentUser: null,
    
    // Check if user is logged in
    isLoggedIn() {
        return !!API.getToken();
    },
    
    // Get current user info from token
    getCurrentUser() {
        const token = API.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                role: payload.role
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
            Utils.showToast('Login successful!', 'success');
            return response;
        } catch (error) {
            Utils.showToast(error.message, 'error');
            throw error;
        }
    },
    
    // Register
    async register(name, email, password) {
        try {
            const response = await API.auth.register(name, email, password);
            API.setToken(response.token);
            this.currentUser = this.getCurrentUser();
            this.updateNavigation();
            Utils.showToast('Registration successful!', 'success');
            return response;
        } catch (error) {
            Utils.showToast(error.message, 'error');
            throw error;
        }
    },
    
    // Logout
    async logout() {
        try {
            await API.auth.logout();
            this.currentUser = null;
            this.updateNavigation();
            Utils.showToast('Logged out successfully', 'info');
            Router.navigate('/');
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    },
    
    // Update navigation based on auth state
    updateNavigation() {
        const authLink = Utils.$('#auth-link');
        const navLinks = Utils.$('#nav-links');
        
        if (this.isLoggedIn()) {
            const user = this.getCurrentUser();
            authLink.textContent = user.name;
            authLink.href = '#/profile';
            
            // Add bookings link if not exists
            if (!Utils.$('#bookings-link')) {
                const bookingsLink = document.createElement('a');
                bookingsLink.href = '#/bookings';
                bookingsLink.className = 'nav-link';
                bookingsLink.id = 'bookings-link';
                bookingsLink.textContent = 'My Bookings';
                navLinks.insertBefore(bookingsLink, authLink);
            }
        } else {
            authLink.textContent = 'Login';
            authLink.href = '#/login';
            
            // Remove bookings link
            const bookingsLink = Utils.$('#bookings-link');
            if (bookingsLink) {
                bookingsLink.remove();
            }
        }
    },
    
    // Initialize auth state
    init() {
        this.currentUser = this.getCurrentUser();
        this.updateNavigation();
    }
};