/**
 * Router Verification Script
 * Tests the Router class functionality without requiring a full application
 */

// Mock DOM elements for testing
const mockWindow = {
    location: { hash: '' },
    addEventListener: function(event, handler) {
        console.log(`Mock: Added event listener for ${event}`);
    },
    removeEventListener: function(event, handler) {
        console.log(`Mock: Removed event listener for ${event}`);
    }
};

const mockHistory = {
    back: function() { console.log('Mock: history.back() called'); },
    forward: function() { console.log('Mock: history.forward() called'); },
    replaceState: function(state, title, url) { 
        console.log(`Mock: history.replaceState called with ${url}`); 
    },
    length: 1
};

// Override global objects for testing
const originalWindow = typeof window !== 'undefined' ? window : undefined;
const originalHistory = typeof history !== 'undefined' ? history : undefined;

if (typeof window === 'undefined') {
    global.window = mockWindow;
    global.history = mockHistory;
}

/**
 * Test suite for Router functionality
 */
function runRouterTests() {
    console.log('=== Router Verification Tests ===\n');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    function test(name, testFn) {
        testsTotal++;
        try {
            console.log(`Testing: ${name}`);
            testFn();
            console.log('✅ PASSED\n');
            testsPassed++;
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}\n`);
        }
    }
    
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    // Test 1: Router instantiation
    test('Router instantiation', () => {
        const router = new Router();
        assert(router instanceof Router, 'Router should be instantiated');
        assert(router.routes instanceof Map, 'Router should have routes Map');
        assert(Array.isArray(router.history), 'Router should have history array');
        router.destroy();
    });
    
    // Test 2: Route registration
    test('Route registration', () => {
        const router = new Router();
        const handler = () => {};
        
        router.addRoute('/test', handler);
        assert(router.hasRoute('/test'), 'Route should be registered');
        assert(router.getRoutes().size === 1, 'Routes map should have one entry');
        
        router.removeRoute('/test');
        assert(!router.hasRoute('/test'), 'Route should be removed');
        assert(router.getRoutes().size === 0, 'Routes map should be empty');
        
        router.destroy();
    });
    
    // Test 3: Path to regex conversion
    test('Path to regex conversion', () => {
        const router = new Router();
        
        // Test simple path
        const simpleRegex = router.pathToRegex('/test');
        assert(simpleRegex.test('/test'), 'Simple path should match');
        assert(!simpleRegex.test('/test/extra'), 'Simple path should not match with extra');
        
        // Test parameterized path
        const paramRegex = router.pathToRegex('/users/:id');
        assert(paramRegex.test('/users/123'), 'Parameterized path should match');
        assert(!paramRegex.test('/users'), 'Parameterized path should not match without param');
        
        router.destroy();
    });
    
    // Test 4: Parameter extraction
    test('Parameter extraction', () => {
        const router = new Router();
        
        const paramNames = router.extractParamNames('/users/:id/posts/:postId');
        assert(paramNames.length === 2, 'Should extract two parameters');
        assert(paramNames.includes('id'), 'Should extract id parameter');
        assert(paramNames.includes('postId'), 'Should extract postId parameter');
        
        router.destroy();
    });
    
    // Test 5: Query string parsing
    test('Query string parsing', () => {
        const router = new Router();
        
        const params = router.parseQueryString('name=John&age=30&city=New%20York');
        assert(params.name === 'John', 'Should parse name parameter');
        assert(params.age === '30', 'Should parse age parameter');
        assert(params.city === 'New York', 'Should decode URL encoded values');
        
        const emptyParams = router.parseQueryString('');
        assert(Object.keys(emptyParams).length === 0, 'Should handle empty query string');
        
        router.destroy();
    });
    
    // Test 6: Route matching
    test('Route matching', () => {
        const router = new Router();
        
        router.addRoute('/users/:id', () => {});
        router.addRoute('/posts', () => {});
        
        const match1 = router.findRoute('/users/123');
        assert(match1 !== null, 'Should find matching route');
        assert(match1.params.id === '123', 'Should extract parameter value');
        
        const match2 = router.findRoute('/posts');
        assert(match2 !== null, 'Should find exact route match');
        
        const match3 = router.findRoute('/nonexistent');
        assert(match3 === null, 'Should return null for non-matching route');
        
        router.destroy();
    });
    
    // Test 7: URL building
    test('URL building', () => {
        const router = new Router();
        
        const url1 = router.buildUrl('/users/:id', { id: '123' });
        assert(url1 === '/users/123', 'Should build URL with parameters');
        
        const url2 = router.buildUrl('/search', {}, { q: 'test', page: '2' });
        assert(url2 === '/search?q=test&page=2', 'Should build URL with query parameters');
        
        const url3 = router.buildUrl('/users/:id', { id: '456' }, { tab: 'profile' });
        assert(url3 === '/users/456?tab=profile', 'Should build URL with both parameters and query');
        
        router.destroy();
    });
    
    // Test 8: History management
    test('History management', () => {
        const router = new Router();
        
        assert(router.getHistory().length === 0, 'History should start empty');
        
        router.addToHistory('/page1');
        router.addToHistory('/page2');
        router.addToHistory('/page3');
        
        assert(router.getHistory().length === 3, 'History should have 3 entries');
        assert(router.canGoBack(), 'Should be able to go back');
        
        router.clearHistory();
        assert(router.getHistory().length === 0, 'History should be cleared');
        assert(!router.canGoBack(), 'Should not be able to go back after clearing');
        
        router.destroy();
    });
    
    // Test 9: Route guards
    test('Route guards', () => {
        const router = new Router();
        let guardCalled = false;
        
        const guard = (params, queryParams) => {
            guardCalled = true;
            return true; // Allow navigation
        };
        
        router.addRoute('/protected', () => {});
        router.addGuard('/protected', guard);
        
        const route = router.routes.get('/protected');
        assert(route.guards && route.guards.length === 1, 'Guard should be added to route');
        
        router.destroy();
    });
    
    // Test 10: Hash parsing
    test('Hash parsing', () => {
        const router = new Router();
        
        // Mock window.location.hash
        if (typeof window !== 'undefined') {
            const originalHash = window.location.hash;
            window.location.hash = '#/users/123?tab=profile&sort=name';
            
            const parsed = router.parseCurrentHash();
            assert(parsed.path === '/users/123', 'Should parse path correctly');
            assert(parsed.queryParams.tab === 'profile', 'Should parse query parameters');
            assert(parsed.queryParams.sort === 'name', 'Should parse multiple query parameters');
            
            window.location.hash = originalHash;
        } else {
            // For Node.js environment, test the parsing logic directly
            const testHash = '/users/123?tab=profile&sort=name';
            const [path, queryString] = testHash.split('?');
            const queryParams = router.parseQueryString(queryString || '');
            
            assert(path === '/users/123', 'Should parse path correctly');
            assert(queryParams.tab === 'profile', 'Should parse query parameters');
            assert(queryParams.sort === 'name', 'Should parse multiple query parameters');
        }
        
        router.destroy();
    });
    
    // Print test results
    console.log('=== Test Results ===');
    console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
    console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed! Router implementation is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
    
    return testsPassed === testsTotal;
}

// Run tests if this script is executed directly
if (typeof module !== 'undefined' && require.main === module) {
    // Node.js environment
    const Router = require('./router.js');
    runRouterTests();
} else if (typeof window !== 'undefined' && window.Router) {
    // Browser environment
    runRouterTests();
} else {
    console.log('Router class not found. Make sure router.js is loaded first.');
}

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = { runRouterTests };
}


