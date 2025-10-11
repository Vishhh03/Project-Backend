/**
 * PaymentHistoryComponent - Displays user's payment transaction history
 * Provides filtering, sorting, and detailed payment information
 */
class PaymentHistoryComponent {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            onPaymentClick: options.onPaymentClick || (() => {}),
            onRefundRequest: options.onRefundRequest || (() => {}),
            pageSize: options.pageSize || 10,
            ...options
        };

        this.paymentService = new PaymentService();
        this.payments = [];
        this.filteredPayments = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.filters = {
            status: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';

        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        this.render();
        this.bindEvents();
        await this.loadPayments();
    }

    /**
     * Render the payment history interface
     */
    render() {
        this.container.innerHTML = `
            <div class="payment-history">
                <div class="history-header">
                    <h2>Payment History</h2>
                    <div class="history-summary" id="historySummary">
                        <span class="summary-item">
                            <span class="summary-label">Total Payments:</span>
                            <span class="summary-value" id="totalPayments">-</span>
                        </span>
                        <span class="summary-item">
                            <span class="summary-label">Total Amount:</span>
                            <span class="summary-value" id="totalAmount">-</span>
                        </span>
                    </div>
                </div>

                <div class="history-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="statusFilter">Status:</label>
                            <select id="statusFilter" name="status">
                                <option value="">All Statuses</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                                <option value="PartiallyRefunded">Partially Refunded</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="dateFromFilter">From Date:</label>
                            <input type="date" id="dateFromFilter" name="dateFrom">
                        </div>

                        <div class="filter-group">
                            <label for="dateToFilter">To Date:</label>
                            <input type="date" id="dateToFilter" name="dateTo">
                        </div>

                        <div class="filter-group">
                            <label for="searchFilter">Search:</label>
                            <input type="text" id="searchFilter" name="search" placeholder="Transaction ID, Hotel name...">
                        </div>

                        <div class="filter-actions">
                            <button type="button" class="btn btn-primary" id="applyFiltersBtn">
                                Apply Filters
                            </button>
                            <button type="button" class="btn btn-outline" id="clearFiltersBtn">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <div class="history-controls">
                    <div class="sort-controls">
                        <label for="sortBy">Sort by:</label>
                        <select id="sortBy">
                            <option value="createdAt">Date</option>
                            <option value="amount">Amount</option>
                            <option value="status">Status</option>
                        </select>
                        <button type="button" class="btn btn-outline btn-sm" id="sortOrderBtn" title="Toggle sort order">
                            <i class="icon-arrow-down" id="sortOrderIcon"></i>
                        </button>
                    </div>

                    <div class="view-controls">
                        <button type="button" class="btn btn-outline btn-sm" id="refreshBtn" title="Refresh">
                            <i class="icon-refresh"></i>
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" id="exportBtn" title="Export to CSV">
                            <i class="icon-download"></i>
                            Export
                        </button>
                    </div>
                </div>

                <div class="history-content">
                    <div class="loading-state" id="loadingState" style="display: none;">
                        <i class="icon-spinner"></i>
                        <span>Loading payment history...</span>
                    </div>

                    <div class="empty-state" id="emptyState" style="display: none;">
                        <i class="icon-credit-card"></i>
                        <h3>No Payments Found</h3>
                        <p>You haven't made any payments yet or no payments match your current filters.</p>
                    </div>

                    <div class="payments-list" id="paymentsList">
                        <!-- Payment items will be rendered here -->
                    </div>

                    <div class="pagination" id="pagination" style="display: none;">
                        <button type="button" class="btn btn-outline btn-sm" id="prevPageBtn" disabled>
                            <i class="icon-arrow-left"></i>
                            Previous
                        </button>
                        <span class="pagination-info" id="paginationInfo">
                            Page 1 of 1
                        </span>
                        <button type="button" class="btn btn-outline btn-sm" id="nextPageBtn" disabled>
                            Next
                            <i class="icon-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const applyFiltersBtn = this.container.querySelector('#applyFiltersBtn');
        const clearFiltersBtn = this.container.querySelector('#clearFiltersBtn');
        const sortBySelect = this.container.querySelector('#sortBy');
        const sortOrderBtn = this.container.querySelector('#sortOrderBtn');
        const refreshBtn = this.container.querySelector('#refreshBtn');
        const exportBtn = this.container.querySelector('#exportBtn');
        const prevPageBtn = this.container.querySelector('#prevPageBtn');
        const nextPageBtn = this.container.querySelector('#nextPageBtn');

        // Filter controls
        applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        clearFiltersBtn.addEventListener('click', () => this.clearFilters());

        // Sort controls
        sortBySelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.sortPayments();
            this.renderPayments();
        });

        sortOrderBtn.addEventListener('click', () => this.toggleSortOrder());

        // Action buttons
        refreshBtn.addEventListener('click', () => this.loadPayments());
        exportBtn.addEventListener('click', () => this.exportToCSV());

        // Pagination
        prevPageBtn.addEventListener('click', () => this.goToPreviousPage());
        nextPageBtn.addEventListener('click', () => this.goToNextPage());

        // Enter key on search
        const searchFilter = this.container.querySelector('#searchFilter');
        searchFilter.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
    }

    /**
     * Load payments from API
     */
    async loadPayments() {
        this.setLoadingState(true);

        try {
            this.payments = await this.paymentService.getPaymentHistory();
            this.applyFiltersAndSort();
            this.updateSummary();
        } catch (error) {
            console.error('Failed to load payment history:', error);
            this.showError('Failed to load payment history. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Apply filters to payments
     */
    applyFilters() {
        // Get filter values
        this.filters.status = this.container.querySelector('#statusFilter').value;
        this.filters.dateFrom = this.container.querySelector('#dateFromFilter').value;
        this.filters.dateTo = this.container.querySelector('#dateToFilter').value;
        this.filters.search = this.container.querySelector('#searchFilter').value.toLowerCase();

        this.applyFiltersAndSort();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters = {
            status: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        };

        // Reset form
        this.container.querySelector('#statusFilter').value = '';
        this.container.querySelector('#dateFromFilter').value = '';
        this.container.querySelector('#dateToFilter').value = '';
        this.container.querySelector('#searchFilter').value = '';

        this.applyFiltersAndSort();
    }

    /**
     * Apply filters and sort to payments
     */
    applyFiltersAndSort() {
        // Apply filters
        this.filteredPayments = this.payments.filter(payment => {
            // Status filter
            if (this.filters.status && payment.status !== this.filters.status) {
                return false;
            }

            // Date range filter
            const paymentDate = new Date(payment.createdAt);
            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                if (paymentDate < fromDate) return false;
            }
            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                if (paymentDate > toDate) return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search;
                const searchableText = [
                    payment.transactionId,
                    payment.cardHolderName,
                    payment.status,
                    payment.paymentMethod
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        // Sort payments
        this.sortPayments();

        // Reset to first page
        this.currentPage = 1;

        // Render results
        this.renderPayments();
        this.updatePagination();
    }

    /**
     * Sort payments based on current sort settings
     */
    sortPayments() {
        this.filteredPayments.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // Handle date sorting
            if (this.sortBy === 'createdAt' || this.sortBy === 'processedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Handle numeric sorting
            if (this.sortBy === 'amount') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }

            let comparison = 0;
            if (aValue > bValue) comparison = 1;
            if (aValue < bValue) comparison = -1;

            return this.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Toggle sort order
     */
    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        
        const sortOrderIcon = this.container.querySelector('#sortOrderIcon');
        sortOrderIcon.className = this.sortOrder === 'desc' ? 'icon-arrow-down' : 'icon-arrow-up';

        this.sortPayments();
        this.renderPayments();
    }

    /**
     * Render payments list
     */
    renderPayments() {
        const paymentsList = this.container.querySelector('#paymentsList');
        const emptyState = this.container.querySelector('#emptyState');

        if (this.filteredPayments.length === 0) {
            paymentsList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        const pagePayments = this.filteredPayments.slice(startIndex, endIndex);

        // Render payment items
        paymentsList.innerHTML = pagePayments.map(paymentData => {
            const payment = new Payment(paymentData);
            return this.renderPaymentItem(payment);
        }).join('');

        // Bind payment item events
        this.bindPaymentItemEvents();
    }

    /**
     * Render individual payment item
     * @param {Payment} payment - Payment instance
     * @returns {string} HTML for payment item
     */
    renderPaymentItem(payment) {
        const statusInfo = payment.getStatusInfo();

        return `
            <div class="payment-item" data-payment-id="${payment.id}">
                <div class="payment-main">
                    <div class="payment-info">
                        <div class="payment-header">
                            <span class="transaction-id">#${payment.transactionId || 'N/A'}</span>
                            <span class="payment-date">${payment.getFormattedCreatedDate()}</span>
                        </div>
                        <div class="payment-details">
                            <span class="payment-amount">${payment.getFormattedAmount()}</span>
                            <span class="payment-method">${payment.getPaymentMethodText()}</span>
                            <span class="payment-card">${payment.getMaskedCardNumber()}</span>
                        </div>
                    </div>
                    <div class="payment-status">
                        <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                        ${payment.isRefunded() ? `<span class="refund-info">Refunded: ${payment.getFormattedRefundAmount()}</span>` : ''}
                    </div>
                </div>
                <div class="payment-actions">
                    <button type="button" class="btn btn-outline btn-sm view-payment-btn" data-payment-id="${payment.id}">
                        View Details
                    </button>
                    ${payment.canBeRefunded() ? `
                        <button type="button" class="btn btn-outline btn-sm refund-payment-btn" data-payment-id="${payment.id}">
                            Request Refund
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Bind events for payment items
     */
    bindPaymentItemEvents() {
        const viewButtons = this.container.querySelectorAll('.view-payment-btn');
        const refundButtons = this.container.querySelectorAll('.refund-payment-btn');

        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const paymentId = parseInt(e.target.dataset.paymentId);
                this.handleViewPayment(paymentId);
            });
        });

        refundButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const paymentId = parseInt(e.target.dataset.paymentId);
                this.handleRefundRequest(paymentId);
            });
        });
    }

    /**
     * Handle view payment details
     * @param {number} paymentId - Payment ID
     */
    handleViewPayment(paymentId) {
        const payment = this.payments.find(p => p.id === paymentId);
        if (payment) {
            this.options.onPaymentClick(payment);
        }
    }

    /**
     * Handle refund request
     * @param {number} paymentId - Payment ID
     */
    handleRefundRequest(paymentId) {
        const payment = this.payments.find(p => p.id === paymentId);
        if (payment) {
            this.options.onRefundRequest(payment);
        }
    }

    /**
     * Update summary information
     */
    updateSummary() {
        const totalPayments = this.payments.length;
        const totalAmount = this.payments
            .filter(p => p.status === 'Completed')
            .reduce((sum, p) => sum + p.amount, 0);

        const totalPaymentsEl = this.container.querySelector('#totalPayments');
        const totalAmountEl = this.container.querySelector('#totalAmount');

        totalPaymentsEl.textContent = totalPayments;
        totalAmountEl.textContent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(totalAmount);
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const pagination = this.container.querySelector('#pagination');
        const prevPageBtn = this.container.querySelector('#prevPageBtn');
        const nextPageBtn = this.container.querySelector('#nextPageBtn');
        const paginationInfo = this.container.querySelector('#paginationInfo');

        const totalPages = Math.ceil(this.filteredPayments.length / this.options.pageSize);

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';

        // Update buttons
        prevPageBtn.disabled = this.currentPage <= 1;
        nextPageBtn.disabled = this.currentPage >= totalPages;

        // Update info
        paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    /**
     * Go to previous page
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPayments();
            this.updatePagination();
        }
    }

    /**
     * Go to next page
     */
    goToNextPage() {
        const totalPages = Math.ceil(this.filteredPayments.length / this.options.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderPayments();
            this.updatePagination();
        }
    }

    /**
     * Export payments to CSV
     */
    exportToCSV() {
        const headers = [
            'Transaction ID',
            'Date',
            'Amount',
            'Currency',
            'Payment Method',
            'Card',
            'Status',
            'Refund Amount'
        ];

        const rows = this.filteredPayments.map(paymentData => {
            const payment = new Payment(paymentData);
            return [
                payment.transactionId || '',
                payment.getFormattedCreatedDate(),
                payment.amount,
                payment.currency,
                payment.getPaymentMethodText(),
                payment.getMaskedCardNumber(),
                payment.getStatusInfo().text,
                payment.refundAmount || 0
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        const loadingState = this.container.querySelector('#loadingState');
        const paymentsList = this.container.querySelector('#paymentsList');

        if (loading) {
            loadingState.style.display = 'flex';
            paymentsList.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            paymentsList.style.display = 'block';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="icon-exclamation-circle"></i>
            <span>${message}</span>
            <button type="button" class="close-btn">&times;</button>
        `;

        this.container.insertBefore(errorDiv, this.container.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);

        // Handle close button
        const closeBtn = errorDiv.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        });
    }

    /**
     * Refresh payment history
     */
    async refresh() {
        await this.loadPayments();
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
window.PaymentHistoryComponent = PaymentHistoryComponent;


