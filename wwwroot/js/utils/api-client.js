/**
 * ApiClient - HTTP client wrapper for API communication
 * Handles JWT token management, error handling, and response parsing
 */
class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.token = null;
        this.requestQueue = new Map(); // For retry mechanism
    }

    /**
     * Set JWT token for authenticated requests
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Clear JWT token
     */
    clearToken() {
        this.token = null;
    }

    /**
     * Get default headers for requests
     * @returns {Object} Headers object
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Handle API response
     * @param {Response} response - Fetch response object
     * @returns {Promise} Parsed response data
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            // Create appropriate error type based on status
            let error;
            if (!navigator.onLine) {
                error = new NetworkError('No internet connection');
            } else {
                error = new ApiError(
                    data.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    data
                );
            }
            throw error;
        }

        return data;
    }

    /**
     * Generate unique request ID for retry mechanism
     * @returns {string} Unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Execute request with error handling and retry logic
     * @param {Function} requestFunction - Function that makes the actual request
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async executeRequest(requestFunction, method, endpoint) {
        const requestId = this.generateRequestId();
        
        try {
            return await requestFunction();
        } catch (error) {
            // Handle the error through the global error handler
            const context = {
                requestId,
                method,
                endpoint,
                retryFunction: requestFunction
            };

            if (window.errorHandler) {
                const result = window.errorHandler.handleError(error, context);
                if (result.retry) {
                    // Store the request for potential retry
                    this.requestQueue.set(requestId, { requestFunction, method, endpoint });
                    return null; // Will be retried by error handler
                }
            }
            
            throw error;
        }
    }

    /**
     * Make HTTP GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise} Response data
     */
    async get(endpoint, params = {}) {
        const requestFunction = async () => {
            const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
            
            // Add query parameters
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    url.searchParams.append(key, params[key]);
                }
            });

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        };

        return await this.executeRequest(requestFunction, 'GET', endpoint);
    }

    /**
     * Make HTTP POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async post(endpoint, data = {}) {
        const requestFunction = async () => {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        };

        return await this.executeRequest(requestFunction, 'POST', endpoint);
    }

    /**
     * Make HTTP PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async put(endpoint, data = {}) {
        const requestFunction = async () => {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        };

        return await this.executeRequest(requestFunction, 'PUT', endpoint);
    }

    /**
     * Make HTTP DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async delete(endpoint) {
        const requestFunction = async () => {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        };

        return await this.executeRequest(requestFunction, 'DELETE', endpoint);
    }

    /**
     * Make HTTP PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async patch(endpoint, data = {}) {
        const requestFunction = async () => {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        };

        return await this.executeRequest(requestFunction, 'PATCH', endpoint);
    }
}

// Export for use in other modules
window.ApiClient = ApiClient;


