/**
 * Performance Manager - Handles lazy loading, caching, and performance optimizations
 */
class PerformanceManager {
    constructor() {
        this.imageCache = new Map();
        this.componentCache = new Map();
        this.intersectionObserver = null;
        this.loadingStates = new Map();
        
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupImageLazyLoading();
        this.setupPreloading();
        this.setupCaching();
        this.setupPerformanceMonitoring();
    }
    
    /**
     * Setup Intersection Observer for lazy loading
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.handleIntersection(entry.target);
                            this.intersectionObserver.unobserve(entry.target);
                        }
                    });
                },
                {
                    rootMargin: '50px 0px',
                    threshold: 0.1
                }
            );
        }
    }
    
    /**
     * Handle element intersection for lazy loading
     */
    handleIntersection(element) {
        if (element.hasAttribute('data-src')) {
            this.loadImage(element);
        } else if (element.hasAttribute('data-component')) {
            this.loadComponent(element);
        }
    }
    
    /**
     * Setup image lazy loading
     */
    setupImageLazyLoading() {
        // Add lazy loading to existing images
        this.observeImages();
        
        // Watch for new images added to DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const images = node.querySelectorAll ? 
                            node.querySelectorAll('img[data-src]') : 
                            (node.matches && node.matches('img[data-src]') ? [node] : []);
                        
                        images.forEach(img => this.observeImage(img));
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Observe all images with data-src attribute
     */
    observeImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.observeImage(img));
    }
    
    /**
     * Observe single image for lazy loading
     */
    observeImage(img) {
        if (this.intersectionObserver) {
            // Add loading placeholder
            this.addImagePlaceholder(img);
            this.intersectionObserver.observe(img);
        } else {
            // Fallback for browsers without Intersection Observer
            this.loadImage(img);
        }
    }
    
    /**
     * Add loading placeholder to image
     */
    addImagePlaceholder(img) {
        if (!img.src && !img.classList.contains('lazy-placeholder')) {
            img.classList.add('lazy-placeholder');
            
            // Create skeleton placeholder
            const placeholder = this.createSkeletonPlaceholder(img);
            img.parentNode.insertBefore(placeholder, img);
            img.style.display = 'none';
        }
    }
    
    /**
     * Create skeleton placeholder
     */
    createSkeletonPlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'skeleton-placeholder';
        placeholder.style.width = img.getAttribute('width') || '100%';
        placeholder.style.height = img.getAttribute('height') || '200px';
        placeholder.setAttribute('aria-hidden', 'true');
        
        return placeholder;
    }
    
    /**
     * Load image with caching and error handling
     */
    async loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;
        
        try {
            // Check cache first
            if (this.imageCache.has(src)) {
                this.applyImageFromCache(img, src);
                return;
            }
            
            // Show loading state
            this.setImageLoadingState(img, true);
            
            // Load image
            const imageElement = new Image();
            
            await new Promise((resolve, reject) => {
                imageElement.onload = resolve;
                imageElement.onerror = reject;
                imageElement.src = src;
            });
            
            // Cache the loaded image
            this.imageCache.set(src, imageElement);
            
            // Apply image
            this.applyLoadedImage(img, src);
            
        } catch (error) {
            console.warn('Failed to load image:', src, error);
            this.handleImageError(img);
        } finally {
            this.setImageLoadingState(img, false);
        }
    }
    
    /**
     * Apply image from cache
     */
    applyImageFromCache(img, src) {
        img.src = src;
        img.classList.add('lazy-loaded');
        this.removePlaceholder(img);
        this.triggerImageAnimation(img);
    }
    
    /**
     * Apply loaded image
     */
    applyLoadedImage(img, src) {
        img.src = src;
        img.classList.add('lazy-loaded');
        img.removeAttribute('data-src');
        this.removePlaceholder(img);
        this.triggerImageAnimation(img);
    }
    
    /**
     * Remove placeholder and show image
     */
    removePlaceholder(img) {
        const placeholder = img.parentNode.querySelector('.skeleton-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        img.style.display = '';
    }
    
    /**
     * Trigger image fade-in animation
     */
    triggerImageAnimation(img) {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
        
        requestAnimationFrame(() => {
            img.style.opacity = '1';
        });
    }
    
    /**
     * Handle image loading error
     */
    handleImageError(img) {
        img.classList.add('lazy-error');
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
        this.removePlaceholder(img);
    }
    
    /**
     * Set image loading state
     */
    setImageLoadingState(img, isLoading) {
        if (isLoading) {
            img.classList.add('lazy-loading');
            img.setAttribute('aria-busy', 'true');
        } else {
            img.classList.remove('lazy-loading');
            img.removeAttribute('aria-busy');
        }
    }
    
    /**
     * Setup component lazy loading
     */
    loadComponent(element) {
        const componentName = element.getAttribute('data-component');
        if (!componentName) return;
        
        // Check if component is already cached
        if (this.componentCache.has(componentName)) {
            this.renderCachedComponent(element, componentName);
            return;
        }
        
        // Load component dynamically
        this.loadComponentDynamically(element, componentName);
    }
    
    /**
     * Load component dynamically
     */
    async loadComponentDynamically(element, componentName) {
        try {
            this.setLoadingState(element, true, 'Loading component...');
            
            // Dynamic import (if using modules)
            const module = await import(`../components/${componentName}.js`);
            const ComponentClass = module.default || module[componentName];
            
            if (ComponentClass) {
                const component = new ComponentClass(element);
                this.componentCache.set(componentName, ComponentClass);
                
                // Render component
                await component.render();
                
                this.setLoadingState(element, false);
            }
            
        } catch (error) {
            console.warn('Failed to load component:', componentName, error);
            this.handleComponentError(element, componentName);
        }
    }
    
    /**
     * Render cached component
     */
    renderCachedComponent(element, componentName) {
        const ComponentClass = this.componentCache.get(componentName);
        const component = new ComponentClass(element);
        component.render();
    }
    
    /**
     * Handle component loading error
     */
    handleComponentError(element, componentName) {
        element.innerHTML = `
            <div class="component-error" role="alert">
                <p>Failed to load ${componentName} component</p>
                <button onclick="location.reload()" class="btn btn-sm">Retry</button>
            </div>
        `;
        this.setLoadingState(element, false);
    }
    
    /**
     * Setup resource preloading
     */
    setupPreloading() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Preload on hover for better UX
        this.setupHoverPreloading();
    }
    
    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            { href: 'css/main.css', as: 'style' },
            { href: 'css/components.css', as: 'style' },
            { href: 'js/app.js', as: 'script' },
            { href: 'js/utils/api-client.js', as: 'script' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.type) link.type = resource.type;
            document.head.appendChild(link);
        });
    }
    
    /**
     * Setup hover preloading for better UX
     */
    setupHoverPreloading() {
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (link && this.shouldPreloadLink(link)) {
                this.preloadPage(link.href);
            }
        });
    }
    
    /**
     * Check if link should be preloaded
     */
    shouldPreloadLink(link) {
        const href = link.href;
        
        // Only preload internal links
        if (!href.startsWith(window.location.origin)) return false;
        
        // Don't preload if already preloaded
        if (link.hasAttribute('data-preloaded')) return false;
        
        // Don't preload certain file types
        if (href.match(/\.(pdf|zip|exe|dmg)$/i)) return false;
        
        return true;
    }
    
    /**
     * Preload page resources
     */
    preloadPage(href) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
        
        // Mark as preloaded
        const originalLink = document.querySelector(`a[href="${href}"]`);
        if (originalLink) {
            originalLink.setAttribute('data-preloaded', 'true');
        }
    }
    
    /**
     * Setup caching strategies
     */
    setupCaching() {
        // Service Worker registration for advanced caching
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
        
        // Memory cache for API responses
        this.setupAPICache();
    }
    
    /**
     * Register service worker for caching
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }
    
    /**
     * Setup API response caching
     */
    setupAPICache() {
        // Intercept fetch requests for caching
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            
            // Only cache GET requests
            if (options.method && options.method !== 'GET') {
                return originalFetch(...args);
            }
            
            // Check cache first
            const cacheKey = this.getCacheKey(url, options);
            const cached = this.getFromCache(cacheKey);
            
            if (cached && !this.isCacheExpired(cached)) {
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            // Fetch and cache
            try {
                const response = await originalFetch(...args);
                
                if (response.ok && this.shouldCache(url)) {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();
                    this.setCache(cacheKey, data);
                }
                
                return response;
            } catch (error) {
                // Return cached data if available during network error
                if (cached) {
                    console.warn('Network error, using cached data:', error);
                    return new Response(JSON.stringify(cached.data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw error;
            }
        };
    }
    
    /**
     * Get cache key for request
     */
    getCacheKey(url, options) {
        return `${url}_${JSON.stringify(options.headers || {})}`;
    }
    
    /**
     * Check if URL should be cached
     */
    shouldCache(url) {
        // Cache API endpoints but not authentication endpoints
        return url.includes('/api/') && !url.includes('/auth/');
    }
    
    /**
     * Get data from cache
     */
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Set data in cache
     */
    setCache(key, data, ttl = 300000) { // 5 minutes default
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                ttl
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }
    
    /**
     * Check if cache is expired
     */
    isCacheExpired(cached) {
        return Date.now() - cached.timestamp > cached.ttl;
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorWebVitals();
        
        // Monitor resource loading
        this.monitorResourceLoading();
        
        // Monitor user interactions
        this.monitorUserInteractions();
    }
    
    /**
     * Monitor Core Web Vitals
     */
    monitorWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            console.log('CLS:', clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
    }
    
    /**
     * Monitor resource loading performance
     */
    monitorResourceLoading() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', navigation.loadEventEnd - navigation.fetchStart);
            
            const resources = performance.getEntriesByType('resource');
            resources.forEach(resource => {
                if (resource.duration > 1000) { // Log slow resources
                    console.warn('Slow resource:', resource.name, resource.duration);
                }
            });
        });
    }
    
    /**
     * Monitor user interactions
     */
    monitorUserInteractions() {
        let interactionCount = 0;
        
        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
            }, { passive: true });
        });
        
        // Log interaction metrics periodically
        setInterval(() => {
            if (interactionCount > 0) {
                console.log('User interactions in last minute:', interactionCount);
                interactionCount = 0;
            }
        }, 60000);
    }
    
    /**
     * Set loading state for elements
     */
    setLoadingState(element, isLoading, message = 'Loading...') {
        const loadingId = element.id || `loading_${Date.now()}`;
        
        if (isLoading) {
            this.loadingStates.set(loadingId, {
                element,
                originalContent: element.innerHTML,
                originalAriaLive: element.getAttribute('aria-live')
            });
            
            element.classList.add('loading');
            element.setAttribute('aria-busy', 'true');
            element.setAttribute('aria-live', 'polite');
            
            // Add loading skeleton or spinner
            element.innerHTML = this.createLoadingContent(message);
            
        } else {
            const loadingState = this.loadingStates.get(loadingId);
            if (loadingState) {
                element.classList.remove('loading');
                element.removeAttribute('aria-busy');
                
                if (loadingState.originalAriaLive) {
                    element.setAttribute('aria-live', loadingState.originalAriaLive);
                } else {
                    element.removeAttribute('aria-live');
                }
                
                this.loadingStates.delete(loadingId);
            }
        }
    }
    
    /**
     * Create loading content with skeleton screens
     */
    createLoadingContent(message) {
        return `
            <div class="loading-container" aria-label="${message}">
                <div class="skeleton-content">
                    <div class="skeleton-line skeleton-line-title"></div>
                    <div class="skeleton-line skeleton-line-text"></div>
                    <div class="skeleton-line skeleton-line-text short"></div>
                </div>
                <span class="sr-only">${message}</span>
            </div>
        `;
    }
    
    /**
     * Optimize images for different screen sizes
     */
    optimizeImage(img, sizes = []) {
        if (!sizes.length) {
            sizes = [
                { width: 320, suffix: '_mobile' },
                { width: 768, suffix: '_tablet' },
                { width: 1200, suffix: '_desktop' }
            ];
        }
        
        const baseSrc = img.getAttribute('data-src') || img.src;
        const srcset = sizes.map(size => {
            const optimizedSrc = this.getOptimizedImageUrl(baseSrc, size);
            return `${optimizedSrc} ${size.width}w`;
        }).join(', ');
        
        img.setAttribute('srcset', srcset);
        img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
    }
    
    /**
     * Get optimized image URL
     */
    getOptimizedImageUrl(src, size) {
        // This would integrate with an image optimization service
        // For now, return original URL
        return src;
    }
    
    /**
     * Debounce function for performance
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    /**
     * Throttle function for performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize performance manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceManager = new PerformanceManager();
    });
} else {
    window.performanceManager = new PerformanceManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}


