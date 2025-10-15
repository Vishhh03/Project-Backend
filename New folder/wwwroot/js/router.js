// Simple Router

const Router = {
    routes: {},
    currentRoute: null,

    // Initialize router
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    // Add route
    add(path, handler) {
        this.routes[path] = handler;
    },

    // Navigate to route
    navigate(path) {
        window.location.hash = path;
    },

    // Handle route change
    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, ...params] = hash.split('/').filter(Boolean);
        const route = '/' + (path || '');

        this.currentRoute = route;

        // Find matching route
        let handler = this.routes[route];
        
        // Check for parameterized routes
        if (!handler) {
            for (const [routePath, routeHandler] of Object.entries(this.routes)) {
                if (routePath.includes(':')) {
                    const routeParts = routePath.split('/');
                    const hashParts = hash.split('/');
                    
                    if (routeParts.length === hashParts.length) {
                        const match = routeParts.every((part, i) => {
                            return part.startsWith(':') || part === hashParts[i];
                        });
                        
                        if (match) {
                            handler = routeHandler;
                            // Extract params
                            const paramObj = {};
                            routeParts.forEach((part, i) => {
                                if (part.startsWith(':')) {
                                    paramObj[part.slice(1)] = hashParts[i];
                                }
                            });
                            params.push(paramObj);
                            break;
                        }
                    }
                }
            }
        }

        if (handler) {
            try {
                await handler(...params);
                Utils.scrollToTop();
            } catch (error) {
                console.error('Route handler error:', error);
                Utils.showToast('An error occurred', 'error');
            }
        } else {
            this.navigate('/');
        }
    },

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }
};
