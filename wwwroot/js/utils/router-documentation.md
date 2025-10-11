# Router Service Documentation

## Overview

The Router service provides Single Page Application (SPA) navigation functionality with hash-based routing, parameter extraction, and browser history management. It's designed to be lightweight, flexible, and ready for future Angular migration.

## Features

- ✅ Hash-based routing with parameter extraction
- ✅ Browser history management with back/forward support
- ✅ Route guards (middleware) support
- ✅ Query parameter parsing
- ✅ URL building with parameters
- ✅ Programmatic navigation
- ✅ Route matching with regex patterns
- ✅ Event-driven architecture
- ✅ Memory management and cleanup

## Basic Usage

### 1. Initialize Router

```javascript
const router = new Router();
```

### 2. Register Routes

```javascript
// Simple route
router.addRoute('/', () => {
    console.log('Home page loaded');
});

// Route with parameters
router.addRoute('/hotels/:id', (params) => {
    console.log(`Hotel ID: ${params.id}`);
});

// Route with query parameters
router.addRoute('/search', (params, queryParams) => {
    console.log(`Search query: ${queryParams.q}`);
});
```

### 3. Navigate

```javascript
// Simple navigation
router.navigate('/hotels');

// Navigation with parameters
router.navigateWithParams('/hotels/:id', { id: '123' });

// Navigation with query parameters
router.navigate('/search?q=luxury&city=paris');
```

## API Reference

### Constructor

```javascript
new Router()
```

Creates a new router instance and initializes event listeners.

### Route Management

#### `addRoute(path, handler, options)`

Registers a new route.

- `path` (string): Route path pattern (supports `:param` syntax)
- `handler` (function): Route handler function
- `options` (object): Optional route configuration

```javascript
router.addRoute('/users/:id', (params, queryParams) => {
    // Handle route
}, { requireAuth: true });
```

#### `removeRoute(path)`

Removes a registered route.

```javascript
router.removeRoute('/users/:id');
```

#### `hasRoute(path)`

Checks if a route is registered.

```javascript
if (router.hasRoute('/users/:id')) {
    // Route exists
}
```

### Navigation

#### `navigate(path, options)`

Navigates to a specific path.

- `path` (string): Target path
- `options` (object): Navigation options
  - `replace` (boolean): Replace current history entry
  - `state` (object): State object for history

```javascript
router.navigate('/hotels/123', { replace: true });
```

#### `navigateWithParams(path, params, queryParams, options)`

Navigates with parameter substitution.

```javascript
router.navigateWithParams(
    '/hotels/:id', 
    { id: '123' }, 
    { tab: 'reviews' }
);
```

#### `back()`

Navigates back in history.

```javascript
router.back();
```

#### `forward()`

Navigates forward in history.

```javascript
router.forward();
```

### Route Information

#### `getCurrentRoute()`

Gets current route information.

```javascript
const current = router.getCurrentRoute();
// Returns: { path, route, params, queryParams }
```

#### `getCurrentPath()`

Gets current path.

```javascript
const path = router.getCurrentPath();
```

#### `getCurrentQueryParams()`

Gets current query parameters.

```javascript
const queryParams = router.getCurrentQueryParams();
```

### History Management

#### `canGoBack()`

Checks if navigation back is possible.

```javascript
if (router.canGoBack()) {
    router.back();
}
```

#### `canGoForward()`

Checks if navigation forward is possible.

```javascript
if (router.canGoForward()) {
    router.forward();
}
```

#### `getHistory()`

Gets navigation history.

```javascript
const history = router.getHistory();
```

#### `clearHistory()`

Clears navigation history.

```javascript
router.clearHistory();
```

### Route Guards

#### `addGuard(path, guard)`

Adds a route guard (middleware).

```javascript
router.addGuard('/admin', (params, queryParams) => {
    return user.isAdmin; // Return true to allow, false to block
});
```

### Utility Methods

#### `buildUrl(path, params, queryParams)`

Builds URL with parameters.

```javascript
const url = router.buildUrl('/users/:id', { id: '123' }, { tab: 'profile' });
// Returns: '/users/123?tab=profile'
```

#### `parseQueryString(queryString)`

Parses query string into object.

```javascript
const params = router.parseQueryString('name=John&age=30');
// Returns: { name: 'John', age: '30' }
```

#### `reload()`

Reloads current route.

```javascript
router.reload();
```

#### `destroy()`

Cleans up router and removes event listeners.

```javascript
router.destroy();
```

## Route Patterns

### Simple Routes

```javascript
router.addRoute('/home', handler);
router.addRoute('/about', handler);
```

### Parameterized Routes

```javascript
router.addRoute('/users/:id', handler);
router.addRoute('/posts/:postId/comments/:commentId', handler);
```

### Wildcard Routes

```javascript
router.addRoute('*', handler); // Catch-all route
```

## Event Handling

The router automatically handles:

- `hashchange` events for navigation
- `popstate` events for browser back/forward
- Route parameter extraction
- Query parameter parsing
- History management

## Error Handling

The router includes built-in error handling for:

- Route handler errors
- Invalid routes (404)
- Guard failures
- Navigation errors

## Best Practices

1. **Register routes early**: Set up all routes during application initialization
2. **Use route guards**: Implement authentication and authorization checks
3. **Handle 404s**: Always register a wildcard route for unmatched paths
4. **Clean up**: Call `destroy()` when the router is no longer needed
5. **Parameter validation**: Validate route parameters in handlers
6. **Error boundaries**: Implement error handling in route handlers

## Example: Complete Setup

```javascript
// Initialize router
const router = new Router();

// Register routes
router.addRoute('/', () => loadHomePage());
router.addRoute('/hotels', () => loadHotelsPage());
router.addRoute('/hotels/:id', (params) => loadHotelDetail(params.id));
router.addRoute('/login', () => loadLoginPage());
router.addRoute('*', () => show404Page());

// Add authentication guard
router.addGuard('/bookings', () => {
    return authService.isAuthenticated();
});

// Handle navigation
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const path = e.target.getAttribute('href').substring(1);
        router.navigate(path);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    router.destroy();
});
```

## Migration to Angular

The Router service is designed with Angular migration in mind:

- Service-based architecture maps to Angular services
- Route configuration is similar to Angular Router
- Guard pattern matches Angular route guards
- Observable patterns can be easily added

When migrating to Angular:

1. Convert Router class to Angular service
2. Replace hash routing with Angular Router
3. Convert guards to Angular route guards
4. Use Angular's dependency injection




