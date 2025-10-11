/**
 * AdminDashboardComponent - Administrative dashboard with system overview
 * Provides user management, booking management, and payment management for admin users
 */
class AdminDashboardComponent {
    constructor(container) {
        this.container = container;
        this.authService = new AuthService();
        this.bookingService = new BookingService(new ApiClient(), this.authService);
        this.hotelService = new HotelService();
        this.paymentService = new PaymentService();
        this.adminService = new AdminService();
        
        this.currentView = 'overview';
        this.users = [];
        this.bookings = [];
        this.payments = [];
        this.systemStats = {};
        
        this.initialize();
    }

    /**
     * Initialize the admin dashboard
     */
    async initialize() {
        try {
            // Verify admin access
            if (!this.authService.isAdmin()) {
                throw new Error('Access denied. Admin privileges required.');
            }

            await this.loadSystemData();
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Load system data for dashboard
     */
    async loadSystemData() {
        try {
            // Load system statistics
            this.systemStats = await this.adminService.getSystemStats();
            
            // Load recent data for overview
            this.users = await this.adminService.getAllUsers();
            this.bookings = await this.adminService.getAllBookings();
            this.payments = await this.adminService.getAllPayments();
        } catch (error) {
            console.error('Error loading system data:', error);
            throw error;
        }
    }

    /**
     * Render the admin dashboard
     */
    render() {
        this.container.innerHTML = `
            <div class="admin-dashboard">
                <div class="admin-header">
                    <h1>Admin Dashboard</h1>
                    <div class="admin-user-info">
                        <span>Welcome, ${this.authService.getCurrentUserData()?.name || 'Admin'}</span>
                        <button class="btn btn-secondary" id="admin-logout">Logout</button>
                    </div>
                </div>

                <div class="admin-navigation">
                    <nav class="admin-nav">
                        <button class="nav-btn ${this.currentView === 'overview' ? 'active' : ''}" data-view="overview">
                            <i class="icon-dashboard"></i> Overview
                        </button>
                        <button class="nav-btn ${this.currentView === 'users' ? 'active' : ''}" data-view="users">
                            <i class="icon-users"></i> User Management
                        </button>
                        <button class="nav-btn ${this.currentView === 'bookings' ? 'active' : ''}" data-view="bookings">
                            <i class="icon-bookings"></i> Booking Management
                        </button>
                        <button class="nav-btn ${this.currentView === 'payments' ? 'active' : ''}" data-view="payments">
                            <i class="icon-payments"></i> Payment Management
                        </button>
                        <button class="nav-btn ${this.currentView === 'hotels' ? 'active' : ''}" data-view="hotels">
                            <i class="icon-hotels"></i> Hotel Management
                        </button>
                        <button class="nav-btn ${this.currentView === 'reports' ? 'active' : ''}" data-view="reports">
                            <i class="icon-reports"></i> Reports
                        </button>
                        <button class="nav-btn ${this.currentView === 'monitoring' ? 'active' : ''}" data-view="monitoring">
                            <i class="icon-monitoring"></i> System Monitor
                        </button>
                        <button class="nav-btn ${this.currentView === 'audit' ? 'active' : ''}" data-view="audit">
                            <i class="icon-audit"></i> Audit Logs
                        </button>
                    </nav>
                </div>

                <div class="admin-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    }

    /**
     * Render the current view based on selected tab
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'overview':
                return this.renderOverview();
            case 'users':
                return this.renderUserManagement();
            case 'bookings':
                return this.renderBookingManagement();
            case 'payments':
                return this.renderPaymentManagement();
            case 'hotels':
                return this.renderHotelManagement();
            case 'reports':
                return this.renderReports();
            case 'monitoring':
                return this.renderSystemMonitoring();
            case 'audit':
                return this.renderAuditLogs();
            default:
                return this.renderOverview();
        }
    }

    /**
     * Render system overview
     */
    renderOverview() {
        return `
            <div class="overview-section">
                <h2>System Overview</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="icon-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${this.systemStats.totalUsers || 0}</h3>
                            <p>Total Users</p>
                            <small>${this.systemStats.newUsersToday || 0} new today</small>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="icon-bookings"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${this.systemStats.totalBookings || 0}</h3>
                            <p>Total Bookings</p>
                            <small>${this.systemStats.activeBookings || 0} active</small>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="icon-hotels"></i>
                        </div>
                        <div class="stat-content">
                            <h3>${this.systemStats.totalHotels || 0}</h3>
                            <p>Total Hotels</p>
                            <small>${this.systemStats.activeHotels || 0} active</small>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="icon-revenue"></i>
                        </div>
                        <div class="stat-content">
                            <h3>$${this.formatCurrency(this.systemStats.totalRevenue || 0)}</h3>
                            <p>Total Revenue</p>
                            <small>$${this.formatCurrency(this.systemStats.monthlyRevenue || 0)} this month</small>
                        </div>
                    </div>
                </div>

                <div class="recent-activity">
                    <div class="activity-section">
                        <h3>Recent Bookings</h3>
                        <div class="activity-list">
                            ${this.renderRecentBookings()}
                        </div>
                    </div>

                    <div class="activity-section">
                        <h3>Recent Users</h3>
                        <div class="activity-list">
                            ${this.renderRecentUsers()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render user management interface
     */
    renderUserManagement() {
        return `
            <div class="user-management-section">
                <div class="section-header">
                    <h2>User Management</h2>
                    <div class="section-actions">
                        <input type="text" id="user-search" placeholder="Search users..." class="search-input">
                        <button class="btn btn-primary" id="add-user-btn">Add User</button>
                    </div>
                </div>

                <div class="user-filters">
                    <select id="role-filter" class="filter-select">
                        <option value="">All Roles</option>
                        <option value="1">Guest</option>
                        <option value="2">Hotel Manager</option>
                        <option value="3">Admin</option>
                    </select>
                    <select id="status-filter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                <div class="users-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            ${this.renderUsersTable()}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="users-pagination">
                    ${this.renderPagination('users')}
                </div>
            </div>
        `;
    }

    /**
     * Render booking management interface
     */
    renderBookingManagement() {
        return `
            <div class="booking-management-section">
                <div class="section-header">
                    <h2>Booking Management</h2>
                    <div class="section-actions">
                        <input type="text" id="booking-search" placeholder="Search bookings..." class="search-input">
                        <button class="btn btn-secondary" id="export-bookings-btn">Export</button>
                    </div>
                </div>

                <div class="booking-filters">
                    <select id="booking-status-filter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                    <input type="date" id="date-from-filter" class="filter-input">
                    <input type="date" id="date-to-filter" class="filter-input">
                </div>

                <div class="bookings-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Guest</th>
                                <th>Hotel</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="bookings-table-body">
                            ${this.renderBookingsTable()}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="bookings-pagination">
                    ${this.renderPagination('bookings')}
                </div>
            </div>
        `;
    }

    /**
     * Render payment management interface
     */
    renderPaymentManagement() {
        return `
            <div class="payment-management-section">
                <div class="section-header">
                    <h2>Payment Management</h2>
                    <div class="section-actions">
                        <input type="text" id="payment-search" placeholder="Search payments..." class="search-input">
                        <button class="btn btn-warning" id="process-refunds-btn">Process Refunds</button>
                    </div>
                </div>

                <div class="payment-filters">
                    <select id="payment-status-filter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <input type="date" id="payment-date-from" class="filter-input">
                    <input type="date" id="payment-date-to" class="filter-input">
                </div>

                <div class="payments-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Booking ID</th>
                                <th>User</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="payments-table-body">
                            ${this.renderPaymentsTable()}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="payments-pagination">
                    ${this.renderPagination('payments')}
                </div>
            </div>
        `;
    }

    /**
     * Render hotel management interface
     */
    renderHotelManagement() {
        return `
            <div class="hotel-management-section">
                <div class="section-header">
                    <h2>Hotel Management</h2>
                    <div class="section-actions">
                        <input type="text" id="hotel-search" placeholder="Search hotels..." class="search-input">
                        <button class="btn btn-primary" id="add-hotel-btn">Add Hotel</button>
                    </div>
                </div>

                <div class="hotel-filters">
                    <select id="hotel-city-filter" class="filter-select">
                        <option value="">All Cities</option>
                        ${this.renderCityOptions()}
                    </select>
                    <select id="hotel-status-filter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div class="hotels-grid" id="hotels-grid">
                    ${this.renderHotelsGrid()}
                </div>
            </div>
        `;
    }

    /**
     * Render reports section
     */
    renderReports() {
        return `
            <div class="reports-section">
                <h2>System Reports</h2>
                
                <div class="report-cards">
                    <div class="report-card">
                        <h3>Revenue Report</h3>
                        <p>Monthly and yearly revenue analysis</p>
                        <button class="btn btn-primary" data-report="revenue">Generate</button>
                    </div>
                    
                    <div class="report-card">
                        <h3>Booking Analytics</h3>
                        <p>Booking trends and statistics</p>
                        <button class="btn btn-primary" data-report="bookings">Generate</button>
                    </div>
                    
                    <div class="report-card">
                        <h3>User Activity</h3>
                        <p>User registration and activity metrics</p>
                        <button class="btn btn-primary" data-report="users">Generate</button>
                    </div>
                    
                    <div class="report-card">
                        <h3>Hotel Performance</h3>
                        <p>Hotel occupancy and rating analysis</p>
                        <button class="btn btn-primary" data-report="hotels">Generate</button>
                    </div>
                </div>

                <div class="report-output" id="report-output">
                    <!-- Report content will be displayed here -->
                </div>
            </div>
        `;
    }

    /**
     * Render system monitoring section
     */
    renderSystemMonitoring() {
        return `
            <div class="monitoring-section">
                <div class="section-header">
                    <h2>System Monitoring</h2>
                    <div class="section-actions">
                        <button class="btn btn-secondary" id="refresh-monitoring">
                            <i class="icon-refresh"></i> Refresh
                        </button>
                        <button class="btn btn-primary" id="send-notification">
                            <i class="icon-notification"></i> Send System Notification
                        </button>
                    </div>
                </div>

                <div class="monitoring-grid">
                    <div class="monitoring-card">
                        <h3>System Health</h3>
                        <div class="health-status">
                            <div class="health-item">
                                <span class="health-label">Server Status:</span>
                                <span class="health-value status-healthy">Healthy</span>
                            </div>
                            <div class="health-item">
                                <span class="health-label">Database:</span>
                                <span class="health-value status-healthy">Connected</span>
                            </div>
                            <div class="health-item">
                                <span class="health-label">API Response:</span>
                                <span class="health-value">150ms</span>
                            </div>
                        </div>
                    </div>

                    <div class="monitoring-card">
                        <h3>System Load</h3>
                        <div class="metrics">
                            <div class="metric">
                                <span class="metric-label">CPU Usage:</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: 65%"></div>
                                </div>
                                <span class="metric-value">65%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Memory:</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: 72%"></div>
                                </div>
                                <span class="metric-value">72%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Disk:</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: 45%"></div>
                                </div>
                                <span class="metric-value">45%</span>
                            </div>
                        </div>
                    </div>

                    <div class="monitoring-card">
                        <h3>Active Users</h3>
                        <div class="user-stats">
                            <div class="stat-large">45</div>
                            <div class="stat-label">Currently Online</div>
                        </div>
                    </div>

                    <div class="monitoring-card">
                        <h3>System Alerts</h3>
                        <div class="alerts-list">
                            <div class="alert-item warning">
                                <i class="icon-warning"></i>
                                <div class="alert-content">
                                    <div class="alert-message">High memory usage detected</div>
                                    <div class="alert-time">1 hour ago</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Notification Modal -->
                <div class="modal" id="notification-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Send System Notification</h3>
                            <button class="modal-close" id="close-notification-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="notification-form">
                                <div class="form-group">
                                    <label for="notification-title">Title *</label>
                                    <input type="text" id="notification-title" name="title" required maxlength="100">
                                </div>
                                <div class="form-group">
                                    <label for="notification-message">Message *</label>
                                    <textarea id="notification-message" name="message" rows="4" required maxlength="500"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="notification-type">Type</label>
                                    <select id="notification-type" name="type">
                                        <option value="info">Information</option>
                                        <option value="warning">Warning</option>
                                        <option value="success">Success</option>
                                        <option value="error">Error</option>
                                    </select>
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="btn btn-secondary" id="cancel-notification">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Send Notification</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render audit logs section
     */
    renderAuditLogs() {
        return `
            <div class="audit-section">
                <div class="section-header">
                    <h2>Audit Logs</h2>
                    <div class="section-actions">
                        <input type="text" id="audit-search" placeholder="Search logs..." class="search-input">
                        <select id="audit-action-filter" class="filter-select">
                            <option value="">All Actions</option>
                            <option value="UPDATE_USER_ROLE">Role Updates</option>
                            <option value="PROCESS_REFUND">Refunds</option>
                            <option value="CANCEL_BOOKING">Booking Cancellations</option>
                            <option value="SEND_SYSTEM_NOTIFICATION">Notifications</option>
                        </select>
                        <button class="btn btn-secondary" id="export-audit-logs">Export</button>
                    </div>
                </div>

                <div class="audit-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Admin User</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody id="audit-logs-body">
                            ${this.renderAuditLogsTable()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render audit logs table
     */
    renderAuditLogsTable() {
        // Mock audit logs for demonstration
        const auditLogs = [
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
            }
        ];

        if (auditLogs.length === 0) {
            return '<tr><td colspan="5" class="no-data">No audit logs found</td></tr>';
        }

        return auditLogs.map(log => `
            <tr>
                <td>${this.formatDateTime(log.timestamp)}</td>
                <td>${log.adminUser}</td>
                <td>
                    <span class="action-badge">${log.action.replace(/_/g, ' ')}</span>
                </td>
                <td>
                    <div class="details-content">
                        ${JSON.stringify(log.details, null, 2)}
                    </div>
                </td>
                <td>${log.ipAddress}</td>
            </tr>
        `).join('');
    }

    /**
     * Render recent bookings for overview
     */
    renderRecentBookings() {
        const recentBookings = this.bookings.slice(0, 5);
        
        if (recentBookings.length === 0) {
            return '<p class="no-data">No recent bookings</p>';
        }

        return recentBookings.map(booking => `
            <div class="activity-item">
                <div class="activity-info">
                    <strong>${booking.guestName}</strong>
                    <span>booked ${booking.hotelName}</span>
                </div>
                <div class="activity-meta">
                    <span class="amount">$${this.formatCurrency(booking.totalAmount)}</span>
                    <span class="date">${this.formatDate(booking.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render recent users for overview
     */
    renderRecentUsers() {
        const recentUsers = this.users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        if (recentUsers.length === 0) {
            return '<p class="no-data">No recent users</p>';
        }

        return recentUsers.map(user => `
            <div class="activity-item">
                <div class="activity-info">
                    <strong>${user.name}</strong>
                    <span>${user.email}</span>
                </div>
                <div class="activity-meta">
                    <span class="role">${this.authService.getRoleName(user.role)}</span>
                    <span class="date">${this.formatDate(user.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render users table
     */
    renderUsersTable() {
        if (this.users.length === 0) {
            return '<tr><td colspan="7" class="no-data">No users found</td></tr>';
        }

        return this.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <select class="role-select" data-user-id="${user.id}" onchange="adminDashboard.updateUserRole(${user.id}, this.value)">
                        <option value="1" ${user.role === 1 ? 'selected' : ''}>Guest</option>
                        <option value="2" ${user.role === 2 ? 'selected' : ''}>Hotel Manager</option>
                        <option value="3" ${user.role === 3 ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.editUser(${user.id})">
                        Edit
                    </button>
                    <button class="btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}" 
                            onclick="adminDashboard.toggleUserStatus(${user.id})">
                        ${user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render bookings table
     */
    renderBookingsTable() {
        if (this.bookings.length === 0) {
            return '<tr><td colspan="8" class="no-data">No bookings found</td></tr>';
        }

        return this.bookings.map(booking => `
            <tr>
                <td>${booking.id}</td>
                <td>${booking.guestName}</td>
                <td>${booking.hotelName}</td>
                <td>${this.formatDate(booking.checkInDate)}</td>
                <td>${this.formatDate(booking.checkOutDate)}</td>
                <td>$${this.formatCurrency(booking.totalAmount)}</td>
                <td>
                    <span class="status-badge status-${booking.status.toLowerCase()}">
                        ${booking.status}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.viewBooking(${booking.id})">
                        View
                    </button>
                    ${booking.status === 'Confirmed' ? 
                        `<button class="btn btn-sm btn-warning" onclick="adminDashboard.cancelBooking(${booking.id})">
                            Cancel
                        </button>` : ''
                    }
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render payments table
     */
    renderPaymentsTable() {
        if (this.payments.length === 0) {
            return '<tr><td colspan="8" class="no-data">No payments found</td></tr>';
        }

        return this.payments.map(payment => `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.bookingId}</td>
                <td>${payment.userEmail}</td>
                <td>$${this.formatCurrency(payment.amount)}</td>
                <td>${payment.paymentMethod}</td>
                <td>
                    <span class="status-badge status-${payment.status.toLowerCase()}">
                        ${payment.status}
                    </span>
                </td>
                <td>${this.formatDate(payment.createdAt)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="adminDashboard.viewPayment(${payment.id})">
                        View
                    </button>
                    ${payment.status === 'Completed' ? 
                        `<button class="btn btn-sm btn-warning" onclick="adminDashboard.processRefund(${payment.id})">
                            Refund
                        </button>` : ''
                    }
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render hotels grid
     */
    renderHotelsGrid() {
        // This will be implemented in the hotel management subtask
        return '<p>Hotel management interface will be implemented in subtask 9.2</p>';
    }

    /**
     * Render city options for hotel filter
     */
    renderCityOptions() {
        const cities = [...new Set(this.systemStats.hotelCities || [])];
        return cities.map(city => `<option value="${city}">${city}</option>`).join('');
    }

    /**
     * Render pagination controls
     */
    renderPagination(type) {
        // Simple pagination - can be enhanced
        return `
            <div class="pagination-controls">
                <button class="btn btn-sm btn-secondary" id="prev-${type}">Previous</button>
                <span class="page-info">Page 1 of 1</span>
                <button class="btn btn-sm btn-secondary" id="next-${type}">Next</button>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation events
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });

        // Logout event
        const logoutBtn = this.container.querySelector('#admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Search events
        this.bindSearchEvents();
        
        // Filter events
        this.bindFilterEvents();
        
        // Action events
        this.bindActionEvents();
    }

    /**
     * Bind search events
     */
    bindSearchEvents() {
        const searchInputs = this.container.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.handleSearch(searchTerm, e.target.id);
            });
        });
    }

    /**
     * Bind filter events
     */
    bindFilterEvents() {
        const filterSelects = this.container.querySelectorAll('.filter-select, .filter-input');
        filterSelects.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    /**
     * Bind action events
     */
    bindActionEvents() {
        // Report generation
        const reportBtns = this.container.querySelectorAll('[data-report]');
        reportBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportType = e.target.dataset.report;
                this.generateReport(reportType);
            });
        });

        // System notification modal
        const sendNotificationBtn = this.container.querySelector('#send-notification');
        if (sendNotificationBtn) {
            sendNotificationBtn.addEventListener('click', () => this.showNotificationModal());
        }

        const closeNotificationModal = this.container.querySelector('#close-notification-modal');
        if (closeNotificationModal) {
            closeNotificationModal.addEventListener('click', () => this.hideNotificationModal());
        }

        const cancelNotification = this.container.querySelector('#cancel-notification');
        if (cancelNotification) {
            cancelNotification.addEventListener('click', () => this.hideNotificationModal());
        }

        const notificationForm = this.container.querySelector('#notification-form');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => this.sendSystemNotification(e));
        }

        // Monitoring refresh
        const refreshMonitoringBtn = this.container.querySelector('#refresh-monitoring');
        if (refreshMonitoringBtn) {
            refreshMonitoringBtn.addEventListener('click', () => this.refreshMonitoring());
        }

        // Export audit logs
        const exportAuditBtn = this.container.querySelector('#export-audit-logs');
        if (exportAuditBtn) {
            exportAuditBtn.addEventListener('click', () => this.exportAuditLogs());
        }

        // Modal click outside to close
        const notificationModal = this.container.querySelector('#notification-modal');
        if (notificationModal) {
            notificationModal.addEventListener('click', (e) => {
                if (e.target === notificationModal) {
                    this.hideNotificationModal();
                }
            });
        }
    }

    /**
     * Switch between different views
     */
    async switchView(view) {
        this.currentView = view;
        
        // Load data for the new view if needed
        await this.loadViewData(view);
        
        // Re-render the component
        this.render();
        this.bindEvents();
    }

    /**
     * Load data specific to a view
     */
    async loadViewData(view) {
        try {
            switch (view) {
                case 'users':
                    if (this.users.length === 0) {
                        this.users = await this.adminService.getAllUsers();
                    }
                    break;
                case 'bookings':
                    if (this.bookings.length === 0) {
                        this.bookings = await this.adminService.getAllBookings();
                    }
                    break;
                case 'payments':
                    if (this.payments.length === 0) {
                        this.payments = await this.adminService.getAllPayments();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error loading data for ${view}:`, error);
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            await this.authService.logout();
            // Redirect to login page
            window.location.hash = '#/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Handle search functionality
     */
    handleSearch(searchTerm, inputId) {
        // Implementation depends on the specific search context
        console.log(`Searching for "${searchTerm}" in ${inputId}`);
        // This would filter the displayed data based on the search term
    }

    /**
     * Apply filters to data
     */
    applyFilters() {
        // Implementation would filter the displayed data based on selected filters
        console.log('Applying filters...');
    }

    /**
     * Generate reports
     */
    async generateReport(reportType) {
        try {
            const reportData = await this.adminService.generateReport(reportType);
            this.displayReport(reportType, reportData);
        } catch (error) {
            console.error(`Error generating ${reportType} report:`, error);
        }
    }

    /**
     * Display generated report
     */
    displayReport(reportType, data) {
        const reportOutput = this.container.querySelector('#report-output');
        if (reportOutput) {
            reportOutput.innerHTML = `
                <div class="report-content">
                    <h3>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h3>
                    <div class="report-data">
                        ${JSON.stringify(data, null, 2)}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update user role
     */
    async updateUserRole(userId, newRole) {
        try {
            const roleId = parseInt(newRole);
            const roleName = this.authService.getRoleName(roleId);
            
            if (confirm(`Are you sure you want to change this user's role to ${roleName}?`)) {
                await this.adminService.updateUserRole(userId, roleId);
                await this.loadSystemData();
                this.render();
                this.bindEvents();
                
                this.showNotification(`User role updated to ${roleName} successfully!`, 'success');
            } else {
                // Reset the select to original value
                const select = this.container.querySelector(`select[data-user-id="${userId}"]`);
                if (select) {
                    const user = this.users.find(u => u.id === userId);
                    if (user) {
                        select.value = user.role;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            this.showNotification(`Failed to update user role: ${error.message}`, 'error');
        }
    }

    /**
     * Edit user
     */
    async editUser(userId) {
        // This would open a modal or navigate to user edit form
        console.log(`Editing user ${userId}`);
    }

    /**
     * Toggle user status
     */
    async toggleUserStatus(userId) {
        try {
            await this.adminService.toggleUserStatus(userId);
            await this.loadSystemData();
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    }

    /**
     * View booking details
     */
    async viewBooking(bookingId) {
        console.log(`Viewing booking ${bookingId}`);
    }

    /**
     * Cancel booking
     */
    async cancelBooking(bookingId) {
        try {
            if (confirm('Are you sure you want to cancel this booking?')) {
                await this.adminService.cancelBooking(bookingId);
                await this.loadSystemData();
                this.render();
                this.bindEvents();
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    }

    /**
     * View payment details
     */
    async viewPayment(paymentId) {
        console.log(`Viewing payment ${paymentId}`);
    }

    /**
     * Process refund
     */
    async processRefund(paymentId) {
        try {
            if (confirm('Are you sure you want to process this refund?')) {
                await this.adminService.processRefund(paymentId);
                await this.loadSystemData();
                this.render();
                this.bindEvents();
                
                this.showNotification('Refund processed successfully!', 'success');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            this.showNotification(`Failed to process refund: ${error.message}`, 'error');
        }
    }

    /**
     * Show system notification modal
     */
    showNotificationModal() {
        const modal = this.container.querySelector('#notification-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide system notification modal
     */
    hideNotificationModal() {
        const modal = this.container.querySelector('#notification-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset form
        const form = this.container.querySelector('#notification-form');
        if (form) {
            form.reset();
        }
    }

    /**
     * Send system notification
     */
    async sendSystemNotification(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const notification = {
                title: formData.get('title'),
                message: formData.get('message'),
                type: formData.get('type')
            };

            await this.adminService.sendSystemNotification(notification);
            this.hideNotificationModal();
            this.showNotification('System notification sent successfully!', 'success');
        } catch (error) {
            console.error('Error sending system notification:', error);
            this.showNotification(`Failed to send notification: ${error.message}`, 'error');
        }
    }

    /**
     * Refresh monitoring data
     */
    async refreshMonitoring() {
        try {
            // In a real implementation, this would reload monitoring data
            this.showNotification('Monitoring data refreshed!', 'info');
        } catch (error) {
            console.error('Error refreshing monitoring data:', error);
            this.showNotification('Failed to refresh monitoring data', 'error');
        }
    }

    /**
     * Export audit logs
     */
    async exportAuditLogs() {
        try {
            const auditLogs = await this.adminService.getAuditLogs();
            const csvContent = this.adminService.exportToCSV('audit_logs', auditLogs);
            const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
            this.adminService.downloadCSV(filename, csvContent);
            
            this.showNotification('Audit logs exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            this.showNotification('Failed to export audit logs', 'error');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a proper notification system
        const alertClass = type === 'error' ? 'alert' : type === 'success' ? 'confirm' : 'info';
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else {
            alert(message);
        }
    }

    /**
     * Render error message
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-message">
                    <h2>Access Denied</h2>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.hash = '#/login'">
                        Go to Login
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format date and time for display
     */
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboardComponent;
}

// Make available globally
window.AdminDashboardComponent = AdminDashboardComponent;


