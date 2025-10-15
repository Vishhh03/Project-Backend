// API Client with complete endpoint integration

const API = {
    // Get auth token
    getToken() {
        return Utils.storage.get(APP_CONFIG.tokenKey);
    },

    // Set auth token
    setToken(token) {
        Utils.storage.set(APP_CONFIG.tokenKey, token);
    },

    // Remove auth token
    removeToken() {
        Utils.storage.remove(APP_CONFIG.tokenKey);
    },

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                ...API_CONFIG.headers,
                ...options.headers
            }
        };

        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Handle empty responses (204 No Content)
            if (response.status === 204) {
                return null;
            }

            const contentType = response.headers.get('content-type');
            const data = contentType && contentType.includes('application/json')
                ? await response.json().catch(() => null)
                : null;

            if (!response.ok) {
                // Provide helpful error messages
                let message = 'Request failed';
                
                if (response.status === 404) {
                    message = 'Resource not found. Make sure the API is running on https://localhost:7000';
                } else if (response.status === 401) {
                    message = 'Unauthorized. Please login again.';
                } else if (response.status === 403) {
                    message = 'Access denied. You do not have permission.';
                } else if (response.status === 500) {
                    message = 'Server error. Please try again later.';
                } else if (data?.message || data?.details) {
                    message = data.message || data.details;
                }

                throw {
                    status: response.status,
                    message,
                    data
                };
            }

            return data;
        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('Network Error: Cannot connect to API. Make sure the API is running on https://localhost:7000');
                throw {
                    status: 0,
                    message: 'Cannot connect to API. Make sure the backend is running on https://localhost:7000',
                    data: null
                };
            }
            
            console.error('API Error:', error);
            throw error;
        }
    },

    // HTTP Methods
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    },

    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Auth Endpoints
    auth: {
        async register(data) {
            return API.post(API_ENDPOINTS.register, data);
        },

        async login(email, password) {
            return API.post(API_ENDPOINTS.login, { email, password });
        },

        async getMe() {
            return API.get(API_ENDPOINTS.me);
        },

        async applyHotelManager(data) {
            return API.post(API_ENDPOINTS.applyHotelManager, data);
        },

        async getMyApplication() {
            return API.get(API_ENDPOINTS.myApplication);
        },

        async getApplications(status) {
            const query = status ? `?status=${status}` : '';
            return API.get(API_ENDPOINTS.adminApplications + query);
        },

        async processApplication(id, data) {
            return API.post(API_ENDPOINTS.processApplication(id), data);
        }
    },

    // Hotel Endpoints
    hotels: {
        async getAll() {
            return API.get(API_ENDPOINTS.hotels);
        },

        async getById(id) {
            return API.get(API_ENDPOINTS.hotel(id));
        },

        async search(params) {
            const query = new URLSearchParams(params).toString();
            return API.get(`${API_ENDPOINTS.searchHotels}?${query}`);
        },

        async create(data) {
            return API.post(API_ENDPOINTS.hotels, data);
        },

        async update(id, data) {
            return API.put(API_ENDPOINTS.hotel(id), data);
        },

        async delete(id) {
            return API.delete(API_ENDPOINTS.hotel(id));
        }
    },

    // Booking Endpoints
    bookings: {
        async getAll() {
            return API.get(API_ENDPOINTS.bookings);
        },

        async getById(id) {
            return API.get(API_ENDPOINTS.booking(id));
        },

        async getMy() {
            return API.get(API_ENDPOINTS.myBookings);
        },

        async search(email) {
            return API.get(`${API_ENDPOINTS.searchBookings}?email=${email}`);
        },

        async create(data) {
            return API.post(API_ENDPOINTS.bookings, data);
        },

        async cancel(id) {
            return API.put(API_ENDPOINTS.cancelBooking(id));
        },

        async processPayment(id, paymentData) {
            return API.post(API_ENDPOINTS.bookingPayment(id), paymentData);
        }
    },

    // Review Endpoints
    reviews: {
        async getHotelReviews(hotelId) {
            return API.get(API_ENDPOINTS.hotelReviews(hotelId));
        },

        async create(data) {
            return API.post(API_ENDPOINTS.reviews, data);
        },

        async update(id, data) {
            return API.put(API_ENDPOINTS.review(id), data);
        },

        async delete(id) {
            return API.delete(API_ENDPOINTS.review(id));
        }
    },

    // Loyalty Endpoints
    loyalty: {
        async getAccount() {
            return API.get(API_ENDPOINTS.loyaltyAccount);
        },

        async getTransactions() {
            return API.get(API_ENDPOINTS.loyaltyTransactions);
        }
    },

    // Payment Endpoints
    payments: {
        async getById(id) {
            return API.get(API_ENDPOINTS.payment(id));
        },

        async refund(id, data) {
            return API.post(API_ENDPOINTS.refundPayment(id), data);
        }
    }
};
