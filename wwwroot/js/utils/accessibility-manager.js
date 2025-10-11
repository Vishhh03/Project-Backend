/**
 * Accessibility Manager - Handles accessibility features and ARIA management
 */
class AccessibilityManager {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');
        
        this.init();
    }
    
    init() {
        this.setupFocusManagement();
        this.setupKeyboardNavigation();
        this.setupLiveRegions();
        this.setupReducedMotion();
        this.setupHighContrast();
    }
    
    /**
     * Setup focus management and focus-visible polyfill
     */
    setupFocusManagement() {
        // Add focus-visible class for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav-active');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav-active');
        });
        
        // Focus-visible polyfill
        this.addFocusVisiblePolyfill();
    }
    
    /**
     * Add focus-visible polyfill for better focus management
     */
    addFocusVisiblePolyfill() {
        const hadKeyboardEvent = true;
        const keyboardThrottleTimeout = 100;
        
        let hadKeyboardEventRecently = false;
        
        function onKeyDown(e) {
            if (e.metaKey || e.altKey || e.ctrlKey) {
                return;
            }
            
            hadKeyboardEventRecently = true;
            setTimeout(() => {
                hadKeyboardEventRecently = false;
            }, keyboardThrottleTimeout);
        }
        
        function onFocus(e) {
            if (hadKeyboardEventRecently || e.target.matches(':focus-visible')) {
                e.target.classList.add('focus-visible');
            }
        }
        
        function onBlur(e) {
            e.target.classList.remove('focus-visible');
        }
        
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('focus', onFocus, true);
        document.addEventListener('blur', onBlur, true);
        
        // Add js-focus-visible class to body
        document.body.classList.add('js-focus-visible');
    }
    
    /**
     * Setup keyboard navigation handlers
     */
    setupKeyboardNavigation() {
        // Escape key handler for modals and dropdowns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
        
        // Arrow key navigation for menus and lists
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowKeys(e);
            }
        });
        
        // Enter and Space key handlers for custom interactive elements
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.handleActivationKeys(e);
            }
        });
    }
    
    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        // Close modals
        const openModal = document.querySelector('.modal-overlay.show');
        if (openModal) {
            this.closeModal(openModal);
            return;
        }
        
        // Close dropdowns
        const openDropdown = document.querySelector('.dropdown-menu.show');
        if (openDropdown) {
            this.closeDropdown(openDropdown);
            return;
        }
        
        // Close mobile menu
        const mobileMenu = document.querySelector('.navbar-menu.show');
        if (mobileMenu) {
            this.closeMobileMenu();
            return;
        }
    }
    
    /**
     * Handle arrow key navigation
     */
    handleArrowKeys(e) {
        const target = e.target;
        
        // Menu navigation
        if (target.closest('[role="menubar"], [role="menu"]')) {
            e.preventDefault();
            this.navigateMenu(e);
        }
        
        // Tab navigation
        if (target.closest('[role="tablist"]')) {
            e.preventDefault();
            this.navigateTabs(e);
        }
        
        // Grid navigation
        if (target.closest('[role="grid"]')) {
            e.preventDefault();
            this.navigateGrid(e);
        }
    }
    
    /**
     * Handle activation keys (Enter/Space)
     */
    handleActivationKeys(e) {
        const target = e.target;
        
        // Custom buttons and clickable elements
        if (target.matches('[role="button"]:not(button):not(input)')) {
            e.preventDefault();
            target.click();
        }
        
        // Tab activation
        if (target.matches('[role="tab"]')) {
            e.preventDefault();
            this.activateTab(target);
        }
        
        // Menu item activation
        if (target.matches('[role="menuitem"]')) {
            e.preventDefault();
            target.click();
        }
    }
    
    /**
     * Navigate through menu items
     */
    navigateMenu(e) {
        const menu = e.target.closest('[role="menubar"], [role="menu"]');
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const currentIndex = items.indexOf(e.target);
        
        let nextIndex;
        
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + items.length) % items.length;
        }
        
        if (nextIndex !== undefined) {
            items[nextIndex].focus();
        }
    }
    
    /**
     * Navigate through tabs
     */
    navigateTabs(e) {
        const tablist = e.target.closest('[role="tablist"]');
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(e.target);
        
        let nextIndex;
        
        if (e.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }
        
        if (nextIndex !== undefined) {
            tabs[nextIndex].focus();
            this.activateTab(tabs[nextIndex]);
        }
    }
    
    /**
     * Setup live regions for dynamic content announcements
     */
    setupLiveRegions() {
        this.liveRegion = document.getElementById('live-region');
        this.liveRegionAssertive = document.getElementById('live-region-assertive');
        
        if (!this.liveRegion) {
            this.liveRegion = this.createLiveRegion('polite');
        }
        
        if (!this.liveRegionAssertive) {
            this.liveRegionAssertive = this.createLiveRegion('assertive');
        }
    }
    
    /**
     * Create a live region element
     */
    createLiveRegion(politeness) {
        const liveRegion = document.createElement('div');
        liveRegion.className = 'live-region';
        liveRegion.setAttribute('aria-live', politeness);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.id = `live-region-${politeness}`;
        document.body.appendChild(liveRegion);
        return liveRegion;
    }
    
    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        const region = priority === 'assertive' ? this.liveRegionAssertive : this.liveRegion;
        
        if (region) {
            // Clear previous message
            region.textContent = '';
            
            // Add new message after a brief delay to ensure it's announced
            setTimeout(() => {
                region.textContent = message;
            }, 100);
            
            // Clear message after announcement
            setTimeout(() => {
                region.textContent = '';
            }, 5000);
        }
    }
    
    /**
     * Setup reduced motion preferences
     */
    setupReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const handleReducedMotion = (mediaQuery) => {
            if (mediaQuery.matches) {
                document.body.classList.add('reduce-motion');
            } else {
                document.body.classList.remove('reduce-motion');
            }
        };
        
        handleReducedMotion(prefersReducedMotion);
        prefersReducedMotion.addEventListener('change', handleReducedMotion);
    }
    
    /**
     * Setup high contrast mode detection
     */
    setupHighContrast() {
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
        
        const handleHighContrast = (mediaQuery) => {
            if (mediaQuery.matches) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        };
        
        handleHighContrast(prefersHighContrast);
        prefersHighContrast.addEventListener('change', handleHighContrast);
    }
    
    /**
     * Focus management for modals
     */
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(this.focusableElements);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        };
        
        element.addEventListener('keydown', handleTabKey);
        
        // Return function to remove event listener
        return () => {
            element.removeEventListener('keydown', handleTabKey);
        };
    }
    
    /**
     * Show modal with proper focus management
     */
    showModal(modalElement, titleId, descriptionId) {
        const overlay = modalElement.closest('.modal-overlay');
        
        // Store currently focused element
        this.previouslyFocused = document.activeElement;
        
        // Show modal
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        
        // Set ARIA attributes
        if (titleId) {
            modalElement.setAttribute('aria-labelledby', titleId);
        }
        if (descriptionId) {
            modalElement.setAttribute('aria-describedby', descriptionId);
        }
        
        // Focus first focusable element
        const firstFocusable = modalElement.querySelector(this.focusableElements);
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Trap focus
        this.focusTrap = this.trapFocus(modalElement);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Announce modal opening
        this.announce('Dialog opened');
    }
    
    /**
     * Close modal and restore focus
     */
    closeModal(modalElement) {
        const overlay = modalElement.closest('.modal-overlay');
        
        // Hide modal
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        
        // Remove focus trap
        if (this.focusTrap) {
            this.focusTrap();
            this.focusTrap = null;
        }
        
        // Restore focus
        if (this.previouslyFocused) {
            this.previouslyFocused.focus();
            this.previouslyFocused = null;
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Announce modal closing
        this.announce('Dialog closed');
    }
    
    /**
     * Update page title and announce page changes
     */
    updatePageTitle(title) {
        document.title = `${title} - FinalDestination`;
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
        
        // Announce page change
        this.announce(`Navigated to ${title} page`);
    }
    
    /**
     * Set loading state with proper ARIA attributes
     */
    setLoadingState(element, isLoading, loadingText = 'Loading...') {
        if (isLoading) {
            element.setAttribute('aria-busy', 'true');
            element.setAttribute('aria-live', 'polite');
            
            if (loadingText) {
                this.announce(loadingText);
            }
        } else {
            element.removeAttribute('aria-busy');
            element.removeAttribute('aria-live');
        }
    }
    
    /**
     * Validate form accessibility
     */
    validateFormAccessibility(form) {
        const issues = [];
        
        // Check for labels
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const label = form.querySelector(`label[for="${input.id}"]`);
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledby = input.getAttribute('aria-labelledby');
            
            if (!label && !ariaLabel && !ariaLabelledby) {
                issues.push(`Input ${input.name || input.id || 'unknown'} is missing a label`);
            }
        });
        
        // Check for required field indicators
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            const label = form.querySelector(`label[for="${input.id}"]`);
            if (label && !label.classList.contains('required')) {
                issues.push(`Required field ${input.name || input.id} should have visual indicator`);
            }
        });
        
        return issues;
    }
    
    /**
     * Add ARIA attributes to dynamic content
     */
    enhanceElement(element, options = {}) {
        const {
            role,
            label,
            labelledby,
            describedby,
            expanded,
            selected,
            pressed,
            disabled,
            invalid,
            live,
            atomic
        } = options;
        
        if (role) element.setAttribute('role', role);
        if (label) element.setAttribute('aria-label', label);
        if (labelledby) element.setAttribute('aria-labelledby', labelledby);
        if (describedby) element.setAttribute('aria-describedby', describedby);
        if (expanded !== undefined) element.setAttribute('aria-expanded', expanded);
        if (selected !== undefined) element.setAttribute('aria-selected', selected);
        if (pressed !== undefined) element.setAttribute('aria-pressed', pressed);
        if (disabled !== undefined) element.setAttribute('aria-disabled', disabled);
        if (invalid !== undefined) element.setAttribute('aria-invalid', invalid);
        if (live) element.setAttribute('aria-live', live);
        if (atomic !== undefined) element.setAttribute('aria-atomic', atomic);
    }
    
    /**
     * Create accessible notification
     */
    createNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.setAttribute('aria-atomic', 'true');
        
        notification.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close notification" type="button">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
        
        // Add close functionality
        const closeBtn = notification.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Add to container
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
            
            // Trigger show animation
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
        }
        
        return notification;
    }
    
    /**
     * Remove notification
     */
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Initialize accessibility manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityManager = new AccessibilityManager();
    });
} else {
    window.accessibilityManager = new AccessibilityManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}


