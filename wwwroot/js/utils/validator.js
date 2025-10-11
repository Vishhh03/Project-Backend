/**
 * Form Validation Framework
 * Provides comprehensive form validation with real-time feedback,
 * custom validation rules, and error display
 */

class ValidationError extends Error {
    constructor(field, message, value = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
        this.type = 'validation';
    }
}

class ValidationRule {
    constructor(name, validator, message) {
        this.name = name;
        this.validator = validator;
        this.message = message;
    }

    validate(value, field, form) {
        const isValid = this.validator(value, field, form);
        if (!isValid) {
            throw new ValidationError(field, this.message, value);
        }
        return true;
    }
}

class Validator {
    constructor() {
        this.rules = new Map();
        this.customRules = new Map();
        this.initializeDefaultRules();
    }

    initializeDefaultRules() {
        // Required field validation
        this.addRule('required', (value) => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.trim().length > 0;
            return value !== null && value !== undefined && value !== '';
        }, 'This field is required');

        // Email validation
        this.addRule('email', (value) => {
            if (!value) return true; // Allow empty if not required
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        }, 'Please enter a valid email address');

        // Minimum length validation
        this.addRule('minLength', (value, field, form, params) => {
            if (!value) return true;
            const minLength = params.minLength || 0;
            return value.toString().length >= minLength;
        }, (params) => `Must be at least ${params.minLength} characters long`);

        // Maximum length validation
        this.addRule('maxLength', (value, field, form, params) => {
            if (!value) return true;
            const maxLength = params.maxLength || Infinity;
            return value.toString().length <= maxLength;
        }, (params) => `Must be no more than ${params.maxLength} characters long`);

        // Minimum value validation
        this.addRule('min', (value, field, form, params) => {
            if (!value) return true;
            const min = params.min;
            const numValue = parseFloat(value);
            return !isNaN(numValue) && numValue >= min;
        }, (params) => `Must be at least ${params.min}`);

        // Maximum value validation
        this.addRule('max', (value, field, form, params) => {
            if (!value) return true;
            const max = params.max;
            const numValue = parseFloat(value);
            return !isNaN(numValue) && numValue <= max;
        }, (params) => `Must be no more than ${params.max}`);

        // Pattern validation
        this.addRule('pattern', (value, field, form, params) => {
            if (!value) return true;
            const pattern = new RegExp(params.pattern);
            return pattern.test(value);
        }, (params) => params.message || 'Invalid format');

        // Number validation
        this.addRule('number', (value) => {
            if (!value) return true;
            return !isNaN(parseFloat(value)) && isFinite(value);
        }, 'Must be a valid number');

        // Integer validation
        this.addRule('integer', (value) => {
            if (!value) return true;
            return Number.isInteger(parseFloat(value));
        }, 'Must be a whole number');

        // Phone number validation
        this.addRule('phone', (value) => {
            if (!value) return true;
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
        }, 'Please enter a valid phone number');

        // Date validation
        this.addRule('date', (value) => {
            if (!value) return true;
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        }, 'Please enter a valid date');

        // Future date validation
        this.addRule('futureDate', (value) => {
            if (!value) return true;
            const date = new Date(value);
            const now = new Date();
            return date > now;
        }, 'Date must be in the future');

        // Past date validation
        this.addRule('pastDate', (value) => {
            if (!value) return true;
            const date = new Date(value);
            const now = new Date();
            return date < now;
        }, 'Date must be in the past');

        // Password strength validation
        this.addRule('strongPassword', (value) => {
            if (!value) return true;
            const hasLower = /[a-z]/.test(value);
            const hasUpper = /[A-Z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            const isLongEnough = value.length >= 8;
            return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
        }, 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character');

        // Confirm password validation
        this.addRule('confirmPassword', (value, field, form, params) => {
            if (!value) return true;
            const passwordField = params.passwordField || 'password';
            const passwordValue = form[passwordField];
            return value === passwordValue;
        }, 'Passwords do not match');

        // URL validation
        this.addRule('url', (value) => {
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, 'Please enter a valid URL');
    }

    addRule(name, validator, message) {
        this.rules.set(name, new ValidationRule(name, validator, message));
    }

    addCustomRule(name, validator, message) {
        this.customRules.set(name, new ValidationRule(name, validator, message));
    }

    validateField(value, rules, fieldName, formData = {}) {
        const errors = [];

        for (const rule of rules) {
            try {
                const ruleName = typeof rule === 'string' ? rule : rule.name;
                const ruleParams = typeof rule === 'object' ? rule : {};
                
                const validationRule = this.rules.get(ruleName) || this.customRules.get(ruleName);
                if (!validationRule) {
                    console.warn(`Unknown validation rule: ${ruleName}`);
                    continue;
                }

                let message = validationRule.message;
                if (typeof message === 'function') {
                    message = message(ruleParams);
                }

                validationRule.validator(value, fieldName, formData, ruleParams);
            } catch (error) {
                if (error instanceof ValidationError) {
                    errors.push(error.message);
                } else {
                    errors.push(`Validation error: ${error.message}`);
                }
            }
        }

        return errors;
    }

    validateForm(formData, validationSchema) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, rules] of Object.entries(validationSchema)) {
            const fieldValue = formData[fieldName];
            const fieldErrors = this.validateField(fieldValue, rules, fieldName, formData);
            
            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
                isValid = false;
            }
        }

        return { isValid, errors };
    }
}

class FormValidator {
    constructor(form, validationSchema, options = {}) {
        this.form = typeof form === 'string' ? document.querySelector(form) : form;
        this.validationSchema = validationSchema;
        this.validator = new Validator();
        this.errors = {};
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            showErrorsInline: true,
            errorClass: 'error',
            errorMessageClass: 'error-message',
            validClass: 'valid',
            ...options
        };

        this.init();
    }

    init() {
        if (!this.form) {
            console.error('Form not found');
            return;
        }

        this.setupEventListeners();
        this.createErrorElements();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateForm();
        });

        // Real-time validation
        Object.keys(this.validationSchema).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            if (this.options.validateOnInput) {
                field.addEventListener('input', () => {
                    this.validateField(fieldName);
                });
            }

            if (this.options.validateOnBlur) {
                field.addEventListener('blur', () => {
                    this.validateField(fieldName);
                });
            }

            // Clear errors on focus
            field.addEventListener('focus', () => {
                this.clearFieldError(fieldName);
            });
        });
    }

    createErrorElements() {
        if (!this.options.showErrorsInline) return;

        Object.keys(this.validationSchema).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const errorElement = document.createElement('div');
            errorElement.className = this.options.errorMessageClass;
            errorElement.id = `${fieldName}-error`;
            errorElement.style.display = 'none';

            // Insert after the field
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        });
    }

    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return true;

        const value = this.getFieldValue(field);
        const rules = this.validationSchema[fieldName];
        const formData = this.getFormData();

        const fieldErrors = this.validator.validateField(value, rules, fieldName, formData);
        
        if (fieldErrors.length > 0) {
            this.showFieldError(fieldName, fieldErrors);
            return false;
        } else {
            this.clearFieldError(fieldName);
            return true;
        }
    }

    validateForm() {
        const formData = this.getFormData();
        const result = this.validator.validateForm(formData, this.validationSchema);

        this.errors = result.errors;

        // Show/hide errors
        Object.keys(this.validationSchema).forEach(fieldName => {
            if (this.errors[fieldName]) {
                this.showFieldError(fieldName, this.errors[fieldName]);
            } else {
                this.clearFieldError(fieldName);
            }
        });

        if (result.isValid) {
            this.onValidationSuccess(formData);
        } else {
            this.onValidationError(this.errors);
        }

        return result.isValid;
    }

    showFieldError(fieldName, errors) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);

        if (field) {
            field.classList.add(this.options.errorClass);
            field.classList.remove(this.options.validClass);
        }

        if (errorElement && this.options.showErrorsInline) {
            errorElement.textContent = errors[0]; // Show first error
            errorElement.style.display = 'block';
        }
    }

    clearFieldError(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);

        if (field) {
            field.classList.remove(this.options.errorClass);
            field.classList.add(this.options.validClass);
        }

        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    getFieldValue(field) {
        if (field.type === 'checkbox') {
            return field.checked;
        } else if (field.type === 'radio') {
            const checked = this.form.querySelector(`[name="${field.name}"]:checked`);
            return checked ? checked.value : '';
        } else if (field.tagName === 'SELECT' && field.multiple) {
            return Array.from(field.selectedOptions).map(option => option.value);
        } else {
            return field.value;
        }
    }

    getFormData() {
        const formData = {};
        
        Object.keys(this.validationSchema).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                formData[fieldName] = this.getFieldValue(field);
            }
        });

        return formData;
    }

    onValidationSuccess(formData) {
        // Override this method or listen for 'validationSuccess' event
        const event = new CustomEvent('validationSuccess', {
            detail: { formData }
        });
        this.form.dispatchEvent(event);
    }

    onValidationError(errors) {
        // Override this method or listen for 'validationError' event
        const event = new CustomEvent('validationError', {
            detail: { errors }
        });
        this.form.dispatchEvent(event);
    }

    // Public methods
    addCustomRule(name, validator, message) {
        this.validator.addCustomRule(name, validator, message);
    }

    reset() {
        this.errors = {};
        Object.keys(this.validationSchema).forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
    }

    setErrors(errors) {
        this.errors = errors;
        Object.entries(errors).forEach(([fieldName, fieldErrors]) => {
            this.showFieldError(fieldName, fieldErrors);
        });
    }

    isValid() {
        return Object.keys(this.errors).length === 0;
    }
}

// Business logic validation rules for hotel booking system
class HotelValidationRules {
    static getLoginValidation() {
        return {
            email: ['required', 'email'],
            password: ['required', { name: 'minLength', minLength: 6 }]
        };
    }

    static getRegistrationValidation() {
        return {
            name: ['required', { name: 'minLength', minLength: 2 }],
            email: ['required', 'email'],
            password: ['required', 'strongPassword'],
            confirmPassword: ['required', { name: 'confirmPassword', passwordField: 'password' }],
            contactNumber: ['phone']
        };
    }

    static getBookingValidation() {
        return {
            guestName: ['required', { name: 'minLength', minLength: 2 }],
            guestEmail: ['required', 'email'],
            checkInDate: ['required', 'date', 'futureDate'],
            checkOutDate: ['required', 'date', 'futureDate'],
            numberOfGuests: ['required', 'integer', { name: 'min', min: 1 }, { name: 'max', max: 10 }]
        };
    }

    static getPaymentValidation() {
        return {
            cardNumber: ['required', { name: 'pattern', pattern: '^[0-9]{13,19}$', message: 'Invalid card number' }],
            expiryMonth: ['required', 'integer', { name: 'min', min: 1 }, { name: 'max', max: 12 }],
            expiryYear: ['required', 'integer', { name: 'min', min: new Date().getFullYear() }],
            cvv: ['required', { name: 'pattern', pattern: '^[0-9]{3,4}$', message: 'Invalid CVV' }],
            cardHolderName: ['required', { name: 'minLength', minLength: 2 }]
        };
    }

    static getReviewValidation() {
        return {
            rating: ['required', 'integer', { name: 'min', min: 1 }, { name: 'max', max: 5 }],
            comment: ['required', { name: 'minLength', minLength: 10 }, { name: 'maxLength', maxLength: 1000 }]
        };
    }

    static getHotelValidation() {
        return {
            name: ['required', { name: 'minLength', minLength: 2 }],
            address: ['required', { name: 'minLength', minLength: 5 }],
            city: ['required', { name: 'minLength', minLength: 2 }],
            pricePerNight: ['required', 'number', { name: 'min', min: 0 }],
            availableRooms: ['required', 'integer', { name: 'min', min: 0 }]
        };
    }
}

// Add CSS for validation styling
const validationStyles = `
    .error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 1px #ef4444 !important;
    }

    .valid {
        border-color: #10b981 !important;
    }

    .error-message {
        color: #ef4444;
        font-size: 14px;
        margin-top: 4px;
        display: block;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }
`;

// Add styles to document
if (!document.getElementById('validation-styles')) {
    const style = document.createElement('style');
    style.id = 'validation-styles';
    style.textContent = validationStyles;
    document.head.appendChild(style);
}

// Export classes
window.Validator = Validator;
window.FormValidator = FormValidator;
window.HotelValidationRules = HotelValidationRules;
window.ValidationError = ValidationError;


