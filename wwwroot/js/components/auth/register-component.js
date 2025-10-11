/**
 * RegisterComponent - User registration form with comprehensive validation and error handling
 */
class RegisterComponent {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.authService = new AuthService();
        this.router = window.router;
        this.isLoading = false;
        
        // Validation timeout properties for debouncing
        this.nameValidationTimeout = null;
        this.emailValidationTimeout = null;
        this.contactValidationTimeout = null;
        this.confirmPasswordValidationTimeout = null;
        
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
     * Render the registration form
     */
    render() {
        this.container.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2>Create Account</h2>
                        <p>Join us today! Create your account to start booking hotels.</p>
                    </div>
                    
                    <form id="registerForm" class="auth-form" novalidate>
                        <div class="form-group">
                            <label for="name" class="form-label">Full Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                class="form-input" 
                                placeholder="Enter your full name"
                                required
                                autocomplete="name"
                                minlength="2"
                                maxlength="100"
                            >
                            <div class="field-error" id="nameError"></div>
                        </div>

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
                                maxlength="255"
                            >
                            <div class="field-error" id="emailError"></div>
                        </div>

                        <div class="form-group">
                            <label for="contactNumber" class="form-label">Contact Number (Optional)</label>
                            <input 
                                type="tel" 
                                id="contactNumber" 
                                name="contactNumber" 
                                class="form-input" 
                                placeholder="Enter your phone number"
                                autocomplete="tel"
                                maxlength="20"
                            >
                            <div class="field-error" id="contactNumberError"></div>
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <div class="password-input-container">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="form-input" 
                                    placeholder="Create a strong password"
                                    required
                                    autocomplete="new-password"
                                    minlength="6"
                                    maxlength="100"
                                >
                                <button type="button" class="password-toggle" id="passwordToggle">
                                    <span class="password-toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="password-strength" id="passwordStrength"></div>
                            <div class="field-error" id="passwordError"></div>
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword" class="form-label">Confirm Password</label>
                            <div class="password-input-container">
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    name="confirmPassword" 
                                    class="form-input" 
                                    placeholder="Confirm your password"
                                    required
                                    autocomplete="new-password"
                                >
                                <button type="button" class="password-toggle" id="confirmPasswordToggle">
                                    <span class="password-toggle-icon">👁️</span>
                                </button>
                            </div>
                            <div class="field-error" id="confirmPasswordError"></div>
                        </div>

                        <div class="form-group">
                            <label for="role" class="form-label">Account Type</label>
                            <select id="role" name="role" class="form-select">
                                <option value="1">Guest (Book hotels)</option>
                                <option value="2">Hotel Manager (Manage hotels)</option>
                            </select>
                            <div class="field-error" id="roleError"></div>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-container">
                                <input type="checkbox" id="agreeTerms" name="agreeTerms" required>
                                <span class="checkmark"></span>
                                I agree to the <a href="#" class="auth-link">Terms of Service</a> and 
                                <a href="#" class="auth-link">Privacy Policy</a>
                            </label>
                            <div class="field-error" id="agreeTermsError"></div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-full" id="registerButton">
                                <span class="button-text">Create Account</span>
                                <span class="button-spinner" style="display: none;">
                                    <div class="spinner"></div>
                                </span>
                            </button>
                        </div>

                        <div class="form-error" id="formError" style="display: none;"></div>
                    </form>

                    <div class="auth-footer">
                        <p>Already have an account? 
                            <a href="#" id="loginLink" class="auth-link">Sign in here</a>
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
        const form = document.getElementById('registerForm');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const contactNumberInput = document.getElementById('contactNumber');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const passwordToggle = document.getElementById('passwordToggle');
        const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        const agreeTermsInput = document.getElementById('agreeTerms');
        const loginLink = document.getElementById('loginLink');

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation with debouncing for better UX
        nameInput.addEventListener('blur', () => this.validateName());
        nameInput.addEventListener('input', () => {
            this.clearFieldError('name');
            // Debounced validation for real-time feedback
            clearTimeout(this.nameValidationTimeout);
            this.nameValidationTimeout = setTimeout(() => this.validateName(), 500);
        });
        
        emailInput.addEventListener('blur', () => this.validateEmail());
        emailInput.addEventListener('input', () => {
            this.clearFieldError('email');
            // Debounced validation for real-time feedback
            clearTimeout(this.emailValidationTimeout);
            this.emailValidationTimeout = setTimeout(() => this.validateEmail(), 500);
        });
        
        contactNumberInput.addEventListener('blur', () => this.validateContactNumber());
        contactNumberInput.addEventListener('input', () => {
            this.clearFieldError('contactNumber');
            // Debounced validation for real-time feedback
            clearTimeout(this.contactValidationTimeout);
            this.contactValidationTimeout = setTimeout(() => this.validateContactNumber(), 500);
        });
        
        passwordInput.addEventListener('input', () => {
            this.updatePasswordStrength();
            this.clearFieldError('password');
            // Re-validate confirm password if it has a value
            if (confirmPasswordInput.value) {
                clearTimeout(this.confirmPasswordValidationTimeout);
                this.confirmPasswordValidationTimeout = setTimeout(() => this.validateConfirmPassword(), 300);
            }
        });
        passwordInput.addEventListener('blur', () => this.validatePassword());
        
        confirmPasswordInput.addEventListener('blur', () => this.validateConfirmPassword());
        confirmPasswordInput.addEventListener('input', () => {
            this.clearFieldError('confirmPassword');
            if (passwordInput.value) {
                clearTimeout(this.confirmPasswordValidationTimeout);
                this.confirmPasswordValidationTimeout = setTimeout(() => this.validateConfirmPassword(), 300);
            }
        });

        agreeTermsInput.addEventListener('change', () => this.validateAgreeTerms());

        // Password visibility toggles
        passwordToggle.addEventListener('click', () => this.togglePasswordVisibility('password'));
        confirmPasswordToggle.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));

        // Navigation links
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToLogin();
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
        const userData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            contactNumber: formData.get('contactNumber')?.trim() || null,
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            role: parseInt(formData.get('role'))
        };

        try {
            this.setLoading(true);
            
            // Attempt registration
            const response = await this.authService.register(userData);
            
            // Show success message
            this.showSuccess('Account created successfully! Redirecting...');
            
            // Redirect after short delay
            setTimeout(() => {
                this.handleSuccessfulRegistration(response.user);
            }, 1000);
            
        } catch (error) {
            console.error('Registration error:', error);
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
        const nameValid = this.validateName();
        const emailValid = this.validateEmail();
        const contactNumberValid = this.validateContactNumber();
        const passwordValid = this.validatePassword();
        const confirmPasswordValid = this.validateConfirmPassword();
        const agreeTermsValid = this.validateAgreeTerms();
        
        return nameValid && emailValid && contactNumberValid && 
               passwordValid && confirmPasswordValid && agreeTermsValid;
    }

    /**
     * Validate name field
     * @returns {boolean} True if name is valid
     */
    validateName() {
        const nameInput = document.getElementById('name');
        if (!nameInput) return false;
        
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showFieldError('name', 'Name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showFieldError('name', 'Name must be at least 2 characters long');
            return false;
        }
        
        if (name.length > 100) {
            this.showFieldError('name', 'Name cannot exceed 100 characters');
            return false;
        }
        
        // Check for valid characters (letters, spaces, hyphens, apostrophes)
        if (!/^[a-zA-Z\s\-']+$/.test(name)) {
            this.showFieldError('name', 'Name can only contain letters, spaces, hyphens, and apostrophes');
            return false;
        }
        
        this.clearFieldError('name');
        return true;
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
        
        if (email.length > 255) {
            this.showFieldError('email', 'Email cannot exceed 255 characters');
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
     * Validate contact number field
     * @returns {boolean} True if contact number is valid
     */
    validateContactNumber() {
        const contactNumberInput = document.getElementById('contactNumber');
        const contactNumber = contactNumberInput.value.trim();
        
        // Contact number is optional
        if (!contactNumber) {
            this.clearFieldError('contactNumber');
            return true;
        }
        
        if (contactNumber.length > 20) {
            this.showFieldError('contactNumber', 'Contact number cannot exceed 20 characters');
            return false;
        }
        
        // Basic phone number validation
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(contactNumber.replace(/[\s\-\(\)]/g, ''))) {
            this.showFieldError('contactNumber', 'Please enter a valid phone number');
            return false;
        }
        
        this.clearFieldError('contactNumber');
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
        
        if (!this.authService) {
            this.showFieldError('password', 'Authentication service not available');
            return false;
        }
        
        const validation = this.authService.validatePassword(password);
        if (!validation.isValid) {
            this.showFieldError('password', validation.errors[0]);
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    /**
     * Validate confirm password field
     * @returns {boolean} True if confirm password is valid
     */
    validateConfirmPassword() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!confirmPassword) {
            this.showFieldError('confirmPassword', 'Password confirmation is required');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Passwords do not match');
            return false;
        }
        
        this.clearFieldError('confirmPassword');
        return true;
    }

    /**
     * Validate agree terms checkbox
     * @returns {boolean} True if terms are agreed
     */
    validateAgreeTerms() {
        const agreeTermsInput = document.getElementById('agreeTerms');
        
        if (!agreeTermsInput.checked) {
            this.showFieldError('agreeTerms', 'You must agree to the Terms of Service and Privacy Policy');
            return false;
        }
        
        this.clearFieldError('agreeTerms');
        return true;
    }

    /**
     * Update password strength indicator
     */
    updatePasswordStrength() {
        const passwordInput = document.getElementById('password');
        const strengthElement = document.getElementById('passwordStrength');
        
        if (!passwordInput || !strengthElement) return;
        
        const password = passwordInput.value;
        
        if (!password) {
            strengthElement.innerHTML = '';
            return;
        }
        
        let validation = { isValid: true, errors: [] };
        if (this.authService && typeof this.authService.validatePassword === 'function') {
            validation = this.authService.validatePassword(password);
        }
        
        let strength = 0;
        let strengthText = '';
        let strengthClass = '';
        
        // Calculate strength based on criteria met
        if (password.length >= 6) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;
        
        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthClass = 'strength-very-weak';
                break;
            case 2:
                strengthText = 'Weak';
                strengthClass = 'strength-weak';
                break;
            case 3:
                strengthText = 'Fair';
                strengthClass = 'strength-fair';
                break;
            case 4:
                strengthText = 'Good';
                strengthClass = 'strength-good';
                break;
            case 5:
                strengthText = 'Strong';
                strengthClass = 'strength-strong';
                break;
        }
        
        strengthElement.innerHTML = `
            <div class="strength-indicator ${strengthClass}">
                <div class="strength-bar">
                    <div class="strength-fill" style="width: ${(strength / 5) * 100}%"></div>
                </div>
                <span class="strength-text">${strengthText}</span>
            </div>
        `;
        
        // Show validation errors if any
        if (!validation.isValid && password.length > 0) {
            const errorList = validation.errors.map(error => `<li>${error}</li>`).join('');
            strengthElement.innerHTML += `
                <div class="password-requirements">
                    <p>Password must meet the following requirements:</p>
                    <ul>${errorList}</ul>
                </div>
            `;
        }
    }

    /**
     * Show field-specific error
     * @param {string} fieldName - Name of the field
     * @param {string} message - Error message
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputElement) {
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
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputElement) {
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
        const fields = ['name', 'email', 'contactNumber', 'password', 'confirmPassword', 'agreeTerms'];
        fields.forEach(field => this.clearFieldError(field));
        
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
        
        const button = document.getElementById('registerButton');
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
     * @param {string} fieldId - ID of the password field
     */
    togglePasswordVisibility(fieldId) {
        const passwordInput = document.getElementById(fieldId);
        const toggleButton = document.getElementById(`${fieldId}Toggle`);
        const toggleIcon = toggleButton.querySelector('.password-toggle-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }

    /**
     * Handle successful registration
     * @param {Object} user - User data
     */
    handleSuccessfulRegistration(user) {
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
     * Navigate to login page
     */
    navigateToLogin() {
        if (this.router) {
            this.router.navigate('/login');
        } else {
            window.location.href = '#login';
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Clear any pending validation timeouts
        if (this.nameValidationTimeout) {
            clearTimeout(this.nameValidationTimeout);
        }
        if (this.emailValidationTimeout) {
            clearTimeout(this.emailValidationTimeout);
        }
        if (this.contactValidationTimeout) {
            clearTimeout(this.contactValidationTimeout);
        }
        if (this.confirmPasswordValidationTimeout) {
            clearTimeout(this.confirmPasswordValidationTimeout);
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
    module.exports = RegisterComponent;
}

// Make available globally
window.RegisterComponent = RegisterComponent;


