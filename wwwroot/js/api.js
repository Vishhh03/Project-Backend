// Simple API client with mock data
const API = {
    baseURL: '/api',
    useMockData: true, // Toggle for development
    
    // Mock data
    mockData: {
        hotels: [
            {
                id: 1,
                name: 'Grand Palace Hotel',
                city: 'Mumbai',
                description: 'Luxury hotel in the heart of Mumbai with stunning city views',
                pricePerNight: 8500,
                rating: 4.8,
                amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'],
                image: 'https://picsum.photos/600/400?random=1'
            },
            {
                id: 2,
                name: 'Seaside Resort',
                city: 'Goa',
                description: 'Beautiful beachfront resort with private beach access',
                pricePerNight: 6200,
                rating: 4.6,
                amenities: ['WiFi', 'Beach', 'Pool', 'Restaurant', 'Bar'],
                image: 'https://picsum.photos/600/400?random=2'
            },
            {
                id: 3,
                name: 'Mountain View Lodge',
                city: 'Shimla',
                description: 'Cozy mountain lodge with breathtaking Himalayan views',
                pricePerNight: 4500,
                rating: 4.4,
                amenities: ['WiFi', 'Fireplace', 'Restaurant', 'Trekking'],
                image: 'https://picsum.photos/600/400?random=3'
            },
            {
                id: 4,
                name: 'City Center Inn',
                city: 'Delhi',
                description: 'Modern hotel in the business district with excellent connectivity',
                pricePerNight: 5800,
                rating: 4.2,
                amenities: ['WiFi', 'Business Center', 'Gym', 'Restaurant'],
                image: 'https://picsum.photos/600/400?random=4'
            },
            {
                id: 5,
                name: 'Heritage Palace',
                city: 'Jaipur',
                description: 'Royal heritage hotel with traditional Rajasthani architecture',
                pricePerNight: 7200,
                rating: 4.7,
                amenities: ['WiFi', 'Pool', 'Spa', 'Cultural Shows', 'Restaurant'],
                image: 'https://picsum.photos/600/400?random=5'
            },
            {
                id: 6,
                name: 'Tech Hub Hotel',
                city: 'Bangalore',
                description: 'Modern hotel catering to business travelers and tech professionals',
                pricePerNight: 5200,
                rating: 4.3,
                amenities: ['WiFi', 'Business Center', 'Gym', 'Co-working Space'],
                image: 'https://picsum.photos/600/400?random=6'
            }
        ],
        bookings: [
            {
                id: 1,
                hotelId: 1,
                hotelName: 'Grand Palace Hotel',
                checkInDate: '2024-03-15',
                checkOutDate: '2024-03-18',
                guests: 2,
                totalAmount: 25500,
                status: 'Confirmed'
            },
            {
                id: 2,
                hotelId: 2,
                hotelName: 'Seaside Resort',
                checkInDate: '2024-04-10',
                checkOutDate: '2024-04-14',
                guests: 4,
                totalAmount: 24800,
                status: 'Confirmed'
            }
        ],
        user: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Customer'
        }
    },
    
    // Get auth token
    getToken() {
        return localStorage.getItem('token');
    },
    
    // Set auth token
    setToken(token) {
        localStorage.setItem('token', token);
    },
    
    // Remove auth token
    removeToken() {
        localStorage.removeItem('token');
    },
    
    // Simulate API delay
    async delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Make HTTP request (with mock data fallback)
    async request(endpoint, options = {}) {
        if (this.useMockData) {
            await this.delay(); // Simulate network delay
            return this.handleMockRequest(endpoint, options);
        }
        
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Handle mock requests
    handleMockRequest(endpoint, options) {
        const method = options.method || 'GET';
        
        // Auth endpoints
        if (endpoint === '/auth/login') {
            const { email, password } = JSON.parse(options.body);
            if (email && password) {
                // Generate a fake JWT token
                const token = btoa(JSON.stringify({
                    sub: this.mockData.user.id,
                    name: this.mockData.user.name,
                    email: this.mockData.user.email,
                    role: this.mockData.user.role,
                    exp: Date.now() + 86400000 // 24 hours
                }));
                return { token, user: this.mockData.user };
            }
            throw new Error('Invalid credentials');
        }
        
        if (endpoint === '/auth/register') {
            const { name, email, password } = JSON.parse(options.body);
            if (name && email && password) {
                const newUser = { ...this.mockData.user, name, email };
                const token = btoa(JSON.stringify({
                    sub: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    exp: Date.now() + 86400000
                }));
                return { token, user: newUser };
            }
            throw new Error('Registration failed');
        }
        
        // Hotels endpoints
        if (endpoint === '/hotels') {
            return this.mockData.hotels;
        }
        
        if (endpoint.startsWith('/hotels/')) {
            const id = parseInt(endpoint.split('/')[2]);
            const hotel = this.mockData.hotels.find(h => h.id === id);
            if (!hotel) throw new Error('Hotel not found');
            return hotel;
        }
        
        if (endpoint.startsWith('/hotels/search')) {
            const query = new URLSearchParams(endpoint.split('?')[1]).get('q').toLowerCase();
            return this.mockData.hotels.filter(hotel => 
                hotel.name.toLowerCase().includes(query) ||
                hotel.city.toLowerCase().includes(query) ||
                hotel.description.toLowerCase().includes(query)
            );
        }
        
        // Bookings endpoints
        if (endpoint === '/bookings') {
            if (method === 'GET') {
                return this.mockData.bookings;
            }
            if (method === 'POST') {
                const booking = JSON.parse(options.body);
                const hotel = this.mockData.hotels.find(h => h.id === booking.hotelId);
                const newBooking = {
                    id: this.mockData.bookings.length + 1,
                    ...booking,
                    hotelName: hotel?.name || 'Unknown Hotel',
                    totalAmount: hotel ? hotel.pricePerNight * 3 : 5000, // Assume 3 nights
                    status: 'Confirmed'
                };
                this.mockData.bookings.push(newBooking);
                return newBooking;
            }
        }
        
        throw new Error(`Mock endpoint not implemented: ${endpoint}`);
    },
    
    // HTTP methods
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },
    
    // Specific API endpoints
    auth: {
        login(email, password) {
            return API.post('/auth/login', { email, password });
        },
        
        register(name, email, password) {
            return API.post('/auth/register', { name, email, password });
        },
        
        logout() {
            API.removeToken();
            return Promise.resolve();
        }
    },
    
    hotels: {
        getAll() {
            return API.get('/hotels');
        },
        
        getById(id) {
            return API.get(`/hotels/${id}`);
        },
        
        search(query) {
            return API.get(`/hotels/search?q=${encodeURIComponent(query)}`);
        }
    },
    
    bookings: {
        getAll() {
            return API.get('/bookings');
        },
        
        create(booking) {
            return API.post('/bookings', booking);
        },
        
        getById(id) {
            return API.get(`/bookings/${id}`);
        },
        
        cancel(id) {
            return API.delete(`/bookings/${id}`);
        }
    }
};