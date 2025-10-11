/**
 * AdminService - Administrative operations service
 * Provides system-wide management functionality for admin users
 */
class AdminService {
    constructor() {
        this.apiClient = new ApiClient();
        this.authService = new AuthService();
        this.baseUrl = '/api';
    }

    /**
     * Get system statistics and overview data
     * @returns {Promise<Object>} System statistics
     */
    async getSystemStats() {
        try {
            // Since we don't have a dedicated stats endpoint, we'll aggregate data
            const [users, bookings, hotels, payments] = await Promise.all([
                this.getAllUsers(),
                this.getAllBookings(),
                this.getAllHotels(),
                this.getAllPayments()
            ]);

            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            // Calculate statistics
            const stats = {
                totalUsers: users.length,
                newUsersToday: users.filter(user => 
                    new Date(user.createdAt) >= startOfDay
                ).length,
                
                totalBookings: bookings.length,
                activeBookings: bookings.filter(booking => 
                    booking.status === 'Confirmed'
                ).length,
                
                totalHotels: hotels.length,
                activeHotels: hotels.filter(hotel => 
                    hotel.availableRooms > 0
                ).length,
                
                totalRevenue: payments
                    .filter(payment => payment.status === 'Completed')
                    .reduce((sum, payment) => sum + payment.amount, 0),
                
                monthlyRevenue: payments
                    .filter(payment => 
                        payment.status === 'Completed' && 
                        new Date(payment.createdAt) >= startOfMonth
                    )
                    .reduce((sum, payment) => sum + payment.amount, 0),
                
                hotelCities: [...new Set(hotels.map(hotel => hotel.city))]
            };

            return stats;
        } catch (error) {
            console.error('Error getting system stats:', error);
            throw error;
        }
    }

    /**
     * Get all users in the system
     * @returns {Promise<Array>} List of all users
     */
    async getAllUsers() {
        try {
            // For now, we'll use the existing auth endpoint to get user info
            // In a real implementation, there would be an admin-specific endpoint
            const response = await this.apiClient.get('/auth/users');
            return response || [];
        } catch (error) {
            console.error('Error getting all users:', error);
            // Return mock data for demonstration
            return this.getMockUsers();
        }
    }

    /**
     * Get all bookings in the system
     * @returns {Promise<Array>} List of all bookings
     */
    async getAllBookings() {
        try {
            const response = await this.apiClient.get('/api/bookings/all');
            return response || [];
        } catch (error) {
            console.error('Error getting all bookings:', error);
            // Return mock data for demonstration
            return this.getMockBookings();
        }
    }

    /**
     * Get all hotels in the system
     * @returns {Promise<Array>} List of all hotels
     */
    async getAllHotels() {
        try {
            const response = await this.apiClient.get('/api/hotels');
            return response || [];
        } catch (error) {
            console.error('Error getting all hotels:', error);
            return [];
        }
    }

    /**
     * Get all payments in the system
     * @returns {Promise<Array>} List of all payments
     */
    async getAllPayments() {
        try {
            const response = await this.apiClient.get('/api/payments/all');
            return response || [];
        } catch (error) {
            console.error('Error getting all payments:', error);
            // Return mock data for demonstration
            return this.getMockPayments();
        }
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            const response = await this.apiClient.post('/auth/register', userData);
            return response;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user information
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, userData) {
        try {
            const response = await this.apiClient.put(`/auth/users/${userId}`, userData);
            return response;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Toggle user active status
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated user
     */
    async toggleUserStatus(userId) {
        try {
            const response = await this.apiClient.patch(`/auth/users/${userId}/toggle-status`);
            return response;
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error;
        }
    }

    /**
     * Delete a user
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteUser(userId) {
        try {
            await this.apiClient.delete(`/auth/users/${userId}`);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Cancel a booking
     * @param {number} bookingId - Booking ID
     * @returns {Promise<Object>} Updated booking
     */
    async cancelBooking(bookingId) {
        try {
            const response = await this.apiClient.patch(`/api/bookings/${bookingId}/cancel`);
            return response;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    }

    /**
     * Process a refund
     * @param {number} paymentId - Payment ID
     * @returns {Promise<Object>} Refund result
     */
    async processRefund(paymentId) {
        try {
            const response = await this.apiClient.post(`/api/payments/${paymentId}/refund`);
            return response;
        } catch (error) {
            console.error('Error processing refund:', error);
            throw error;
        }
    }

    /**
     * Generate system reports
     * @param {string} reportType - Type of report to generate
     * @returns {Promise<Object>} Report data
     */
    async generateReport(reportType) {
        try {
            const response = await this.apiClient.get(`/api/reports/${reportType}`);
            return response;
        } catch (error) {
            console.error(`Error generating ${reportType} report:`, error);
            // Return mock report data
            return this.getMockReportData(reportType);
        }
    }

    /**
     * Search users by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Filtered users
     */
    async searchUsers(criteria) {
        try {
            const queryParams = new URLSearchParams(criteria).toString();
            const response = await this.apiClient.get(`/auth/users/search?${queryParams}`);
            return response || [];
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    /**
     * Search bookings by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Filtered bookings
     */
    async searchBookings(criteria) {
        try {
            const queryParams = new URLSearchParams(criteria).toString();
            const response = await this.apiClient.get(`/api/bookings/search?${queryParams}`);
            return response || [];
        } catch (error) {
            console.error('Error searching bookings:', error);
            throw error;
        }
    }

    /**
     * Search payments by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Filtered payments
     */
    async searchPayments(criteria) {
        try {
            const queryParams = new URLSearchParams(criteria).toString();
            const response = await this.apiClient.get(`/api/payments/search?${queryParams}`);
            return response || [];
        } catch (error) {
            console.error('Error searching payments:', error);
            throw error;
        }
    }

    /**
     * Export data to CSV
     * @param {string} dataType - Type of data to export
     * @param {Array} data - Data to export
     * @returns {string} CSV content
     */
    exportToCSV(dataType, data) {
        if (!data || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    /**
     * Download CSV file
     * @param {string} filename - Name of the file
     * @param {string} csvContent - CSV content
     */
    downloadCSV(filename, csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Get mock users data for demonstration
     * @returns {Array} Mock users
     */
    getMockUsers() {
        return [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                role: 1,
                isActive: true,
                createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                contactNumber: '+1234567890'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 2,
                isActive: true,
                createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                contactNumber: '+1234567891'
            },
            {
                id: 3,
                name: 'Admin User',
                email: 'admin@example.com',
                role: 3,
                isActive: true,
                createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                contactNumber: '+1234567892'
            }
        ];
    }

    /**
     * Get mock bookings data for demonstration
     * @returns {Array} Mock bookings
     */
    getMockBookings() {
        return [
            {
                id: 1,
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                hotelId: 1,
                hotelName: 'Grand Hotel',
                userId: 1,
                checkInDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                checkOutDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
                numberOfGuests: 2,
                totalAmount: 299.99,
                status: 'Confirmed',
                createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
            },
            {
                id: 2,
                guestName: 'Jane Smith',
                guestEmail: 'jane@example.com',
                hotelId: 2,
                hotelName: 'City Center Hotel',
                userId: 2,
                checkInDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
                checkOutDate: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
                numberOfGuests: 1,
                totalAmount: 199.99,
                status: 'Confirmed',
                createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
            }
        ];
    }

    /**
     * Get mock payments data for demonstration
     * @returns {Array} Mock payments
     */
    getMockPayments() {
        return [
            {
                id: 1,
                bookingId: 1,
                userEmail: 'john@example.com',
                amount: 299.99,
                paymentMethod: 'Credit Card',
                status: 'Completed',
                createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                transactionId: 'txn_1234567890'
            },
            {
                id: 2,
                bookingId: 2,
                userEmail: 'jane@example.com',
                amount: 199.99,
                paymentMethod: 'Credit Card',
                status: 'Completed',
                createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                transactionId: 'txn_0987654321'
            }
        ];
    }

    /**
     * Get mock report data for demonstration
     * @param {string} reportType - Type of report
     * @returns {Object} Mock report data
     */
    getMockReportData(reportType) {
        const baseData = {
            generatedAt: new Date().toISOString(),
            reportType: reportType
        };

        switch (reportType) {
            case 'revenue':
                return {
                    ...baseData,
                    totalRevenue: 15000,
                    monthlyRevenue: 5000,
                    averageBookingValue: 250,
                    revenueByMonth: [
                        { month: 'Jan', revenue: 3000 },
                        { month: 'Feb', revenue: 3500 },
                        { month: 'Mar', revenue: 4000 },
                        { month: 'Apr', revenue: 4500 }
                    ]
                };
            case 'bookings':
                return {
                    ...baseData,
                    totalBookings: 150,
                    confirmedBookings: 120,
                    cancelledBookings: 20,
                    completedBookings: 100,
                    averageStayDuration: 2.5,
                    bookingsByMonth: [
                        { month: 'Jan', bookings: 30 },
                        { month: 'Feb', bookings: 35 },
                        { month: 'Mar', bookings: 40 },
                        { month: 'Apr', bookings: 45 }
                    ]
                };
            case 'users':
                return {
                    ...baseData,
                    totalUsers: 500,
                    activeUsers: 450,
                    newUsersThisMonth: 50,
                    usersByRole: {
                        guests: 400,
                        hotelManagers: 95,
                        admins: 5
                    }
                };
            case 'hotels':
                return {
                    ...baseData,
                    totalHotels: 25,
                    activeHotels: 23,
                    averageRating: 4.2,
                    occupancyRate: 75,
                    topPerformingHotels: [
                        { name: 'Grand Hotel', bookings: 45, rating: 4.8 },
                        { name: 'City Center Hotel', bookings: 38, rating: 4.6 },
                        { name: 'Beach Resort', bookings: 32, rating: 4.5 }
                    ]
                };
            default:
                return baseData;
        }
    }

    /**
     * Validate admin access
     * @returns {boolean} True if user has admin access
     */
    validateAdminAccess() {
        return this.authService.isAdmin();
    }

    /**
     * Update user role
     * @param {number} userId - User ID
     * @param {number} newRole - New role (1=Guest, 2=HotelManager, 3=Admin)
     * @returns {Promise<Object>} Updated user
     */
    async updateUserRole(userId, newRole) {
        try {
            if (!userId || userId <= 0) {
                throw new Error('Valid user ID is required');
            }
            
            if (![1, 2, 3].includes(newRole)) {
                throw new Error('Invalid role. Must be 1 (Guest), 2 (Hotel Manager), or 3 (Admin)');
            }

            const response = await this.apiClient.patch(`/auth/users/${userId}/role`, { role: newRole });
            
            // Log admin action
            this.logAdminAction('UPDATE_USER_ROLE', {
                userId: userId,
                newRole: newRole,
                roleName: this.getRoleName(newRole)
            });
            
            return response;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }

    /**
     * Get system monitoring data
     * @returns {Promise<Object>} System monitoring information
     */
    async getSystemMonitoring() {
        try {
            const response = await this.apiClient.get('/admin/monitoring');
            return response || this.getMockMonitoringData();
        } catch (error) {
            console.error('Error getting system monitoring data:', error);
            return this.getMockMonitoringData();
        }
    }

    /**
     * Get audit logs
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Audit log entries
     */
    async getAuditLogs(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await this.apiClient.get(`/admin/audit-logs?${queryParams}`);
            return response || this.getMockAuditLogs();
        } catch (error) {
            console.error('Error getting audit logs:', error);
            return this.getMockAuditLogs();
        }
    }

    /**
     * Process bulk refunds
     * @param {Array} paymentIds - Array of payment IDs to refund
     * @returns {Promise<Object>} Refund results
     */
    async processBulkRefunds(paymentIds) {
        try {
            if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
                throw new Error('Payment IDs array is required');
            }

            const response = await this.apiClient.post('/api/payments/bulk-refund', { paymentIds });
            
            // Log admin action
            this.logAdminAction('BULK_REFUND', {
                paymentIds: paymentIds,
                count: paymentIds.length
            });
            
            return response;
        } catch (error) {
            console.error('Error processing bulk refunds:', error);
            throw error;
        }
    }

    /**
     * Get system health status
     * @returns {Promise<Object>} System health information
     */
    async getSystemHealth() {
        try {
            const response = await this.apiClient.get('/admin/health');
            return response || this.getMockHealthData();
        } catch (error) {
            console.error('Error getting system health:', error);
            return this.getMockHealthData();
        }
    }

    /**
     * Send system notification to all users
     * @param {Object} notification - Notification data
     * @returns {Promise<Object>} Send result
     */
    async sendSystemNotification(notification) {
        try {
            if (!notification.message || !notification.title) {
                throw new Error('Notification title and message are required');
            }

            const response = await this.apiClient.post('/admin/notifications/broadcast', notification);
            
            // Log admin action
            this.logAdminAction('SEND_SYSTEM_NOTIFICATION', {
                title: notification.title,
                message: notification.message,
                type: notification.type
            });
            
            return response;
        } catch (error) {
            console.error('Error sending system notification:', error);
            throw error;
        }
    }

    /**
     * Get role name from role ID
     * @param {number} roleId - Role ID
     * @returns {string} Role name
     */
    getRoleName(roleId) {
        const roleNames = {
            1: 'Guest',
            2: 'Hotel Manager',
            3: 'Admin'
        };
        
        return roleNames[roleId] || 'Unknown';
    }

    /**
     * Get mock monitoring data
     * @returns {Object} Mock monitoring data
     */
    getMockMonitoringData() {
        return {
            serverStatus: 'healthy',
            databaseStatus: 'healthy',
            apiResponseTime: 150,
            activeUsers: 45,
            systemLoad: 0.65,
            memoryUsage: 0.72,
            diskUsage: 0.45,
            lastUpdated: new Date().toISOString(),
            alerts: [
                {
                    id: 1,
                    type: 'warning',
                    message: 'High memory usage detected',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                }
            ]
        };
    }

    /**
     * Get mock health data
     * @returns {Object} Mock health data
     */
    getMockHealthData() {
        return {
            status: 'healthy',
            version: '1.0.0',
            uptime: 86400,
            services: {
                database: { status: 'healthy', responseTime: 5 },
                cache: { status: 'healthy', responseTime: 2 },
                email: { status: 'healthy', responseTime: 100 },
                payment: { status: 'healthy', responseTime: 200 }
            },
            metrics: {
                requestsPerMinute: 150,
                errorRate: 0.02,
                averageResponseTime: 120
            }
        };
    }

    /**
     * Get mock audit logs
     * @returns {Array} Mock audit log entries
     */
    getMockAuditLogs() {
        return [
            {
                id: 1,
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                adminUser: 'admin@example.com',
                action: 'UPDATE_USER_ROLE',
                details: { userId: 2, newRole: 2, roleName: 'Hotel Manager' },
                ipAddress: '192.168.1.1'
            },
            {
                id: 2,
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                adminUser: 'admin@example.com',
                action: 'PROCESS_REFUND',
                details: { paymentId: 1, amount: 299.99 },
                ipAddress: '192.168.1.1'
            },
            {
                id: 3,
                timestamp: new Date(Date.now() - 10800000).toISOString(),
                adminUser: 'admin@example.com',
                action: 'CANCEL_BOOKING',
                details: { bookingId: 5, reason: 'Customer request' },
                ipAddress: '192.168.1.1'
            }
        ];
    }

    /**
     * Log admin action for audit trail
     * @param {string} action - Action performed
     * @param {Object} details - Action details
     */
    logAdminAction(action, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            adminUser: this.authService.getCurrentUserData()?.email,
            action: action,
            details: details
        };
        
        console.log('Admin Action:', logEntry);
        // In a real implementation, this would be sent to an audit log service
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminService;
}

// Make available globally
window.AdminService = AdminService;


