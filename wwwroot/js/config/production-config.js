/**
 * Production Configuration and Optimization
 * 
 * Handles production-specific optimizations, minification,
 * and performance enhancements for the FinalDestination application.
 */

class ProductionConfig {
    constructor() {
        this.isProduction = this.detectProductionEnvironment();
        this.optimizations = {
            minification: true,
            compression: true,
            bundling: true,
            caching: true,
            lazyLoading: true,
            imageOptimization: true,
            cssOptimization: true,
            jsOptimization: true
        };
        
        this.performanceTargets = {
            firstContentfulPaint: 1500, // 1.5s
            largestContentfulPaint: 2500, // 2.5s
            firstInputDelay: 100, // 100ms
            cumulativeLayoutShift: 0.1
        };
        
        this.init();
    }
    
    /**
     * Initialize production configuration
     */
    init() {
        if (this.isProduction) {
            this.applyProductionOptimizations();
            this.setupPerformanceMonitoring();
            this.setupErrorReporting();
        }
    }
    
    /**
     * Set up error reporting
     */
    setupErrorReporting() {
        console.log('[ProductionConfig] Setting up error reporting...');
        
        // Global error handler
        window.addEventListener('error', (event) => {
            this.reportError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack || event.error
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError('Unhandled Promise Rejection', {
                reason: event.reason?.message || event.reason,
                stack: event.reason?.stack
            });
        });
        
        // Console error override for production
        if (this.isProduction) {
            const originalError = console.error;
            console.error = (...args) => {
                this.reportError('Console Error', {
                    message: args.join(' ')
                });
                originalError.apply(console, args);
            };
        }
        
        console.log('[ProductionConfig] Error reporting set up successfully');
    }
    
    /**
     * Detect production environment
     */
    detectProductionEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Production indicators
        const productionIndicators = [
            hostname !== 'localhost',
            hostname !== '127.0.0.1',
            !hostname.includes('dev'),
            !hostname.includes('test'),
            protocol === 'https:',
            !window.location.search.includes('debug=true')
        ];
        
        return productionIndicators.filter(Boolean).length >= 4;
    }
    
    /**
     * Apply production optimizations
     */
    applyProductionOptimizations() {
        console.log('[ProductionConfig] Applying production optimizations...');
        
        // Disable console logs in production
        this.disableConsoleLogging();
        
        // Enable compression
        this.enableCompression();
        
        // Optimize critical rendering path
        this.optimizeCriticalRenderingPath();
        
        // Set up resource hints
        this.setupResourceHints();
        
        // Enable advanced caching
        this.enableAdvancedCaching();
        
        // Optimize fonts
        this.optimizeFonts();
        
        // Optimize images
        this.optimizeImages();
        
        // Minify and compress CSS/JS
        this.optimizeAssets();
        
        console.log('[ProductionConfig] Production optimizations applied');
    }
    
    /**
     * Disable console logging in production
     */
    disableConsoleLogging() {
        if (this.isProduction && !window.location.search.includes('debug=true')) {
            const noop = () => {};
            console.log = noop;
            console.info = noop;
            console.warn = noop;
            // Keep console.error for critical issues
        }
    }
    
    /**
     * Enable compression
     */
    enableCompression() {
        // Add compression headers hint
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Encoding';
        meta.content = 'gzip, deflate, br';
        document.head.appendChild(meta);
        
        // Enable text compression for dynamic content
        if ('CompressionStream' in window) {
            this.compressionEnabled = true;
        }
    }
    
    /**
     * Optimize critical rendering path
     */
    optimizeCriticalRenderingPath() {
        // Inline critical CSS
        this.inlineCriticalCSS();
        
        // Defer non-critical CSS
        this.deferNonCriticalCSS();
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Optimize font loading
        this.optimizeFontLoading();
    }
    
    /**
     * Inline critical CSS
     */
    inlineCriticalCSS() {
        const criticalCSS = `
            /* Critical CSS for above-the-fold content */
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .navbar { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .hero-section { padding: 60px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
            .btn-primary { background: #007bff; color: white; }
            .loading-spinner { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; }
        `;
        
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
    }
    
    /**
     * Defer non-critical CSS
     */
    deferNonCriticalCSS() {
        const nonCriticalCSS = [
            'css/components.css',
            'css/responsive.css'
        ];
        
        nonCriticalCSS.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = href;
            link.onload = function() {
                this.onload = null;
                this.rel = 'stylesheet';
            };
            document.head.appendChild(link);
        });
    }
    
    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            { href: 'js/utils/api-client.js', as: 'script' },
            { href: 'js/services/auth-service.js', as: 'script' },
            { href: 'js/utils/router.js', as: 'script' },
            { href: 'assets/fonts/main-font.woff2', as: 'font', crossorigin: 'anonymous' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.crossorigin) {
                link.crossOrigin = resource.crossorigin;
            }
            document.head.appendChild(link);
        });
    }
    
    /**
     * Optimize font loading
     */
    optimizeFontLoading() {
        // Add font-display: swap to all font faces
        const fontOptimizationCSS = `
            @font-face {
                font-display: swap;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = fontOptimizationCSS;
        document.head.appendChild(style);
    }
    
    /**
     * Set up resource hints
     */
    setupResourceHints() {
        const hints = [
            { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
            { rel: 'dns-prefetch', href: '//cdnjs.cloudflare.com' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
        ];
        
        hints.forEach(hint => {
            const link = document.createElement('link');
            link.rel = hint.rel;
            link.href = hint.href;
            if (hint.crossorigin) {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }
    
    /**
     * Enable advanced caching
     */
    enableAdvancedCaching() {
        // Set up cache headers for static assets
        const cacheableResources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
        
        cacheableResources.forEach(resource => {
            // Add cache-busting for versioned resources
            const url = new URL(resource.href || resource.src, window.location.origin);
            if (!url.searchParams.has('v')) {
                url.searchParams.set('v', this.getCacheVersion());
                if (resource.href) {
                    resource.href = url.toString();
                } else {
                    resource.src = url.toString();
                }
            }
        });
    }
    
    /**
     * Get cache version
     */
    getCacheVersion() {
        // Use build timestamp or version from config
        return window.FinalDestination?.infrastructure?.config?.get('version') || Date.now().toString();
    }
    
    /**
     * Optimize fonts
     */
    optimizeFonts() {
        // Subset fonts to only include used characters
        const fontSubsets = {
            'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
        };
        
        // Add font optimization meta tag
        const meta = document.createElement('meta');
        meta.name = 'font-optimization';
        meta.content = 'subset,swap,preload';
        document.head.appendChild(meta);
    }
    
    /**
     * Optimize images
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" for non-critical images
            if (!img.hasAttribute('loading') && !img.closest('.hero-section')) {
                img.loading = 'lazy';
            }
            
            // Add decoding="async" for better performance
            if (!img.hasAttribute('decoding')) {
                img.decoding = 'async';
            }
            
            // Add responsive image attributes
            if (!img.hasAttribute('sizes') && img.hasAttribute('srcset')) {
                img.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
            }
        });
    }
    
    /**
     * Optimize assets (CSS/JS)
     */
    optimizeAssets() {
        // Remove unused CSS classes (basic implementation)
        this.removeUnusedCSS();
        
        // Minify inline scripts and styles
        this.minifyInlineAssets();
        
        // Enable tree shaking for modules
        this.enableTreeShaking();
    }
    
    /**
     * Remove unused CSS
     */
    removeUnusedCSS() {
        const stylesheets = document.querySelectorAll('style');
        
        stylesheets.forEach(style => {
            const css = style.textContent;
            const optimizedCSS = this.optimizeCSS(css);
            if (optimizedCSS !== css) {
                style.textContent = optimizedCSS;
            }
        });
    }
    
    /**
     * Optimize CSS content
     */
    optimizeCSS(css) {
        return css
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove unnecessary semicolons
            .replace(/;}/g, '}')
            // Trim
            .trim();
    }
    
    /**
     * Minify inline assets
     */
    minifyInlineAssets() {
        // Minify inline scripts
        const inlineScripts = document.querySelectorAll('script:not([src])');
        inlineScripts.forEach(script => {
            if (script.textContent.trim()) {
                script.textContent = this.minifyJS(script.textContent);
            }
        });
    }
    
    /**
     * Basic JS minification
     */
    minifyJS(js) {
        return js
            // Remove single-line comments
            .replace(/\/\/.*$/gm, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Trim
            .trim();
    }
    
    /**
     * Enable tree shaking
     */
    enableTreeShaking() {
        // Mark modules for tree shaking
        if (window.FinalDestination) {
            window.FinalDestination.treeShakingEnabled = true;
        }
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Monitor resource loading
        this.monitorResourceLoading();
        
        // Monitor JavaScript errors
        this.monitorJavaScriptErrors();
        
        // Set up performance reporting
        this.setupPerformanceReporting();
    }
    
    /**
     * Monitor Core Web Vitals
     */
    monitorCoreWebVitals() {
        if ('PerformanceObserver' in window) {
            // First Contentful Paint
            const fcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.reportMetric('FCP', entry.startTime);
                    }
                }
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
            
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.reportMetric('LCP', entry.startTime);
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.reportMetric('FID', entry.processingStart - entry.startTime);
                }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            
            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.reportMetric('CLS', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    /**
     * Monitor resource loading
     */
    monitorResourceLoading() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const loadTime = entry.responseEnd - entry.requestStart;
                    const size = entry.transferSize || entry.encodedBodySize || 0;
                    
                    // Report slow resources
                    if (loadTime > 1000) {
                        this.reportSlowResource(entry.name, loadTime, size);
                    }
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }
    
    /**
     * Monitor JavaScript errors
     */
    monitorJavaScriptErrors() {
        window.addEventListener('error', (event) => {
            this.reportError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError('Unhandled Promise Rejection', {
                reason: event.reason
            });
        });
    }
    
    /**
     * Set up performance reporting
     */
    setupPerformanceReporting() {
        // Report performance metrics after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.reportPerformanceMetrics();
            }, 1000);
        });
    }
    
    /**
     * Report performance metric
     */
    reportMetric(name, value) {
        const target = this.performanceTargets[name.toLowerCase().replace(/([A-Z])/g, (match) => match.toLowerCase())];
        const status = target && value > target ? 'poor' : 'good';
        
        console.log(`[ProductionConfig] ${name}: ${value.toFixed(2)}ms (${status})`);
        
        // Send to analytics if available
        if (window.gtag) {
            window.gtag('event', 'web_vital', {
                name: name,
                value: Math.round(value),
                event_category: 'Performance'
            });
        }
    }
    
    /**
     * Report slow resource
     */
    reportSlowResource(url, loadTime, size) {
        console.warn(`[ProductionConfig] Slow resource: ${url} (${loadTime.toFixed(2)}ms, ${size} bytes)`);
        
        // Send to analytics if available
        if (window.gtag) {
            window.gtag('event', 'slow_resource', {
                resource_url: url,
                load_time: Math.round(loadTime),
                resource_size: size,
                event_category: 'Performance'
            });
        }
    }
    
    /**
     * Report error
     */
    reportError(type, details) {
        console.error(`[ProductionConfig] ${type}:`, details);
        
        // Send to error reporting service if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: `${type}: ${details.message || details.reason}`,
                fatal: false
            });
        }
    }
    
    /**
     * Report performance metrics
     */
    reportPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
        
        console.log('[ProductionConfig] Performance Metrics:', metrics);
        
        // Send to analytics
        if (window.gtag) {
            Object.entries(metrics).forEach(([name, value]) => {
                if (value > 0) {
                    window.gtag('event', 'timing_complete', {
                        name: name,
                        value: Math.round(value),
                        event_category: 'Performance'
                    });
                }
            });
        }
    }
    
    /**
     * Get optimization status
     */
    getOptimizationStatus() {
        return {
            isProduction: this.isProduction,
            optimizations: this.optimizations,
            performanceTargets: this.performanceTargets
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionConfig;
} else {
    window.ProductionConfig = ProductionConfig;
}


