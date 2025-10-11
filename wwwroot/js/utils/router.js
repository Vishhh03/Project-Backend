/**
 * Router - Single Page Application routing service
 * Handles hash-based routing with parameter extraction and browser history management
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.historyIndex = -1;
        this.isNavigating = false;
        this.routeChangeListeners = [];

        // Bind event handlers
        this.handleHashChange = this.handleHashChange.bind(this);
        this.handlePopState = this.handlePopState.bind(this);

        // Initialize router
        this.init();
    }

    /**
     * Initialize router and set up event listeners
     */
    init() {
        window.addEventListener('hashchange', this.handleHashChange);
        window.addEventListener('popstate', this.handlePopState);
        
        // Handle initial route
        this.handleHashChange();
    }

    /**
     * Register a route with its handler
     * @param {string} path - Route path (supports parameters with :param)
     * @param {Function} handler - Route handler function
     * @param {Object} options - Route options
     */
    addRoute(path, handler, options = {}) {
        const route = {
            path,
            handler,
            options,
            regex: this.pathToRegex(path),
            paramNames: this.extractParamNames(path)
        };

        this.routes.set(path, route);
    }

    /**
     * Remove a route
     * @param {string} path - Route path to remove
     */
    removeRoute(path) {
        this.routes.delete(path);
    }

    /**
     * Convert path pattern to regex
     * @param {string} path - Path pattern
     * @returns {RegExp} Regular expression for matching
     */
    pathToRegex(path) {
        // Escape special regex characters except :
        const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Replace :param with capturing group
        const regexPath = escapedPath.replace(/:([^/]+)/g, '([^/]+)');
        
        return new RegExp(`^${regexPath}$`);
    }

    /**
     * Extract parameter names from path
     * @param {string} path - Path pattern
     * @returns {Array} Array of parameter names
     */
    extractParamNames(path) {
        const matches = path.match(/:([^/]+)/g);
        return matches ? matches.map(match => match.substring(1)) : [];
    }

    /**
     * Parse current hash and extract route and parameters
     * @returns {Object} Parsed route information
     */
    parseCurrentHash() {
        const hash = window.location.hash.substring(1) || '/';
        const [path, queryString] = hash.split('?');
        
        return {
            path: path || '/',
            queryString: queryString || '',
            queryParams: this.parseQueryString(queryString || '')
        };
    }

    /**
     * Parse query string into object
     * @param {string} queryString - Query string
     * @returns {Object} Query parameters object
     */
    parseQueryString(queryString) {
        const params = {};
        if (!queryString) return params;

        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
            }
        });

        return params;
    }

    /**
     * Find matching route for given path
     * @param {string} path - Path to match
     * @returns {Object|null} Matching route with parameters
     */
    findRoute(path) {
        for (const route of this.routes.values()) {
            const match = path.match(route.regex);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                return {
                    route,
                    params
                };
            }
        }
        return null;
    }

    /**
     * Handle hash change event
     */
    async handleHashChange() {
        if (this.isNavigating) return;

        const { path, queryParams } = this.parseCurrentHash();
        const matchedRoute = this.findRoute(path);

        if (matchedRoute) {
            const { route, params } = matchedRoute;
            
            try {
                // Execute route guards
                const guardsPass = await this.executeGuards(route, params, queryParams);
                if (!guardsPass) {
                    console.warn('Route guards failed for:', path);
                    return;
                }

                // Store previous route
                const previousRoute = this.currentRoute;
                const previousPath = previousRoute ? previousRoute.path : null;

                // Set current route
                this.currentRoute = {
                    path,
                    route,
                    params,
                    queryParams
                };

                // Notify route change listeners
                this.notifyRouteChangeListeners(path, previousPath);

                // Execute route handler
                await route.handler(params, queryParams);
                
                // Add to history if not navigating back/forward
                if (!this.isNavigating) {
                    this.addToHistory(path);
                }
            } catch (error) {
                console.error('Route handler error:', error);
                this.handleRouteError(error);
            }
        } else {
            console.warn('No route found for:', path);
            this.handleNotFound(path);
        }
    }

    /**
     * Handle popstate event (browser back/forward)
     */
    handlePopState() {
        // Handle browser navigation
        this.handleHashChange();
    }

    /**
     * Navigate to a specific path
     * @param {string} path - Path to navigate to
     * @param {Object} options - Navigation options
     */
    navigate(path, options = {}) {
        const { replace = false, state = null } = options;

        if (replace) {
            window.location.replace(`#${path}`);
        } else {
            window.location.hash = path;
        }

        if (state) {
            history.replaceState(state, '', window.location.href);
        }
    }

    /**
     * Navigate back in history
     */
    back() {
        if (this.historyIndex > 0) {
            this.isNavigating = true;
            this.historyIndex--;
            const previousPath = this.history[this.historyIndex];
            window.location.hash = previousPath;
            setTimeout(() => {
                this.isNavigating = false;
            }, 100);
        } else {
            window.history.back();
        }
    }

    /**
     * Navigate forward in history
     */
    forward() {
        if (this.historyIndex < this.history.length - 1) {
            this.isNavigating = true;
            this.historyIndex++;
            const nextPath = this.history[this.historyIndex];
            window.location.hash = nextPath;
            setTimeout(() => {
                this.isNavigating = false;
            }, 100);
        } else {
            window.history.forward();
        }
    }

    /**
     * Add path to internal history
     * @param {string} path - Path to add
     */
    addToHistory(path) {
        // Remove any forward history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Add new path
        this.history.push(path);
        this.historyIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * Get current route information
     * @returns {Object|null} Current route information
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Check if router can go back
     * @returns {boolean} True if can go back
     */
    canGoBack() {
        return this.historyIndex > 0 || window.history.length > 1;
    }

    /**
     * Check if router can go forward
     * @returns {boolean} True if can go forward
     */
    canGoForward() {
        return this.historyIndex < this.history.length - 1;
    }

    /**
     * Handle route not found
     * @param {string} path - Path that wasn't found
     */
    handleNotFound(path) {
        // Try to find a 404 route
        const notFoundRoute = this.routes.get('*') || this.routes.get('/404');
        if (notFoundRoute) {
            notFoundRoute.handler({ path });
        } else {
            console.error('404: Route not found:', path);
            // Fallback to home
            this.navigate('/');
        }
    }

    /**
     * Handle route errors
     * @param {Error} error - Route error
     */
    handleRouteError(error) {
        console.error('Route error:', error);
        // Could navigate to error page or show error message
    }

    /**
     * Get all registered routes
     * @returns {Map} Map of all routes
     */
    getRoutes() {
        return new Map(this.routes);
    }

    /**
     * Check if a route exists
     * @param {string} path - Path to check
     * @returns {boolean} True if route exists
     */
    hasRoute(path) {
        return this.routes.has(path);
    }

    /**
     * Get current path
     * @returns {string} Current path
     */
    getCurrentPath() {
        return this.parseCurrentHash().path;
    }

    /**
     * Get current query parameters
     * @returns {Object} Current query parameters
     */
    getCurrentQueryParams() {
        return this.parseCurrentHash().queryParams;
    }

    /**
     * Build URL with parameters
     * @param {string} path - Base path
     * @param {Object} params - Path parameters
     * @param {Object} queryParams - Query parameters
     * @returns {string} Built URL
     */
    buildUrl(path, params = {}, queryParams = {}) {
        let url = path;

        // Replace path parameters
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });

        // Add query parameters
        const queryString = Object.keys(queryParams)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
            .join('&');

        if (queryString) {
            url += `?${queryString}`;
        }

        return url;
    }

    /**
     * Navigate with parameters
     * @param {string} path - Path template
     * @param {Object} params - Path parameters
     * @param {Object} queryParams - Query parameters
     * @param {Object} options - Navigation options
     */
    navigateWithParams(path, params = {}, queryParams = {}, options = {}) {
        const url = this.buildUrl(path, params, queryParams);
        this.navigate(url, options);
    }

    /**
     * Reload current route
     */
    reload() {
        this.handleHashChange();
    }

    /**
     * Get navigation history
     * @returns {Array} Navigation history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear navigation history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * Set route guards (middleware)
     * @param {string} path - Route path
     * @param {Function} guard - Guard function
     */
    addGuard(path, guard) {
        const route = this.routes.get(path);
        if (route) {
            route.guards = route.guards || [];
            route.guards.push(guard);
        }
    }

    /**
     * Execute route guards
     * @param {Object} route - Route object
     * @param {Object} params - Route parameters
     * @param {Object} queryParams - Query parameters
     * @returns {boolean} True if all guards pass
     */
    async executeGuards(route, params, queryParams) {
        if (!route.guards || route.guards.length === 0) {
            return true;
        }

        for (const guard of route.guards) {
            try {
                const result = await guard(params, queryParams);
                if (!result) {
                    return false;
                }
            } catch (error) {
                console.error('Route guard error:', error);
                return false;
            }
        }

        return true;
    }

    /**
     * Add route change listener
     * @param {Function} callback - Callback function to call on route change
     */
    onRouteChange(callback) {
        if (typeof callback === 'function') {
            this.routeChangeListeners.push(callback);
        }
    }

    /**
     * Remove route change listener
     * @param {Function} callback - Callback function to remove
     */
    removeRouteChangeListener(callback) {
        this.routeChangeListeners = this.routeChangeListeners.filter(
            listener => listener !== callback
        );
    }

    /**
     * Notify all route change listeners
     * @param {string} newPath - New route path
     * @param {string} oldPath - Previous route path
     */
    notifyRouteChangeListeners(newPath, oldPath) {
        this.routeChangeListeners.forEach(callback => {
            try {
                callback(newPath, oldPath);
            } catch (error) {
                console.error('Error in route change listener:', error);
            }
        });
    }

    /**
     * Destroy router and clean up event listeners
     */
    destroy() {
        window.removeEventListener('hashchange', this.handleHashChange);
        window.removeEventListener('popstate', this.handlePopState);
        this.routes.clear();
        this.clearHistory();
        this.routeChangeListeners = [];
    }
}

// Export for use in other modules
window.Router = Router;


