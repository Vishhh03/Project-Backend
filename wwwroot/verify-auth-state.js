/**
 * Verification script for authentication state management
 * This script tests the core functionality of the AuthStateManager
 */

// Test configuration
const TEST_CONFIG = {
    verbose: true,
    testTimeout: 5000
};

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function log(message, type = 'info') {
    if (TEST_CONFIG.verbose) {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

function assert(condition, message) {
    testResults.total++;
    if (condition) {
        testResults.passed++;
        testResults.details.push({ test: message, result: 'PASS' });
        log(`✓ ${message}`, 'success');
    } else {
        testResults.failed++;
        testResults.details.push({ test: message, result: 'FAIL' });
        log(`✗ ${message}`, 'error');
    }
}

async function runTests() {
    log('Starting Authentication State Management Tests', 'info');
    
    try {
        // Test 1: Service Initialization
        log('Test 1: Service Initialization', 'info');
        const authService = new AuthService();
        const router = new Router();
        const authStateManager = new AuthStateManager();
        
        assert(authService instanceof AuthService, 'AuthService instantiated correctly');
        assert(router instanceof Router, 'Router instantiated correctly');
        assert(authStateManager instanceof AuthStateManager, 'AuthStateManager instantiated correctly');
        
        // Test 2: AuthStateManager Initialization
        log('Test 2: AuthStateManager Initialization', 'info');
        await authStateManager.initialize(authService, router);
        assert(authStateManager.isInitialized, 'AuthStateManager initialized successfully');
        
        // Test 3: Initial Authentication State
        log('Test 3: Initial Authentication State', 'info');
        const initialAuthState = authStateManager.isAuthenticated();
        assert(typeof initialAuthState === 'boolean', 'isAuthenticated returns boolean');
        assert(initialAuthState === false, 'Initial state is not authenticated (expected for fresh session)');
        
        // Test 4: Protected Routes Configuration
        log('Test 4: Protected Routes Configuration', 'info');
        assert(authStateManager.isProtectedRoute('/bookings'), '/bookings is protected');
        assert(authStateManager.isProtectedRoute('/loyalty'), '/loyalty is protected');
        assert(authStateManager.isProtectedRoute('/profile'), '/profile is protected');
        assert(authStateManager.isProtectedRoute('/admin'), '/admin is protected');
        assert(!authStateManager.isProtectedRoute('/'), '/ is not protected');
        assert(!authStateManager.isProtectedRoute('/hotels'), '/hotels is not protected');
        assert(!authStateManager.isProtectedRoute('/login'), '/login is not protected');
        
        // Test 5: Route Access Without Authentication
        log('Test 5: Route Access Without Authentication', 'info');
        assert(authStateManager.hasRouteAccess('/', null), 'Public route accessible without auth');
        assert(authStateManager.hasRouteAccess('/hotels', null), 'Hotels route accessible without auth');
        assert(authStateManager.hasRouteAccess('/login', null), 'Login route accessible without auth');
        assert(!authStateManager.hasRouteAccess('/bookings', null), 'Protected route not accessible without auth');
        
        // Test 6: Route Access With Mock User
        log('Test 6: Route Access With Mock User', 'info');
        const mockGuestUser = { role: 1, name: 'Test Guest', email: 'guest@test.com' };
        const mockAdminUser = { role: 3, name: 'Test Admin', email: 'admin@test.com' };
        
        assert(authStateManager.hasRouteAccess('/bookings', mockGuestUser), 'Guest can access bookings');
        assert(authStateManager.hasRouteAccess('/loyalty', mockGuestUser), 'Guest can access loyalty');
        assert(!authStateManager.hasRouteAccess('/admin', mockGuestUser), 'Guest cannot access admin');
        assert(authStateManager.hasRouteAccess('/admin', mockAdminUser), 'Admin can access admin');
        
        // Test 7: Auth State Listeners
        log('Test 7: Auth State Listeners', 'info');
        let listenerCalled = false;
        let listenerArgs = null;
        
        const testListener = (isAuthenticated, user) => {
            listenerCalled = true;
            listenerArgs = { isAuthenticated, user };
        };
        
        authStateManager.onAuthStateChange(testListener);
        
        // Simulate auth state change by calling the handler directly
        authStateManager.handleAuthStateChange(true, mockGuestUser);
        
        assert(listenerCalled, 'Auth state listener was called');
        assert(listenerArgs.isAuthenticated === true, 'Listener received correct auth state');
        assert(listenerArgs.user === mockGuestUser, 'Listener received correct user data');
        
        // Test 8: Listener Removal
        log('Test 8: Listener Removal', 'info');
        authStateManager.removeAuthStateListener(testListener);
        listenerCalled = false;
        authStateManager.handleAuthStateChange(false, null);
        assert(!listenerCalled, 'Removed listener was not called');
        
        // Test 9: Current User Retrieval
        log('Test 9: Current User Retrieval', 'info');
        const currentUser = authStateManager.getCurrentUser();
        assert(currentUser === null || typeof currentUser === 'object', 'getCurrentUser returns null or object');
        
        // Test 10: Route Management
        log('Test 10: Route Management', 'info');
        const testRoute = '/test-route';
        authStateManager.addProtectedRoute(testRoute);
        assert(authStateManager.isProtectedRoute(testRoute), 'Added protected route is recognized');
        
        authStateManager.removeProtectedRoute(testRoute);
        assert(!authStateManager.isProtectedRoute(testRoute), 'Removed protected route is no longer recognized');
        
        // Test 11: Role-based Route Management
        log('Test 11: Role-based Route Management', 'info');
        const testRoleRoute = '/test-role-route';
        authStateManager.addRoleBasedRoute(testRoleRoute, [2, 3]); // Manager and Admin only
        
        assert(!authStateManager.hasRouteAccess(testRoleRoute, mockGuestUser), 'Guest cannot access manager/admin route');
        assert(authStateManager.hasRouteAccess(testRoleRoute, mockAdminUser), 'Admin can access manager/admin route');
        
        authStateManager.removeRoleBasedRoute(testRoleRoute);
        
        // Test 12: Browser Event Listeners Setup
        log('Test 12: Browser Event Listeners Setup', 'info');
        // This test verifies that event listeners are set up without errors
        // The actual functionality would need browser interaction to test fully
        assert(typeof authStateManager.checkAuthOnVisibilityChange === 'function', 'Visibility change handler exists');
        assert(typeof authStateManager.checkAuthOnFocus === 'function', 'Focus handler exists');
        
        log('All tests completed!', 'info');
        
    } catch (error) {
        log(`Test execution error: ${error.message}`, 'error');
        testResults.failed++;
        testResults.total++;
        testResults.details.push({ test: 'Test Execution', result: 'FAIL', error: error.message });
    }
    
    // Print results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\nFailed Tests:');
        testResults.details
            .filter(detail => detail.result === 'FAIL')
            .forEach(detail => {
                console.log(`- ${detail.test}${detail.error ? ': ' + detail.error : ''}`);
            });
    }
    
    return testResults.failed === 0;
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    window.runAuthStateTests = runTests;
} else if (typeof module !== 'undefined') {
    module.exports = { runTests };
}

// Auto-run if this script is loaded directly in browser
if (typeof window !== 'undefined' && window.location.pathname.includes('verify-auth-state')) {
    window.addEventListener('load', () => {
        setTimeout(runTests, 1000); // Give time for other scripts to load
    });
}


