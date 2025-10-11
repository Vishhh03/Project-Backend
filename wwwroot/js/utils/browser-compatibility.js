/**
 * Browser Compatibility Layer
 * 
 * Provides polyfills and compatibility fixes for cross-browser support
 * in the FinalDestination application.
 */

class BrowserCompatibility {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.supportedFeatures = this.checkFeatureSupport();
        
        this.init();
    }
    
    /**
     * Initialize compatibility layer
     */
    init() {
        console.log('[BrowserCompatibility] Initializing browser compatibility layer');
        console.log('[BrowserCompatibility] Browser:', this.browserInfo);
        
        // Apply polyfills
        this.applyPolyfills();
        
        // Apply browser-specific fixes
        this.applyBrowserFixes();
        
        // Set up feature detection
        this.setupFeatureDetection();
        
        // Add browser classes to body
        this.addBrowserClasses();
        
        console.log('[BrowserCompatibility] Compatibility layer initialized');
    }
    
    /**
     * Detect browser information
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor || '';
        
        let browser = 'unknown';
        let version = 'unknown';
        let engine = 'unknown';
        
        // Detect browser
        if (userAgent.includes('Chrome') && vendor.includes('Google')) {
            browser = 'chrome';
            version = this.extractVersion(userAgent, /Chrome\/(\d+)/);
            engine = 'blink';
        } else if (userAgent.includes('Firefox')) {
            browser = 'firefox';
            version = this.extractVersion(userAgent, /Firefox\/(\d+)/);
            engine = 'gecko';
        } else if (userAgent.includes('Safari') && vendor.includes('Apple')) {
            browser = 'safari';
            version = this.extractVersion(userAgent, /Version\/(\d+)/);
            engine = 'webkit';
        } else if (userAgent.includes('Edge')) {
            browser = 'edge';
            version = this.extractVersion(userAgent, /Edge\/(\d+)/);
            engine = 'blink';
        } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
            browser = 'ie';
            version = this.extractVersion(userAgent, /(?:MSIE |rv:)(\d+)/);
            engine = 'trident';
        }
        
        // Detect mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
        
        return {
            browser,
            version: parseInt(version, 10),
            engine,
            isMobile,
            isTablet,
            isDesktop: !isMobile && !isTablet,
            userAgent
        };
    }
    
    /**
     * Extract version from user agent
     */
    extractVersion(userAgent, regex) {
        const match = userAgent.match(regex);
        return match ? match[1] : 'unknown';
    }
    
    /**
     * Check feature support
     */
    checkFeatureSupport() {
        return {
            // ES6+ features
            arrow: this.testFeature(() => eval('(() => true)()')),
            const: this.testFeature(() => eval('const x = 1; x === 1')),
            let: this.testFeature(() => eval('let x = 1; x === 1')),
            destructuring: this.testFeature(() => eval('const [a] = [1]; a === 1')),
            spread: this.testFeature(() => eval('[...[1, 2]].length === 2')),
            templateLiterals: this.testFeature(() => eval('`test` === "test"')),
            classes: this.testFeature(() => eval('class Test {}; typeof Test === "function"')),
            modules: 'import' in document.createElement('script'),
            
            // Web APIs
            fetch: 'fetch' in window,
            promise: 'Promise' in window,
            intersectionObserver: 'IntersectionObserver' in window,
            mutationObserver: 'MutationObserver' in window,
            performanceObserver: 'PerformanceObserver' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webWorker: 'Worker' in window,
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            
            // CSS features
            cssGrid: this.testCSSFeature('display', 'grid'),
            cssFlexbox: this.testCSSFeature('display', 'flex'),
            cssCustomProperties: this.testCSSFeature('--test', 'test'),
            cssCalc: this.testCSSFeature('width', 'calc(1px + 1px)'),
            
            // HTML features
            customElements: 'customElements' in window,
            shadowDOM: 'attachShadow' in Element.prototype,
            
            // Input types
            inputDate: this.testInputType('date'),
            inputTime: this.testInputType('time'),
            inputEmail: this.testInputType('email'),
            inputTel: this.testInputType('tel'),
            inputUrl: this.testInputType('url'),
            inputNumber: this.testInputType('number'),
            inputRange: this.testInputType('range'),
            inputColor: this.testInputType('color'),
            
            // Media features
            webp: this.testImageFormat('webp'),
            avif: this.testImageFormat('avif'),
            
            // Touch and pointer
            touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            pointerEvents: 'PointerEvent' in window
        };
    }
    
    /**
     * Test feature support
     */
    testFeature(test) {
        try {
            return test();
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test localStorage support
     */
    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test sessionStorage support
     */
    testSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test CSS feature support
     */
    testCSSFeature(property, value) {
        const element = document.createElement('div');
        try {
            element.style[property] = value;
            return element.style[property] === value;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test input type support
     */
    testInputType(type) {
        const input = document.createElement('input');
        input.type = type;
        return input.type === type;
    }
    
    /**
     * Test image format support
     */
    testImageFormat(format) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            
            const testImages = {
                webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
                avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
            };
            
            img.src = testImages[format] || '';
        });
    }
    
    /**
     * Apply polyfills
     */
    applyPolyfills() {
        // Promise polyfill
        if (!this.supportedFeatures.promise) {
            this.loadPolyfill('https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js');
        }
        
        // Fetch polyfill
        if (!this.supportedFeatures.fetch) {
            this.loadPolyfill('https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js');
        }
        
        // IntersectionObserver polyfill
        if (!this.supportedFeatures.intersectionObserver) {
            this.loadPolyfill('https://cdn.jsdelivr.net/npm/intersection-observer@0.12.0/intersection-observer.js');
        }
        
        // Custom polyfills
        this.applyCustomPolyfills();
    }
    
    /**
     * Apply custom polyfills
     */
    applyCustomPolyfills() {
        // Object.assign polyfill
        if (!Object.assign) {
            Object.assign = function(target, ...sources) {
                if (target == null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }
                
                const to = Object(target);
                
                for (let index = 0; index < sources.length; index++) {
                    const nextSource = sources[index];
                    
                    if (nextSource != null) {
                        for (const nextKey in nextSource) {
                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                to[nextKey] = nextSource[nextKey];
                            }
                        }
                    }
                }
                
                return to;
            };
        }
        
        // Array.from polyfill
        if (!Array.from) {
            Array.from = function(arrayLike, mapFn, thisArg) {
                const C = this;
                const items = Object(arrayLike);
                
                if (arrayLike == null) {
                    throw new TypeError('Array.from requires an array-like object - not null or undefined');
                }
                
                const mapFunction = mapFn === undefined ? undefined : mapFn;
                if (typeof mapFunction !== 'undefined' && typeof mapFunction !== 'function') {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }
                
                const len = parseInt(items.length);
                const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
                
                let k = 0;
                while (k < len) {
                    const kValue = items[k];
                    const mappedValue = mapFunction ? mapFunction.call(thisArg, kValue, k) : kValue;
                    A[k] = mappedValue;
                    k += 1;
                }
                
                A.length = len;
                return A;
            };
        }
        
        // String.includes polyfill
        if (!String.prototype.includes) {
            String.prototype.includes = function(search, start) {
                if (typeof start !== 'number') {
                    start = 0;
                }
                
                if (start + search.length > this.length) {
                    return false;
                } else {
                    return this.indexOf(search, start) !== -1;
                }
            };
        }
        
        // Element.closest polyfill
        if (!Element.prototype.closest) {
            Element.prototype.closest = function(selector) {
                let element = this;
                
                while (element && element.nodeType === 1) {
                    if (element.matches(selector)) {
                        return element;
                    }
                    element = element.parentElement;
                }
                
                return null;
            };
        }
        
        // Element.matches polyfill
        if (!Element.prototype.matches) {
            Element.prototype.matches = Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function(selector) {
                    const matches = (this.document || this.ownerDocument).querySelectorAll(selector);
                    let i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                };
        }
    }
    
    /**
     * Load external polyfill
     */
    loadPolyfill(url) {
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        document.head.appendChild(script);
    }
    
    /**
     * Apply browser-specific fixes
     */
    applyBrowserFixes() {
        // IE fixes
        if (this.browserInfo.browser === 'ie') {
            this.applyIEFixes();
        }
        
        // Safari fixes
        if (this.browserInfo.browser === 'safari') {
            this.applySafariFixes();
        }
        
        // Mobile fixes
        if (this.browserInfo.isMobile) {
            this.applyMobileFixes();
        }
    }
    
    /**
     * Apply Internet Explorer fixes
     */
    applyIEFixes() {
        // Add IE-specific CSS
        const style = document.createElement('style');
        style.textContent = `
            /* IE flexbox fixes */
            .flex-container {
                display: -ms-flexbox;
                display: flex;
            }
            
            /* IE grid fallbacks */
            .grid-container {
                display: -ms-grid;
                display: grid;
            }
        `;
        document.head.appendChild(style);
        
        // Console polyfill for older IE
        if (!window.console) {
            window.console = {
                log: function() {},
                error: function() {},
                warn: function() {},
                info: function() {}
            };
        }
    }
    
    /**
     * Apply Safari fixes
     */
    applySafariFixes() {
        // Safari date input fix
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!this.supportedFeatures.inputDate) {
                input.type = 'text';
                input.placeholder = 'MM/DD/YYYY';
            }
        });
    }
    
    /**
     * Apply mobile fixes
     */
    applyMobileFixes() {
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                }
            });
            
            input.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.content = 'width=device-width, initial-scale=1.0';
                }
            });
        });
        
        // Fix iOS Safari 100vh issue
        const style = document.createElement('style');
        style.textContent = `
            .full-height {
                height: 100vh;
                height: -webkit-fill-available;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Set up feature detection
     */
    setupFeatureDetection() {
        // Add feature classes to document
        const features = this.supportedFeatures;
        const classes = [];
        
        Object.keys(features).forEach(feature => {
            const className = features[feature] ? feature : `no-${feature}`;
            classes.push(className);
        });
        
        document.documentElement.className += ' ' + classes.join(' ');
    }
    
    /**
     * Add browser classes to body
     */
    addBrowserClasses() {
        const classes = [
            `browser-${this.browserInfo.browser}`,
            `browser-version-${this.browserInfo.version}`,
            `engine-${this.browserInfo.engine}`
        ];
        
        if (this.browserInfo.isMobile) classes.push('mobile');
        if (this.browserInfo.isTablet) classes.push('tablet');
        if (this.browserInfo.isDesktop) classes.push('desktop');
        
        document.body.className += ' ' + classes.join(' ');
    }
    
    /**
     * Get browser information
     */
    getBrowserInfo() {
        return this.browserInfo;
    }
    
    /**
     * Get supported features
     */
    getSupportedFeatures() {
        return this.supportedFeatures;
    }
    
    /**
     * Check if feature is supported
     */
    isSupported(feature) {
        return this.supportedFeatures[feature] === true;
    }
    
    /**
     * Get compatibility report
     */
    getCompatibilityReport() {
        return {
            browser: this.browserInfo,
            features: this.supportedFeatures,
            recommendations: this.getRecommendations()
        };
    }
    
    /**
     * Get recommendations for unsupported features
     */
    getRecommendations() {
        const recommendations = [];
        
        if (!this.supportedFeatures.fetch) {
            recommendations.push('Consider using a fetch polyfill for better network request support');
        }
        
        if (!this.supportedFeatures.promise) {
            recommendations.push('Consider using a Promise polyfill for better async support');
        }
        
        if (!this.supportedFeatures.intersectionObserver) {
            recommendations.push('Consider using an IntersectionObserver polyfill for better lazy loading');
        }
        
        if (this.browserInfo.browser === 'ie' && this.browserInfo.version < 11) {
            recommendations.push('Consider upgrading to a modern browser for better performance and security');
        }
        
        return recommendations;
    }
}

// Initialize compatibility layer
const browserCompatibility = new BrowserCompatibility();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserCompatibility;
} else {
    window.BrowserCompatibility = BrowserCompatibility;
    window.browserCompatibility = browserCompatibility;
}


