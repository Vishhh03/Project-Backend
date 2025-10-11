/**
 * Bundle Optimizer
 * 
 * Optimizes loading performance through code splitting, lazy loading,
 * and resource optimization for the FinalDestination application.
 */

class BundleOptimizer {
    constructor(config) {
        this.config = config || {};
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.preloadQueue = [];
        this.criticalResources = new Set();
        
        // Performance metrics
        this.metrics = {
            loadTimes: new Map(),
            bundleSizes: new Map(),
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.init();
    }
    
    /**
     * Initialize bundle optimizer
     */
    init() {
        // Set up resource hints
        this.setupResourceHints();
        
        // Set up intersection observer for lazy loading
        this.setupLazyLoading();
        
        // Set up service worker for caching
        this.setupServiceWorker();
        
        // Monitor performance
        this.setupPerformanceMonitoring();
    }
    
    /**
     * Lazy load a JavaScript module
     */
    async loadModule(modulePath, options = {}) {
        const startTime = performance.now();
        
        // Check if already loaded
        if (this.loadedModules.has(modulePath)) {
            this.metrics.cacheHits++;
            return Promise.resolve();
        }
        
        // Check if currently loading
        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }
        
        // Create loading promise
        const loadingPromise = this.createModuleLoadPromise(modulePath, options);
        this.loadingPromises.set(modulePath, loadingPromise);
        
        try {
            await loadingPromise;
            this.loadedModules.add(modulePath);
            this.metrics.cacheMisses++;
            
            // Record load time
            const loadTime = performance.now() - startTime;
            this.metrics.loadTimes.set(modulePath, loadTime);
            
            console.log(`[BundleOptimizer] Loaded module: ${modulePath} (${loadTime.toFixed(2)}ms)`);
            
        } catch (error) {
            console.error(`[BundleOptimizer] Failed to load module: ${modulePath}`, error);
            throw error;
        } finally {
            this.loadingPromises.delete(modulePath);
        }
    }
    
    /**
     * Create module loading promise
     */
    createModuleLoadPromise(modulePath, options) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = modulePath;
            script.async = true;
            script.defer = options.defer !== false;
            
            // Add integrity check if provided
            if (options.integrity) {
                script.integrity = options.integrity;
                script.crossOrigin = 'anonymous';
            }
            
            script.onload = () => {
                document.head.removeChild(script);
                resolve();
            };
            
            script.onerror = () => {
                document.head.removeChild(script);
                reject(new Error(`Failed to load script: ${modulePath}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalModules = [
            'js/services/auth-service.js',
            'js/services/hotel-service.js',
            'js/components/auth/login-component.js',
            'js/components/hotels/hotel-list-component.js'
        ];
        
        for (const module of criticalModules) {
            this.preloadResource(module, 'script');
            this.criticalResources.add(module);
        }
        
        // Preload critical CSS
        this.preloadResource('css/main.css', 'style');
        this.preloadResource('css/components.css', 'style');
    }
    
    /**
     * Preload a resource
     */
    preloadResource(href, as, crossorigin = null) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        
        if (crossorigin) {
            link.crossOrigin = crossorigin;
        }
        
        document.head.appendChild(link);
    }
    
    /**
     * Set up resource hints
     */
    setupResourceHints() {
        // DNS prefetch for external resources
        this.addResourceHint('dns-prefetch', '//fonts.googleapis.com');
        this.addResourceHint('dns-prefetch', '//cdnjs.cloudflare.com');
        
        // Preconnect to API endpoints
        const apiBase = this.config.apiBaseUrl || '/api';
        if (apiBase.startsWith('http')) {
            const url = new URL(apiBase);
            this.addResourceHint('preconnect', url.origin);
        }
    }
    
    /**
     * Add resource hint
     */
    addResourceHint(rel, href) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
    }
    
    /**
     * Set up lazy loading for images and components
     */
    setupLazyLoading() {
        // Intersection Observer for lazy loading
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyImage(entry.target);
                        this.imageObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            // Observe all lazy images
            this.observeLazyImages();
        }
    }
    
    /**
     * Observe lazy images
     */
    observeLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.imageObserver.observe(img));
    }
    
    /**
     * Load lazy image
     */
    loadLazyImage(img) {
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    }
    
    /**
     * Set up service worker for caching
     */
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[BundleOptimizer] Service Worker registered:', registration);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('[BundleOptimizer] Service Worker update found');
                });
                
            } catch (error) {
                console.warn('[BundleOptimizer] Service Worker registration failed:', error);
            }
        }
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor resource loading
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'resource') {
                        this.recordResourceMetrics(entry);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
        
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn(`[BundleOptimizer] Long task detected: ${entry.duration}ms`);
                    }
                }
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                // longtask not supported in all browsers
            }
        }
    }
    
    /**
     * Record resource metrics
     */
    recordResourceMetrics(entry) {
        const size = entry.transferSize || entry.encodedBodySize || 0;
        const loadTime = entry.responseEnd - entry.requestStart;
        
        this.metrics.bundleSizes.set(entry.name, size);
        this.metrics.loadTimes.set(entry.name, loadTime);
        
        // Log slow resources
        if (loadTime > 1000) {
            console.warn(`[BundleOptimizer] Slow resource: ${entry.name} (${loadTime.toFixed(2)}ms, ${size} bytes)`);
        }
    }
    
    /**
     * Optimize images
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" for modern browsers
            if (!img.hasAttribute('loading') && 'loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
            
            // Add responsive image attributes if missing
            if (!img.hasAttribute('sizes') && img.hasAttribute('srcset')) {
                img.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
            }
        });
    }
    
    /**
     * Compress and minify resources
     */
    async compressResources() {
        // This would typically be done at build time
        // Here we can implement runtime optimizations
        
        // Remove unused CSS
        this.removeUnusedCSS();
        
        // Optimize fonts
        this.optimizeFonts();
        
        // Compress images
        this.optimizeImages();
    }
    
    /**
     * Remove unused CSS (basic implementation)
     */
    removeUnusedCSS() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        
        stylesheets.forEach(async (link) => {
            try {
                const response = await fetch(link.href);
                const css = await response.text();
                
                // Basic unused CSS detection (would need more sophisticated implementation)
                const usedSelectors = this.findUsedSelectors(css);
                
                if (usedSelectors.length < css.split('{').length * 0.5) {
                    console.log(`[BundleOptimizer] Potential unused CSS in: ${link.href}`);
                }
                
            } catch (error) {
                console.warn(`[BundleOptimizer] Could not analyze CSS: ${link.href}`);
            }
        });
    }
    
    /**
     * Find used CSS selectors (basic implementation)
     */
    findUsedSelectors(css) {
        const selectors = css.match(/[^{}]+(?=\s*\{)/g) || [];
        const usedSelectors = [];
        
        selectors.forEach(selector => {
            try {
                if (document.querySelector(selector.trim())) {
                    usedSelectors.push(selector);
                }
            } catch (error) {
                // Invalid selector
            }
        });
        
        return usedSelectors;
    }
    
    /**
     * Optimize fonts
     */
    optimizeFonts() {
        // Add font-display: swap to improve loading performance
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
        
        // Preload critical fonts
        const criticalFonts = [
            '/assets/fonts/main-font.woff2',
            '/assets/fonts/heading-font.woff2'
        ];
        
        criticalFonts.forEach(font => {
            this.preloadResource(font, 'font', 'anonymous');
        });
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            loadedModules: Array.from(this.loadedModules),
            criticalResources: Array.from(this.criticalResources),
            totalBundleSize: Array.from(this.metrics.bundleSizes.values()).reduce((a, b) => a + b, 0),
            averageLoadTime: this.calculateAverageLoadTime()
        };
    }
    
    /**
     * Calculate average load time
     */
    calculateAverageLoadTime() {
        const loadTimes = Array.from(this.metrics.loadTimes.values());
        return loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
        this.metrics.loadTimes.clear();
        this.metrics.bundleSizes.clear();
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BundleOptimizer;
} else {
    window.BundleOptimizer = BundleOptimizer;
}


