/**
 * Global Error Handler
 * Provides centralized error handling with user-friendly messages,
 * retry mechanisms, and offline detection
 */

class ApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
        this.timestamp = new Date();
        this.isRetryable = this.determineRetryability(status);
    }

    determineRetryability(status) {
        // Network errors and server errors are retryable
        return !status || status >= 500 || status === 408 || status === 429;
    }
}

class ValidationError extends Error {
    constructor(field, message, value = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
        this.type = 'validation';
    }
}

class NetworkError extends Error {
    constructor(message = 'Network connection failed') {
        super(message);
        this.name = 'NetworkError';
        this.isRetryable = true;
    }
}

class ErrorHandler {
    constructor() {
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // Base delay in ms
        this.isOnline = navigator.onLine;
        this.setupOfflineDetection();
        this.setupGlobalErrorHandling();
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnlineStatusChange(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOnlineStatusChange(false);
        });
    }

    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
            event.preventDefault();
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });
    }

    handleOnlineStatusChange(isOnline) {
        const event = new CustomEvent('networkStatusChange', {
            detail: { isOnline }
        });
        window.dispatchEvent(event);

        if (isOnline) {
            this.showNotification('Connection restored', 'success');
            // Retry failed requests
            this.retryFailedRequests();
        } else {
            this.showNotification('Connection lost. Some features may be limited.', 'warning');
        }
    }

    async retryFailedRequests() {
        // This would integrate with a request queue system
        // For now, we'll just clear retry attempts
        this.retryAttempts.clear();
    }

    handleError(error, context = {}) {
        console.error('Error handled:', error, context);

        if (error instanceof ApiError) {
            return this.handleApiError(error, context);
        } else if (error instanceof ValidationError) {
            return this.handleValidationError(error, context);
        } else if (error instanceof NetworkError) {
            return this.handleNetworkError(error, context);
        } else {
            return this.handleGenericError(error, context);
        }
    }

    handleApiError(error, context) {
        const userMessage = this.getApiErrorMessage(error);
        
        if (error.isRetryable && this.shouldRetry(context.requestId)) {
            return this.scheduleRetry(context.requestId, context.retryFunction);
        }

        this.showNotification(userMessage, 'error');
        return { handled: true, retry: false };
    }

    handleValidationError(error, context) {
        // Validation errors are handled by form components
        // But we can log them for debugging
        console.warn('Validation error:', error.field, error.message);
        return { handled: true, retry: false };
    }

    handleNetworkError(error, context) {
        if (!this.isOnline) {
            this.showNotification('You are offline. Please check your connection.', 'warning');
            return { handled: true, retry: false };
        }

        if (this.shouldRetry(context.requestId)) {
            return this.scheduleRetry(context.requestId, context.retryFunction);
        }

        this.showNotification('Network error. Please try again.', 'error');
        return { handled: true, retry: false };
    }

    handleGenericError(error, context) {
        const message = error.message || 'An unexpected error occurred';
        this.showNotification(message, 'error');
        return { handled: true, retry: false };
    }

    getApiErrorMessage(error) {
        const statusMessages = {
            400: 'Invalid request. Please check your input.',
            401: 'Please log in to continue.',
            403: 'You don\'t have permission to perform this action.',
            404: 'The requested resource was not found.',
            409: 'This action conflicts with existing data.',
            422: 'The provided data is invalid.',
            429: 'Too many requests. Please wait a moment.',
            500: 'Server error. Please try again later.',
            502: 'Service temporarily unavailable.',
            503: 'Service temporarily unavailable.',
            504: 'Request timeout. Please try again.'
        };

        return statusMessages[error.status] || error.message || 'An error occurred';
    }

    shouldRetry(requestId) {
        if (!requestId) return false;
        
        const attempts = this.retryAttempts.get(requestId) || 0;
        return attempts < this.maxRetries;
    }

    async scheduleRetry(requestId, retryFunction) {
        if (!retryFunction) return { handled: true, retry: false };

        const attempts = this.retryAttempts.get(requestId) || 0;
        this.retryAttempts.set(requestId, attempts + 1);

        const delay = this.retryDelay * Math.pow(2, attempts); // Exponential backoff
        
        this.showNotification(`Retrying... (${attempts + 1}/${this.maxRetries})`, 'info');

        setTimeout(async () => {
            try {
                await retryFunction();
                this.retryAttempts.delete(requestId);
                this.showNotification('Request successful', 'success');
            } catch (error) {
                this.handleError(error, { requestId, retryFunction });
            }
        }, delay);

        return { handled: true, retry: true };
    }

    showNotification(message, type) {
        // Use the notification service if available
        if (window.notificationService) {
            window.notificationService.show(message, type);
        } else {
            // Fallback to custom event
            const event = new CustomEvent('showNotification', {
                detail: { message, type }
            });
            window.dispatchEvent(event);
        }
    }

    // Graceful degradation helpers
    isFeatureAvailable(feature) {
        if (!this.isOnline) {
            const offlineFeatures = ['viewBookings', 'viewProfile', 'logout'];
            return offlineFeatures.includes(feature);
        }
        return true;
    }

    getOfflineMessage(feature) {
        return `${feature} is not available offline. Please check your connection.`;
    }

    // Utility method for components to handle errors consistently
    async withErrorHandling(asyncFunction, context = {}) {
        try {
            return await asyncFunction();
        } catch (error) {
            const result = this.handleError(error, context);
            if (!result.retry) {
                throw error; // Re-throw if not retrying
            }
            return null; // Return null if retrying
        }
    }
}

// Export classes and create global instance
window.ApiError = ApiError;
window.ValidationError = ValidationError;
window.NetworkError = NetworkError;

// Create global error handler instance
window.errorHandler = new ErrorHandler();


