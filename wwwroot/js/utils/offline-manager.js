/**
 * Offline Manager
 * Handles offline detection and graceful degradation of features
 */

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.offlineFeatures = new Set([
            'viewBookings',
            'viewProfile',
            'logout',
            'viewHotels',
            'viewReviews'
        ]);
        this.setupEventListeners();
        this.initializeOfflineIndicator();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Periodic connectivity check
        setInterval(() => {
            this.checkConnectivity();
        }, 30000); // Check every 30 seconds
    }

    async checkConnectivity() {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            if (response.ok && !this.isOnline) {
                this.handleOnline();
            }
        } catch (error) {
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    handleOnline() {
        this.isOnline = true;
        this.updateOfflineIndicator(false);
        this.processOfflineQueue();
        
        // Notify components
        window.dispatchEvent(new CustomEvent('networkStatusChange', {
            detail: { isOnline: true }
        }));

        if (window.errorHandler) {
            window.errorHandler.showNotification('Connection restored', 'success');
        }
    }

    handleOffline() {
        this.isOnline = false;
        this.updateOfflineIndicator(true);
        
        // Notify components
        window.dispatchEvent(new CustomEvent('networkStatusChange', {
            detail: { isOnline: false }
        }));

        if (window.errorHandler) {
            window.errorHandler.showNotification(
                'You are offline. Some features may be limited.', 
                'warning'
            );
        }
    }

    initializeOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator hidden';
        indicator.innerHTML = `
            <div class="offline-content">
                <span class="offline-icon">📡</span>
                <span class="offline-text">You are offline</span>
            </div>
        `;
        document.body.appendChild(indicator);

        // Add CSS if not already present
        if (!document.getElementById('offline-indicator-styles')) {
            const style = document.createElement('style');
            style.id = 'offline-indicator-styles';
            style.textContent = `
                .offline-indicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #ff6b6b;
                    color: white;
                    padding: 8px;
                    text-align: center;
                    z-index: 10000;
                    transform: translateY(-100%);
                    transition: transform 0.3s ease;
                }
                
                .offline-indicator:not(.hidden) {
                    transform: translateY(0);
                }
                
                .offline-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .offline-icon {
                    font-size: 16px;
                }
                
                .offline-text {
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateOfflineIndicator(show) {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            if (show) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }
    }

    isFeatureAvailable(feature) {
        if (this.isOnline) {
            return true;
        }
        return this.offlineFeatures.has(feature);
    }

    getOfflineMessage(feature) {
        const messages = {
            createBooking: 'Booking creation requires an internet connection.',
            makePayment: 'Payment processing requires an internet connection.',
            submitReview: 'Review submission requires an internet connection.',
            searchHotels: 'Hotel search requires an internet connection.',
            updateProfile: 'Profile updates require an internet connection.'
        };

        return messages[feature] || `${feature} is not available offline.`;
    }

    queueOfflineAction(action) {
        if (!this.isOnline) {
            this.offlineQueue.push({
                ...action,
                timestamp: Date.now()
            });
            
            if (window.errorHandler) {
                window.errorHandler.showNotification(
                    'Action queued for when connection is restored',
                    'info'
                );
            }
            return true;
        }
        return false;
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        const actionsToProcess = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const action of actionsToProcess) {
            try {
                await this.executeQueuedAction(action);
            } catch (error) {
                console.error('Failed to process queued action:', error);
                // Re-queue failed actions
                this.offlineQueue.push(action);
            }
        }

        if (this.offlineQueue.length > 0) {
            if (window.errorHandler) {
                window.errorHandler.showNotification(
                    `${this.offlineQueue.length} actions could not be processed`,
                    'warning'
                );
            }
        }
    }

    async executeQueuedAction(action) {
        switch (action.type) {
            case 'api_request':
                return await this.executeQueuedApiRequest(action);
            case 'form_submission':
                return await this.executeQueuedFormSubmission(action);
            default:
                console.warn('Unknown queued action type:', action.type);
        }
    }

    async executeQueuedApiRequest(action) {
        const { method, endpoint, data } = action;
        const apiClient = new ApiClient();
        
        switch (method.toUpperCase()) {
            case 'GET':
                return await apiClient.get(endpoint, data);
            case 'POST':
                return await apiClient.post(endpoint, data);
            case 'PUT':
                return await apiClient.put(endpoint, data);
            case 'DELETE':
                return await apiClient.delete(endpoint);
            case 'PATCH':
                return await apiClient.patch(endpoint, data);
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }

    async executeQueuedFormSubmission(action) {
        const { formData, submitHandler } = action;
        if (typeof submitHandler === 'function') {
            return await submitHandler(formData);
        }
        throw new Error('Invalid form submission handler');
    }

    // Utility methods for components
    withOfflineCheck(feature, callback) {
        if (!this.isFeatureAvailable(feature)) {
            if (window.errorHandler) {
                window.errorHandler.showNotification(
                    this.getOfflineMessage(feature),
                    'warning'
                );
            }
            return false;
        }
        
        if (typeof callback === 'function') {
            return callback();
        }
        return true;
    }

    // Cache management for offline functionality
    getCachedData(key) {
        try {
            const cached = localStorage.getItem(`offline_cache_${key}`);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.expiry > Date.now()) {
                    return data.value;
                }
                localStorage.removeItem(`offline_cache_${key}`);
            }
        } catch (error) {
            console.error('Error reading cached data:', error);
        }
        return null;
    }

    setCachedData(key, value, ttl = 3600000) { // Default 1 hour TTL
        try {
            const data = {
                value,
                expiry: Date.now() + ttl
            };
            localStorage.setItem(`offline_cache_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }

    clearCache() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('offline_cache_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// Create global instance
window.offlineManager = new OfflineManager();


