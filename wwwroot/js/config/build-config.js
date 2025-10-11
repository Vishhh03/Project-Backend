/**
 * Build Configuration
 * 
 * Configuration for production builds, optimization settings,
 * and deployment-specific configurations.
 */

class BuildConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.getEnvironmentConfig();
    }
    
    /**
     * Detect current environment
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }
    
    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
        const baseConfig = {
            // Build optimization
            minification: {
                enabled: false,
                removeComments: true,
                removeWhitespace: true,
                mangleNames: false
            },
            
            // Bundle optimization
            bundling: {
                enabled: false,
                splitChunks: true,
                treeshaking: true,
                compression: 'gzip'
            },
            
            // Asset optimization
            assets: {
                imageOptimization: true,
                fontOptimization: true,
                cssOptimization: true,
                inlineSmallAssets: true,
                assetHashing: false
            },
            
            // Performance
            performance: {
                lazyLoading: true,
                preloading: true,
                caching: true,
                serviceWorker: false
            },
            
            // Security
            security: {
                contentSecurityPolicy: false,
                subresourceIntegrity: false,
                httpsOnly: false,
                secureHeaders: false
            },
            
            // Monitoring
            monitoring: {
                performanceMetrics: true,
                errorTracking: true,
                userAnalytics: false,
                debugging: true
            }
        };
        
        // Environment-specific overrides
        switch (this.environment) {
            case 'development':
                return {
                    ...baseConfig,
                    monitoring: {
                        ...baseConfig.monitoring,
                        debugging: true,
                        performanceMetrics: true
                    }
                };
                
            case 'staging':
                return {
                    ...baseConfig,
                    minification: {
                        ...baseConfig.minification,
                        enabled: true,
                        mangleNames: false
                    },
                    bundling: {
                        ...baseConfig.bundling,
                        enabled: true
                    },
                    performance: {
                        ...baseConfig.performance,
                        serviceWorker: true
                    },
                    security: {
                        ...baseConfig.security,
                        httpsOnly: true,
                        contentSecurityPolicy: true
                    },
                    monitoring: {
                        ...baseConfig.monitoring,
                        debugging: false,
                        userAnalytics: true
                    }
                };
                
            case 'production':
                return {
                    ...baseConfig,
                    minification: {
                        ...baseConfig.minification,
                        enabled: true,
                        mangleNames: true,
                        removeComments: true,
                        removeWhitespace: true
                    },
                    bundling: {
                        ...baseConfig.bundling,
                        enabled: true,
                        compression: 'brotli'
                    },
                    assets: {
                        ...baseConfig.assets,
                        assetHashing: true,
                        inlineSmallAssets: true
                    },
                    performance: {
                        ...baseConfig.performance,
                        serviceWorker: true,
                        caching: true
                    },
                    security: {
                        ...baseConfig.security,
                        contentSecurityPolicy: true,
                        subresourceIntegrity: true,
                        httpsOnly: true,
                        secureHeaders: true
                    },
                    monitoring: {
                        ...baseConfig.monitoring,
                        debugging: false,
                        userAnalytics: true,
                        errorTracking: true
                    }
                };
                
            default:
                return baseConfig;
        }
    }
    
    /**
     * Get configuration value
     */
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Check if feature is enabled
     */
    isEnabled(feature) {
        return this.get(feature) === true;
    }
    
    /**
     * Get environment
     */
    getEnvironment() {
        return this.environment;
    }
    
    /**
     * Is production environment
     */
    isProduction() {
        return this.environment === 'production';
    }
    
    /**
     * Is development environment
     */
    isDevelopment() {
        return this.environment === 'development';
    }
    
    /**
     * Is staging environment
     */
    isStaging() {
        return this.environment === 'staging';
    }
    
    /**
     * Get Content Security Policy
     */
    getContentSecurityPolicy() {
        if (!this.isEnabled('security.contentSecurityPolicy')) {
            return null;
        }
        
        const policy = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'font-src': ["'self'", 'https://fonts.gstatic.com'],
            'img-src': ["'self'", 'data:', 'https:'],
            'connect-src': ["'self'"],
            'frame-ancestors': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"]
        };
        
        // Convert to CSP string
        return Object.entries(policy)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');
    }
    
    /**
     * Get security headers
     */
    getSecurityHeaders() {
        if (!this.isEnabled('security.secureHeaders')) {
            return {};
        }
        
        const headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
        
        const csp = this.getContentSecurityPolicy();
        if (csp) {
            headers['Content-Security-Policy'] = csp;
        }
        
        if (this.isEnabled('security.httpsOnly')) {
            headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }
        
        return headers;
    }
    
    /**
     * Get asset optimization settings
     */
    getAssetOptimization() {
        return {
            images: {
                formats: ['webp', 'avif', 'jpg', 'png'],
                quality: this.isProduction() ? 80 : 90,
                progressive: true,
                responsive: true
            },
            css: {
                minify: this.isEnabled('minification.enabled'),
                autoprefixer: true,
                purgeUnused: this.isProduction(),
                inlineCritical: this.isProduction()
            },
            js: {
                minify: this.isEnabled('minification.enabled'),
                mangle: this.isEnabled('minification.mangleNames'),
                treeshake: this.isEnabled('bundling.treeshaking'),
                sourcemaps: !this.isProduction()
            }
        };
    }
    
    /**
     * Get performance budget
     */
    getPerformanceBudget() {
        return {
            // Size budgets (in KB)
            maxBundleSize: this.isProduction() ? 250 : 500,
            maxChunkSize: this.isProduction() ? 100 : 200,
            maxAssetSize: this.isProduction() ? 50 : 100,
            
            // Timing budgets (in ms)
            maxLoadTime: this.isProduction() ? 3000 : 5000,
            maxFirstContentfulPaint: this.isProduction() ? 1500 : 2500,
            maxLargestContentfulPaint: this.isProduction() ? 2500 : 4000,
            maxFirstInputDelay: 100,
            maxCumulativeLayoutShift: 0.1
        };
    }
    
    /**
     * Get caching strategy
     */
    getCachingStrategy() {
        return {
            static: {
                maxAge: this.isProduction() ? 31536000 : 3600, // 1 year : 1 hour
                immutable: this.isProduction()
            },
            dynamic: {
                maxAge: this.isProduction() ? 3600 : 300, // 1 hour : 5 minutes
                staleWhileRevalidate: true
            },
            api: {
                maxAge: 300, // 5 minutes
                networkFirst: true
            }
        };
    }
    
    /**
     * Apply build optimizations
     */
    applyOptimizations() {
        console.log(`[BuildConfig] Applying optimizations for ${this.environment} environment`);
        
        // Apply security headers
        if (this.isEnabled('security.secureHeaders')) {
            this.applySecurityHeaders();
        }
        
        // Apply performance optimizations
        if (this.isEnabled('performance.lazyLoading')) {
            this.enableLazyLoading();
        }
        
        // Apply asset optimizations
        if (this.isEnabled('assets.imageOptimization')) {
            this.optimizeImages();
        }
        
        // Set up monitoring
        if (this.isEnabled('monitoring.performanceMetrics')) {
            this.setupPerformanceMonitoring();
        }
    }
    
    /**
     * Apply security headers (client-side hints)
     */
    applySecurityHeaders() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-Content-Type-Options';
        meta.content = 'nosniff';
        document.head.appendChild(meta);
        
        // Add CSP meta tag
        const csp = this.getContentSecurityPolicy();
        if (csp) {
            const cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = 'Content-Security-Policy';
            cspMeta.content = csp;
            document.head.appendChild(cspMeta);
        }
    }
    
    /**
     * Enable lazy loading
     */
    enableLazyLoading() {
        // Add loading="lazy" to images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
        });
    }
    
    /**
     * Optimize images
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add responsive image attributes
            if (!img.hasAttribute('sizes') && img.hasAttribute('srcset')) {
                img.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
            }
            
            // Add decoding hint
            if (!img.hasAttribute('decoding')) {
                img.decoding = 'async';
            }
        });
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.log(`[BuildConfig] ${entry.entryType}:`, entry);
                }
            });
            
            try {
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (error) {
                console.warn('[BuildConfig] Performance monitoring not fully supported');
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildConfig;
} else {
    window.BuildConfig = BuildConfig;
}


