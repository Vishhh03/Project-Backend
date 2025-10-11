/**
 * LoginComponent - User login form with validation and error handling
 */
class LoginComponent {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.authService = new AuthService();
        this.router = window.router;
        this.isLoading = false;
        
        // Validation timeout properties for debouncing
        this.emailValidationTimeout = null;
        
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Render the login form
     */
    render() {
        this.container.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2>Sign In</h2>
                        <p>Welcome back! Please sign in to your account.</p>
                    </div>
                    
                    <form id="loginForm" class="auth-form" novalidate>
                        <div class="form-group">
                            <label for="email" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                class="form-input" 
                                placeholder="Enter your email"
                                required
                                autocomplete="email"
                            >
                            <div class="field-error" id="emailError"></div>
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <div class="password-input-container">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="form-input" 
                                    placeholder="Enter your password"
                                    required
                                    autocomplete="current-password"
                                >
                                <button type="button" class="password-toggle" id="passwordToggle">
                                    <span class="password-toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-error" id="passwordError"></div>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-container">
                                <input type="checkbox" id="rememberMe" name="rememberMe">
                                <span class="checkmark"></span>
                                Remember me
                            </label>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-full" id="loginButton">
                                <span class="button-text">Sign In</span>
                                <span class="button-spinner" style="display: none;">
                                    <div class="spinner"></div>
                                </span>
                            </button>
                        </div>

                        <div class="form-error" id="formError" style="display: none;"></div>
                    </form>

                    <div class="auth-footer">
                        <p>Don't have an account? 
                            <a href="#" id="registerLink" class="auth-link">Sign up here</a>
                        </p>
                        <p>
                            <a href="#" id="forgotPasswordLink" class="auth-link">Forgot your password?</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const form = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const passwordToggle = document.getElementById('passwordToggle');
        const registerLink = document.getElementById('registerLink');
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation with debouncing
        emailInput.addEventListener('blur', () => this.validateEmail());
        emailInput.addEventListener('input', () => {
            this.clearFieldError('email');
            // Debounced validation for real-time feedback
            clearTimeout(this.emailValidationTimeout);
            this.emailValidationTimeout = setTimeout(() => this.validateEmail(), 500);
        });
        
        passwordInput.addEventListener('blur', () => this.validatePassword());
        passwordInput.addEventListener('input', () => this.clearFieldError('password'));

        // Password visibility toggle
        passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());

        // Navigation links
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToRegister();
        });

        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Enter key handling
        form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        // Clear previous errors
        this.clearAllErrors();

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        // Get form data
        const formData = new FormData(event.target);
        const email = formData.get('email').trim();
        const password = formData.get('password');

        try {
            this.setLoading(true);
            
            // Attempt login
            const response = await this.authService.login(email, password);
            
            // Show success message
            this.showSuccess('Login successful! Redirecting...');
            
            // Redirect after short delay
            setTimeout(() => {
                this.handleSuccessfulLogin(response.user);
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showFormError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Validate the entire form
     * @returns {boolean} True if form is valid
     */
    validateForm() {
        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();
        
        return emailValid && passwordValid;
    }

    /**
     * Validate email field
     * @returns {boolean} True if email is valid
     */
    validateEmail() {
        const emailInput = document.getElementById('email');
        if (!emailInput) return false;
        
        const email = emailInput.value.trim();
        
        if (!email) {
            this.showFieldError('email', 'Email is required');
            return false;
        }
        
        if (!this.authService || !this.authService.validateEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError('email');
        return true;
    }

    /**
     * Validate password field
     * @returns {boolean} True if password is valid
     */
    validatePassword() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return false;
        
        const password = passwordInput.value;
        
        if (!password) {
            this.showFieldError('password', 'Password is required');
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    /**
     * Show field-specific error
     * @param {string} fieldName - Name of the field
     * @param {string} message - Error message
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            inputElement.classList.add('error');
        }
    }

    /**
     * Clear field-specific error
     * @param {string} fieldName - Name of the field
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
            inputElement.classList.remove('error');
        }
    }

    /**
     * Show form-level error
     * @param {string} message - Error message
     */
    showFormError(message) {
        const errorElement = document.getElementById('formError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.classList.add('error-message');
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const errorElement = document.getElementById('formError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.classList.remove('error-message');
            errorElement.classList.add('success-message');
        }
    }

    /**
     * Clear all error messages
     */
    clearAllErrors() {
        this.clearFieldError('email');
        this.clearFieldError('password');
        
        const formError = document.getElementById('formError');
        if (formError) {
            formError.style.display = 'none';
            formError.classList.remove('error-message', 'success-message');
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Whether component is loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const button = document.getElementById('loginButton');
        const buttonText = button.querySelector('.button-text');
        const buttonSpinner = button.querySelector('.button-spinner');
        
        if (loading) {
            button.disabled = true;
            buttonText.style.display = 'none';
            buttonSpinner.style.display = 'inline-block';
        } else {
            button.disabled = false;
            buttonText.style.display = 'inline-block';
            buttonSpinner.style.display = 'none';
        }
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.password-toggle-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }

    /**
     * Handle successful login
     * @param {Object} user - User data
     */
    handleSuccessfulLogin(user) {
        // Redirect based on user role
        if (user.role === 3) { // Admin
            this.router?.navigate('/admin');
        } else if (user.role === 2) { // Hotel Manager
            this.router?.navigate('/hotels/manage');
        } else { // Guest
            this.router?.navigate('/hotels');
        }
        
        // Fallback if no router
        if (!this.router) {
            window.location.href = '/';
        }
    }

    /**
     * Navigate to registration page
     */
    navigateToRegister() {
        if (this.router) {
            this.router.navigate('/register');
        } else {
            window.location.href = '#register';
        }
    }

    /**
     * Handle forgot password
     */
    handleForgotPassword() {
        // For now, show an alert - in a real app, this would navigate to password reset
        alert('Password reset functionality will be implemented in a future update. Please contact support for assistance.');
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Clear any pending validation timeouts
        if (this.emailValidationTimeout) {
            clearTimeout(this.emailValidationTimeout);
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Show the component
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Hide the component
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginComponent;
}

// Make available globally
window.LoginComponent = LoginComponent;


