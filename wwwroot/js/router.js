// Simple hash-based router
const Router = {
    routes: {},
    currentRoute: null,
    
    // Add route
    add(path, handler) {
        this.routes[path] = handler;
    },
    
    // Navigate to route
    navigate(path) {
        window.location.hash = path;
    },
    
    // Get current route
    getCurrentRoute() {
        return window.location.hash.slice(1) || '/';
    },
    
    // Handle route change
    handleRoute() {
        const path = this.getCurrentRoute();
        const [route, ...params] = path.split('/').filter(Boolean);
        const routePath = route ? `/${route}` : '/';
        
        // Update active nav link
        Utils.$$('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${routePath}`) {
                link.classList.add('active');
            }
        });
        
        // Find matching route
        let handler = this.routes[routePath];
        
        // Handle parameterized routes (e.g., /hotels/123)
        if (!handler && params.length > 0) {
            const paramRoute = `/${route}/:id`;
            handler = this.routes[paramRoute];
            if (handler) {
                return handler(params[0]);
            }
        }
        
        // Execute route handler
        if (handler) {
            this.currentRoute = routePath;
            handler();
        } else {
            this.show404();
        }
    },
    
    // Show 404 page
    show404() {
        const app = Utils.$('#app');
        app.innerHTML = `
            <div class="container">
                <div class="text-center">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="#/" class="btn btn-primary">Go Home</a>
                </div>
            </div>
        `;
    },
    
    // Initialize router
    init() {
        // Handle hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial load
        this.handleRoute();
    }
};