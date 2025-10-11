/**
 * LoyaltyDashboardComponent
 * Displays user's loyalty account information, points balance, 
 * transaction history, and available rewards
 */
class LoyaltyDashboardComponent {
    constructor(container, loyaltyService, notificationService) {
        this.container = container;
        this.loyaltyService = loyaltyService;
        this.notificationService = notificationService;
        this.loyaltyAccount = null;
        this.transactions = [];
        this.rewards = [];
        this.currentPage = 1;
        this.transactionsPerPage = 10;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        try {
            this.render();
            await this.loadLoyaltyData();
        } catch (error) {
            console.error('Error initializing loyalty dashboard:', error);
            this.showError('Failed to load loyalty dashboard');
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="loyalty-dashboard">
                <div class="loyalty-header">
                    <h1>Loyalty Program</h1>
                    <p class="loyalty-subtitle">Track your points, rewards, and membership benefits</p>
                </div>

                <div class="loyalty-loading" id="loyaltyLoading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Loading your loyalty information...</p>
                </div>

                <div class="loyalty-content" id="loyaltyContent">
                    <!-- Account Overview -->
                    <div class="loyalty-overview">
                        <div class="points-card">
                            <div class="points-header">
                                <h2>Points Balance</h2>
                                <div class="membership-badge" id="membershipBadge">
                                    <span class="badge-text">Bronze</span>
                                </div>
                            </div>
                            <div class="points-balance" id="pointsBalance">0</div>
                            <div class="points-details">
                                <div class="points-stat">
                                    <span class="stat-label">Total Earned:</span>
                                    <span class="stat-value" id="totalEarned">0</span>
                                </div>
                                <div class="points-stat">
                                    <span class="stat-label">Total Redeemed:</span>
                                    <span class="stat-value" id="totalRedeemed">0</span>
                                </div>
                            </div>
                        </div>

                        <div class="membership-progress">
                            <h3>Membership Progress</h3>
                            <div class="progress-info" id="progressInfo">
                                <p>Loading membership information...</p>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                            </div>
                        </div>

                        <div class="membership-benefits">
                            <h3>Your Benefits</h3>
                            <ul class="benefits-list" id="benefitsList">
                                <li>Loading benefits...</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Navigation Tabs -->
                    <div class="loyalty-tabs">
                        <button class="tab-button active" data-tab="transactions">Transaction History</button>
                        <button class="tab-button" data-tab="rewards">Available Rewards</button>
                        <button class="tab-button" data-tab="redemptions">Redemption History</button>
                    </div>

                    <!-- Tab Content -->
                    <div class="tab-content">
                        <!-- Transactions Tab -->
                        <div class="tab-pane active" id="transactionsTab">
                            <div class="transactions-header">
                                <h3>Recent Transactions</h3>
                                <div class="transaction-filters">
                                    <select id="transactionTypeFilter">
                                        <option value="">All Transactions</option>
                                        <option value="earned">Points Earned</option>
                                        <option value="redeemed">Points Redeemed</option>
                                    </select>
                                    <button class="btn btn-secondary" id="refreshTransactions">
                                        <i class="icon-refresh"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            <div class="transactions-list" id="transactionsList">
                                <div class="loading-placeholder">Loading transactions...</div>
                            </div>
                            <div class="pagination" id="transactionsPagination"></div>
                        </div>

                        <!-- Rewards Tab -->
                        <div class="tab-pane" id="rewardsTab">
                            <div class="rewards-header">
                                <h3>Available Rewards</h3>
                                <div class="rewards-filters">
                                    <select id="rewardCategoryFilter">
                                        <option value="">All Categories</option>
                                        <option value="discount">Discounts</option>
                                        <option value="upgrade">Upgrades</option>
                                        <option value="service">Services</option>
                                    </select>
                                </div>
                            </div>
                            <div class="rewards-grid" id="rewardsGrid">
                                <div class="loading-placeholder">Loading rewards...</div>
                            </div>
                        </div>

                        <!-- Redemptions Tab -->
                        <div class="tab-pane" id="redemptionsTab">
                            <div class="redemptions-header">
                                <h3>Redemption History</h3>
                            </div>
                            <div class="redemptions-list" id="redemptionsList">
                                <div class="loading-placeholder">Loading redemption history...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reward Redemption Modal -->
                <div class="modal" id="rewardModal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Redeem Reward</h3>
                            <button class="modal-close" id="closeRewardModal">&times;</button>
                        </div>
                        <div class="modal-body" id="rewardModalBody">
                            <!-- Reward details will be populated here -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="cancelRedemption">Cancel</button>
                            <button class="btn btn-primary" id="confirmRedemption">Redeem</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        // Tab navigation
        const tabButtons = this.container.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Transaction filters
        const typeFilter = this.container.querySelector('#transactionTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.loadTransactions();
            });
        }

        // Refresh transactions
        const refreshBtn = this.container.querySelector('#refreshTransactions');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadTransactions(true);
            });
        }

        // Reward category filter
        const categoryFilter = this.container.querySelector('#rewardCategoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.loadRewards();
            });
        }

        // Modal events
        const closeModal = this.container.querySelector('#closeRewardModal');
        const cancelBtn = this.container.querySelector('#cancelRedemption');
        const confirmBtn = this.container.querySelector('#confirmRedemption');

        if (closeModal) closeModal.addEventListener('click', () => this.closeRewardModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeRewardModal());
        if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmRewardRedemption());

        // Close modal on outside click
        const modal = this.container.querySelector('#rewardModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeRewardModal();
            });
        }
    }

    async loadLoyaltyData() {
        try {
            this.showLoading(true);
            
            // Load loyalty account
            this.loyaltyAccount = await this.loyaltyService.getCurrentUserLoyaltyAccount();
            this.updateAccountOverview();
            
            // Load initial data for active tab
            await this.loadTransactions();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading loyalty data:', error);
            this.showError('Failed to load loyalty information');
            this.showLoading(false);
        }
    }

    updateAccountOverview() {
        if (!this.loyaltyAccount) return;

        // Update points balance
        const pointsBalance = this.container.querySelector('#pointsBalance');
        if (pointsBalance) {
            pointsBalance.textContent = this.loyaltyService.formatPoints(this.loyaltyAccount.pointsBalance);
        }

        // Update membership badge
        const membershipBadge = this.container.querySelector('#membershipBadge .badge-text');
        if (membershipBadge) {
            membershipBadge.textContent = this.loyaltyAccount.membershipLevel;
            membershipBadge.className = `badge-text ${this.loyaltyAccount.membershipLevel.toLowerCase()}`;
        }

        // Update total earned and redeemed
        const totalEarned = this.container.querySelector('#totalEarned');
        const totalRedeemed = this.container.querySelector('#totalRedeemed');
        
        if (totalEarned) {
            totalEarned.textContent = this.loyaltyService.formatPoints(this.loyaltyAccount.totalPointsEarned);
        }
        
        if (totalRedeemed) {
            totalRedeemed.textContent = this.loyaltyService.formatPoints(this.loyaltyAccount.totalPointsRedeemed);
        }

        // Update membership progress
        this.updateMembershipProgress();

        // Update benefits
        this.updateMembershipBenefits();
    }

    updateMembershipProgress() {
        const progressInfo = this.container.querySelector('#progressInfo');
        const progressFill = this.container.querySelector('#progressFill');
        
        if (!progressInfo || !progressFill || !this.loyaltyAccount) return;

        const nextLevelInfo = this.loyaltyService.getNextLevelInfo(
            this.loyaltyAccount.totalPointsEarned,
            this.loyaltyAccount.membershipLevel
        );

        if (nextLevelInfo.isMaxLevel) {
            progressInfo.innerHTML = `
                <p><strong>Congratulations!</strong> You've reached the highest membership level.</p>
            `;
            progressFill.style.width = '100%';
        } else {
            progressInfo.innerHTML = `
                <p>
                    <strong>${nextLevelInfo.pointsNeeded.toLocaleString()} points</strong> 
                    needed to reach <strong>${nextLevelInfo.nextLevel}</strong> level
                </p>
            `;
            progressFill.style.width = `${Math.min(nextLevelInfo.progress, 100)}%`;
        }
    }

    updateMembershipBenefits() {
        const benefitsList = this.container.querySelector('#benefitsList');
        if (!benefitsList || !this.loyaltyAccount) return;

        const benefits = this.loyaltyService.getMembershipBenefits(this.loyaltyAccount.membershipLevel);
        benefitsList.innerHTML = benefits.map(benefit => `<li>${benefit}</li>`).join('');
    }

    async loadTransactions(forceRefresh = false) {
        try {
            const typeFilter = this.container.querySelector('#transactionTypeFilter');
            const transactionType = typeFilter ? typeFilter.value : '';

            const options = {
                page: this.currentPage,
                limit: this.transactionsPerPage,
                type: transactionType || undefined
            };

            const result = await this.loyaltyService.getCurrentUserTransactionHistory(options);
            this.transactions = result.transactions;
            
            this.renderTransactions();
            this.renderTransactionsPagination(result);
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Failed to load transaction history');
        }
    }

    renderTransactions() {
        const transactionsList = this.container.querySelector('#transactionsList');
        if (!transactionsList) return;

        if (this.transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <p>No transactions found.</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item ${transaction.transactionType}">
                <div class="transaction-icon">
                    ${transaction.getTransactionIcon()}
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-date">${this.formatDate(transaction.createdAt)}</div>
                    ${transaction.referenceType ? `<div class="transaction-reference">Ref: ${transaction.referenceType} #${transaction.referenceId}</div>` : ''}
                </div>
                <div class="transaction-points ${transaction.transactionType}">
                    ${transaction.getFormattedPoints()}
                </div>
            </div>
        `).join('');
    }

    renderTransactionsPagination(result) {
        const pagination = this.container.querySelector('#transactionsPagination');
        if (!pagination || result.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (result.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${result.currentPage - 1}">Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= result.totalPages; i++) {
            if (i === result.currentPage) {
                paginationHTML += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            }
        }

        // Next button
        if (result.currentPage < result.totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${result.currentPage + 1}">Next</button>`;
        }

        paginationHTML += '</div>';
        pagination.innerHTML = paginationHTML;

        // Bind pagination events
        pagination.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page);
                this.loadTransactions();
            });
        });
    }

    async loadRewards() {
        try {
            const categoryFilter = this.container.querySelector('#rewardCategoryFilter');
            const category = categoryFilter ? categoryFilter.value : '';

            const options = {
                category: category || undefined
            };

            this.rewards = await this.loyaltyService.getAvailableRewards(options);
            this.renderRewards();
        } catch (error) {
            console.error('Error loading rewards:', error);
            this.showError('Failed to load rewards');
        }
    }

    renderRewards() {
        const rewardsGrid = this.container.querySelector('#rewardsGrid');
        if (!rewardsGrid) return;

        if (this.rewards.length === 0) {
            rewardsGrid.innerHTML = `
                <div class="empty-state">
                    <p>No rewards available at this time.</p>
                </div>
            `;
            return;
        }

        rewardsGrid.innerHTML = this.rewards.map(reward => {
            const canAfford = this.loyaltyAccount && this.loyaltyAccount.pointsBalance >= reward.pointsCost;
            const isAvailable = reward.isAvailable();
            
            return `
                <div class="reward-card ${!canAfford ? 'insufficient-points' : ''} ${!isAvailable ? 'unavailable' : ''}">
                    <div class="reward-header">
                        <h4 class="reward-name">${reward.name}</h4>
                        <div class="reward-category">${reward.category}</div>
                    </div>
                    <div class="reward-description">${reward.description}</div>
                    <div class="reward-cost">
                        <span class="points-cost">${this.loyaltyService.formatPoints(reward.pointsCost)} points</span>
                    </div>
                    <div class="reward-actions">
                        ${isAvailable && canAfford ? 
                            `<button class="btn btn-primary redeem-btn" data-reward-id="${reward.id}">Redeem</button>` :
                            `<button class="btn btn-secondary" disabled>
                                ${!isAvailable ? 'Unavailable' : 'Insufficient Points'}
                            </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        // Bind redeem buttons
        rewardsGrid.querySelectorAll('.redeem-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rewardId = parseInt(e.target.dataset.rewardId);
                this.showRewardModal(rewardId);
            });
        });
    }

    async loadRedemptionHistory() {
        try {
            const result = await this.loyaltyService.getRedemptionHistory();
            this.renderRedemptionHistory(result.redemptions);
        } catch (error) {
            console.error('Error loading redemption history:', error);
            this.showError('Failed to load redemption history');
        }
    }

    renderRedemptionHistory(redemptions) {
        const redemptionsList = this.container.querySelector('#redemptionsList');
        if (!redemptionsList) return;

        if (redemptions.length === 0) {
            redemptionsList.innerHTML = `
                <div class="empty-state">
                    <p>No redemptions found.</p>
                </div>
            `;
            return;
        }

        redemptionsList.innerHTML = redemptions.map(redemption => `
            <div class="redemption-item">
                <div class="redemption-details">
                    <div class="redemption-name">${redemption.rewardName}</div>
                    <div class="redemption-date">${this.formatDate(redemption.redeemedAt)}</div>
                    <div class="redemption-code">Code: ${redemption.redemptionCode}</div>
                </div>
                <div class="redemption-points">
                    -${this.loyaltyService.formatPoints(redemption.pointsUsed)}
                </div>
                <div class="redemption-status ${redemption.status}">
                    ${redemption.status}
                </div>
            </div>
        `).join('');
    }

    switchTab(tabName) {
        // Update tab buttons
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        this.container.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panes
        this.container.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        this.container.querySelector(`#${tabName}Tab`).classList.add('active');

        // Load data for the active tab
        switch (tabName) {
            case 'transactions':
                this.loadTransactions();
                break;
            case 'rewards':
                this.loadRewards();
                break;
            case 'redemptions':
                this.loadRedemptionHistory();
                break;
        }
    }

    showRewardModal(rewardId) {
        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward) return;

        const modalBody = this.container.querySelector('#rewardModalBody');
        modalBody.innerHTML = `
            <div class="reward-modal-content">
                <h4>${reward.name}</h4>
                <p class="reward-description">${reward.description}</p>
                <div class="reward-cost-info">
                    <p><strong>Cost:</strong> ${this.loyaltyService.formatPoints(reward.pointsCost)} points</p>
                    <p><strong>Your Balance:</strong> ${this.loyaltyService.formatPoints(this.loyaltyAccount.pointsBalance)} points</p>
                    <p><strong>Remaining After:</strong> ${this.loyaltyService.formatPoints(this.loyaltyAccount.pointsBalance - reward.pointsCost)} points</p>
                </div>
                ${reward.termsAndConditions ? `
                    <div class="terms-conditions">
                        <h5>Terms & Conditions:</h5>
                        <p>${reward.termsAndConditions}</p>
                    </div>
                ` : ''}
            </div>
        `;

        const confirmBtn = this.container.querySelector('#confirmRedemption');
        confirmBtn.dataset.rewardId = rewardId;

        const modal = this.container.querySelector('#rewardModal');
        modal.style.display = 'block';
    }

    closeRewardModal() {
        const modal = this.container.querySelector('#rewardModal');
        modal.style.display = 'none';
    }

    async confirmRewardRedemption() {
        const confirmBtn = this.container.querySelector('#confirmRedemption');
        const rewardId = parseInt(confirmBtn.dataset.rewardId);
        
        try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Redeeming...';

            const result = await this.loyaltyService.redeemReward(rewardId);
            
            this.closeRewardModal();
            this.showSuccess(`Reward redeemed successfully! Code: ${result.redemptionCode}`);
            
            // Refresh data
            await this.loadLoyaltyData();
            
        } catch (error) {
            console.error('Error redeeming reward:', error);
            this.showError('Failed to redeem reward: ' + error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Redeem';
        }
    }

    showLoading(show) {
        const loading = this.container.querySelector('#loyaltyLoading');
        const content = this.container.querySelector('#loyaltyContent');
        
        if (loading && content) {
            loading.style.display = show ? 'block' : 'none';
            content.style.display = show ? 'none' : 'block';
        }
    }

    showError(message) {
        if (this.notificationService) {
            this.notificationService.showError(message);
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (this.notificationService) {
            this.notificationService.showSuccess(message);
        } else {
            alert('Success: ' + message);
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    destroy() {
        // Clean up event listeners and resources
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoyaltyDashboardComponent;
} else {
    window.LoyaltyDashboardComponent = LoyaltyDashboardComponent;
}


