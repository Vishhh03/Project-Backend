/**
 * UI Enhancements - Modern interactions and animations
 */

class UIEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.setupSmoothScrolling();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupIntersectionObserver();
    }

    /**
     * Set up scroll-based animations
     */
    setupScrollAnimations() {
        const animateOnScroll = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(animateOnScroll, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements with reveal class
        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Set up parallax effects for hero sections
     */
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        if (parallaxElements.length > 0) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;

                parallaxElements.forEach(element => {
                    element.style.transform = `translateY(${rate}px)`;
                });
            });
        }
    }

    /**
     * Set up smooth scrolling for anchor links
     */
    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    /**
     * Set up enhanced hover effects
     */
    setupHoverEffects() {
        // Add ripple effect to buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .card, .hotel-card')) {
                this.createRippleEffect(e);
            }
        });

        // Add tilt effect to cards
        const cards = document.querySelectorAll('.card, .hotel-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                this.addTiltEffect(e, card);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Create ripple effect on click
     */
    createRippleEffect(e) {
        const element = e.currentTarget;
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Add subtle tilt effect to cards
     */
    addTiltEffect(e, element) {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }

    /**
     * Set up loading animations
     */
    setupLoadingAnimations() {
        // Add CSS for ripple animation
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Set up intersection observer for stagger animations
     */
    setupIntersectionObserver() {
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const staggerItems = entry.target.querySelectorAll('.stagger-item');
                    staggerItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                    staggerObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.grid-3, .hotel-grid').forEach(grid => {
            staggerObserver.observe(grid);
        });
    }

    /**
     * Add floating action button
     */
    addFloatingActionButton() {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = '↑';
        fab.title = 'Back to top';
        fab.style.display = 'none';

        fab.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        document.body.appendChild(fab);

        // Show/hide FAB based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                fab.style.display = 'flex';
            } else {
                fab.style.display = 'none';
            }
        });
    }

    /**
     * Add modern notification system
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">
                    ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}
                </span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.7;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    /**
     * Add skeleton loading for dynamic content
     */
    createSkeletonLoader(container, count = 3) {
        const skeletonHTML = Array(count).fill().map(() => `
            <div class="card" style="padding: 1rem;">
                <div class="skeleton-loader" style="height: 200px; border-radius: 0.5rem; margin-bottom: 1rem;"></div>
                <div class="skeleton-loader" style="height: 1.5rem; width: 70%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton-loader" style="height: 1rem; width: 50%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton-loader" style="height: 1rem; width: 80%;"></div>
            </div>
        `).join('');

        container.innerHTML = `<div class="grid-3">${skeletonHTML}</div>`;
    }

    /**
     * Add modern search with suggestions
     */
    enhanceSearchInput(inputElement, suggestions = []) {
        const wrapper = document.createElement('div');
        wrapper.className = 'search-wrapper';
        wrapper.style.position = 'relative';
        
        inputElement.parentNode.insertBefore(wrapper, inputElement);
        wrapper.appendChild(inputElement);

        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'search-suggestions';
        suggestionsList.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        wrapper.appendChild(suggestionsList);

        inputElement.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            if (value.length > 0) {
                const filtered = suggestions.filter(item => 
                    item.toLowerCase().includes(value)
                );
                this.showSuggestions(suggestionsList, filtered, inputElement);
            } else {
                suggestionsList.style.display = 'none';
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });
    }

    /**
     * Show search suggestions
     */
    showSuggestions(container, suggestions, inputElement) {
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" style="padding: 0.75rem; cursor: pointer; border-bottom: 1px solid var(--gray-100);" 
                 onmouseover="this.style.background='var(--gray-50)'" 
                 onmouseout="this.style.background='white'"
                 onclick="document.querySelector('input').value='${suggestion}'; this.parentElement.style.display='none';">
                ${suggestion}
            </div>
        `).join('');

        container.style.display = 'block';
    }
}

// Initialize UI enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiEnhancements = new UIEnhancements();
    
    // Add floating action button
    window.uiEnhancements.addFloatingActionButton();
    
    // Make notification function globally available
    window.showNotification = (message, type, duration) => {
        window.uiEnhancements.showNotification(message, type, duration);
    };
});

// Export for use in other modules
window.UIEnhancements = UIEnhancements;


