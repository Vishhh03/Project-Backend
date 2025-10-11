/**
 * NotificationService
 * Provides toast notifications for success/error messages with queue management
 * and automatic dismissal
 */

class NotificationService {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5 seconds
        this.persistentTypes = ['error', 'warning']; // These require manual dismissal
        this.init();
    }

    init() {
        this.createContainer();
        this.setupEventListeners();
        this.loadPersistedNotifications();
    }

    createContainer() {
        // Remove existing container if present
        const existing = document.getElementById('notification-container');
        if (existing) {
            existing.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);

        // Add CSS if not already present
        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }

            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 12px;
                padding: 16px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: auto;
                border-left: 4px solid #ddd;
                max-width: 100%;
                word-wrap: break-word;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification.success {
                border-left-color: #10b981;
                background: #f0fdf4;
            }

            .notification.error {
                border-left-color: #ef4444;
                background: #fef2f2;
            }

            .notification.warning {
                border-left-color: #f59e0b;
                background: #fffbeb;
            }

            .notification.info {
                border-left-color: #3b82f6;
                background: #eff6ff;
            }

            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 2px;
            }

            .notification-content {
                flex: 1;
                min-width: 0;
            }

            .notification-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: #1f2937;
                font-size: 14px;
            }

            .notification-message {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.4;
            }

            .notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .notification-button {
                background: none;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .notification-button:hover {
                background: #f3f4f6;
            }

            .notification-button.primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .notification-button.primary:hover {
                background: #2563eb;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #9ca3af;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                flex-shrink: 0;
            }

            .notification-close:hover {
                background: #f3f4f6;
                color: #6b7280;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: rgba(0, 0, 0, 0.1);
                transition: width linear;
            }

            .notification.success .notification-progress {
                background: #10b981;
            }

            .notification.error .notification-progress {
                background: #ef4444;
            }

            .notification.warning .notification-progress {
                background: #f59e0b;
            }

            .notification.info .notification-progress {
                background: #3b82f6;
            }

            @media (max-width: 480px) {
                .notification-container {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }

                .notification {
                    transform: translateY(-100%);
                }

                .notification.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Listen for global notification events
        window.addEventListener('showNotification', (event) => {
            const { message, type, title, actions, persistent } = event.detail;
            this.show(message, type, { title, actions, persistent });
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTimers();
            } else {
                this.resumeTimers();
            }
        });
    }

    show(message, type = 'info', options = {}) {
        const notification = this.createNotification(message, type, options);
        this.addNotification(notification);
        return notification.id;
    }

    createNotification(message, type, options) {
        const id = this.generateId();
        const {
            title,
            actions = [],
            persistent = this.persistentTypes.includes(type),
            duration = this.defaultDuration
        } = options;

        const notification = {
            id,
            message,
            type,
            title,
            actions,
            persistent,
            duration,
            timestamp: Date.now(),
            element: null,
            timer: null,
            paused: false
        };

        return notification;
    }

    addNotification(notification) {
        // Remove oldest notifications if we exceed the limit
        while (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotificationElement(oldest);
        }

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-dismiss if not persistent
        if (!notification.persistent) {
            this.scheduleRemoval(notification);
        }

        // Persist important notifications
        if (this.persistentTypes.includes(notification.type)) {
            this.persistNotification(notification);
        }
    }

    renderNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.dataset.id = notification.id;

        const icon = this.getIcon(notification.type);
        
        element.innerHTML = `
            ${icon ? `<div class="notification-icon">${icon}</div>` : ''}
            <div class="notification-content">
                ${notification.title ? `<div class="notification-title">${this.escapeHtml(notification.title)}</div>` : ''}
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                ${notification.actions.length > 0 ? this.renderActions(notification.actions) : ''}
            </div>
            <button class="notification-close" aria-label="Close notification">&times;</button>
            ${!notification.persistent ? '<div class="notification-progress"></div>' : ''}
        `;

        notification.element = element;

        // Add event listeners
        const closeButton = element.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.dismiss(notification.id);
        });

        // Add action button listeners
        notification.actions.forEach((action, index) => {
            const button = element.querySelector(`[data-action-index="${index}"]`);
            if (button && action.handler) {
                button.addEventListener('click', () => {
                    action.handler();
                    if (action.dismissOnClick !== false) {
                        this.dismiss(notification.id);
                    }
                });
            }
        });

        this.container.appendChild(element);

        // Trigger animation
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
    }

    renderActions(actions) {
        const actionsHtml = actions.map((action, index) => {
            const className = action.primary ? 'notification-button primary' : 'notification-button';
            return `<button class="${className}" data-action-index="${index}">${this.escapeHtml(action.text)}</button>`;
        }).join('');

        return `<div class="notification-actions">${actionsHtml}</div>`;
    }

    scheduleRemoval(notification) {
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        notification.timer = setTimeout(() => {
            this.dismiss(notification.id);
        }, notification.duration);

        // Update progress bar
        if (notification.element) {
            const progressBar = notification.element.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transitionDuration = `${notification.duration}ms`;
                
                requestAnimationFrame(() => {
                    progressBar.style.width = '0%';
                });
            }
        }
    }

    dismiss(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        this.removeNotification(notification);
    }

    removeNotification(notification) {
        // Clear timer
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // Remove from array
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }

        // Remove element
        this.removeNotificationElement(notification);

        // Remove from persistence
        this.removePersistedNotification(notification.id);
    }

    removeNotificationElement(notification) {
        if (notification.element) {
            notification.element.classList.remove('show');
            setTimeout(() => {
                if (notification.element && notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }, 300);
        }
    }

    pauseTimers() {
        this.notifications.forEach(notification => {
            if (notification.timer && !notification.paused) {
                clearTimeout(notification.timer);
                notification.paused = true;
                notification.remainingTime = notification.duration - (Date.now() - notification.timestamp);
            }
        });
    }

    resumeTimers() {
        this.notifications.forEach(notification => {
            if (notification.paused && !notification.persistent) {
                notification.paused = false;
                notification.timestamp = Date.now();
                notification.timer = setTimeout(() => {
                    this.dismiss(notification.id);
                }, notification.remainingTime);
            }
        });
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Clear all notifications
    clear() {
        [...this.notifications].forEach(notification => {
            this.removeNotification(notification);
        });
    }

    // Persistence methods
    persistNotification(notification) {
        try {
            const persisted = this.getPersistedNotifications();
            persisted.push({
                id: notification.id,
                message: notification.message,
                type: notification.type,
                title: notification.title,
                timestamp: notification.timestamp
            });

            // Keep only last 10 persisted notifications
            if (persisted.length > 10) {
                persisted.splice(0, persisted.length - 10);
            }

            localStorage.setItem('persisted_notifications', JSON.stringify(persisted));
        } catch (error) {
            console.error('Failed to persist notification:', error);
        }
    }

    getPersistedNotifications() {
        try {
            const stored = localStorage.getItem('persisted_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load persisted notifications:', error);
            return [];
        }
    }

    removePersistedNotification(id) {
        try {
            const persisted = this.getPersistedNotifications();
            const filtered = persisted.filter(n => n.id !== id);
            localStorage.setItem('persisted_notifications', JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to remove persisted notification:', error);
        }
    }

    loadPersistedNotifications() {
        const persisted = this.getPersistedNotifications();
        const recent = persisted.filter(n => Date.now() - n.timestamp < 86400000); // Last 24 hours

        recent.forEach(n => {
            this.show(n.message, n.type, {
                title: n.title,
                persistent: true
            });
        });
    }

    // Utility methods
    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.notificationService = new NotificationService();


