/**
 * Service Worker for FinalDestination Application
 * 
 * Provides offline functionality, caching, background sync, and push notifications
 * for improved performance and user experience.
 */

const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `finaldestination-v${CACHE_VERSION}`;
const STATIC_CACHE = `finaldestination-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `finaldestination-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `finaldestination-api-v${CACHE_VERSION}`;

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/responsive.css',
    '/css/accessibility.css',
    '/css/performance.css',
    '/js/app.js',
    '/js/config/app-config.js',
    '/js/config/build-config.js',
    '/js/config/production-config.js',
    '/js/utils/api-client.js',
    '/js/utils/router.js',
    '/js/utils/storage-service.js',
    '/js/utils/state-manager.js',
    '/js/utils/event-bus.js',
    '/js/utils/component-integration.js',
    '/js/utils/app-lifecycle.js',
    '/js/utils/bundle-optimizer.js',
    '/js/utils/error-handler.js',
    '/js/utils/offline-manager.js',
    '/js/utils/validator.js',
    '/js/services/auth-service.js',
    '/js/services/hotel-service.js',
    '/js/services/booking-service.js',
    '/js/services/payment-service.js',
    '/js/services/review-service.js',
    '/js/services/loyalty-service.js',
    '/js/services/admin-service.js',
    '/js/services/notification-service.js',
    '/js/components/auth/login-component.js',
    '/js/components/auth/register-component.js',
    '/js/components/hotels/hotel-list-component.js',
    '/js/components/hotels/hotel-detail-component.js',
    '/js/components/hotels/hotel-search-component.js',
    '/js/components/bookings/booking-form-component.js',
    '/js/components/bookings/booking-list-component.js',
    '/js/components/bookings/enhanced-booking-form-component.js',
    '/js/models/user.js',
    '/js/models/hotel.js',
    '/js/models/booking.js',
    '/js/models/payment.js',
    '/js/models/review.js',
    '/js/models/loyalty.js',
    '/assets/icons/logo.svg',
    '/offline.html'
];

// API endpoints to cache with different strategies
const API_CACHE_CONFIG = {
    // Cache for longer periods (hotels don't change often)
    longTerm: {
        patterns: [/\/api\/hotels$/, /\/api\/hotels\/\d+$/],
        maxAge: 3600000 // 1 hour
    },
    // Cache for shorter periods (reviews change more frequently)
    shortTerm: {
        patterns: [/\/api\/reviews/, /\/api\/hotels\/\d+\/reviews/],
        maxAge: 300000 // 5 minutes
    },
    // Don't cache sensitive endpoints
    noCache: {
        patterns: [
            /\/api\/auth/,
            /\/api\/payments/,
            /\/api\/bookings\/\d+\/cancel/,
            /\/api\/admin/
        ]
    }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing service worker v${CACHE_VERSION}...`);
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            }),
            // Create other caches
            caches.open(DYNAMIC_CACHE),
            caches.open(API_CACHE)
        ])
        .then(() => {
            console.log('[SW] All caches created and static assets cached');
            return self.skipWaiting();
        })
        .catch((error) => {
            console.error('[SW] Failed to install service worker:', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete caches that don't match current version
                        if (!cacheName.includes(CACHE_VERSION)) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests for caching
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
    } else if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticRequest(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    return STATIC_ASSETS.some(asset => 
        pathname === asset || 
        pathname.endsWith(asset) ||
        pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
    );
}

/**
 * Handle API requests with intelligent caching
 */
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const cacheConfig = getCacheConfigForUrl(url.pathname);
    
    // Don't cache sensitive endpoints
    if (cacheConfig.type === 'noCache') {
        return fetch(request);
    }
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Check if cached response is still valid
    if (cachedResponse && isCacheValid(cachedResponse, cacheConfig.maxAge)) {
        console.log('[SW] Serving API response from cache:', request.url);
        
        // Fetch in background to update cache
        fetchAndUpdateCache(request, cache);
        
        return cachedResponse;
    }
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses with timestamp
            const responseToCache = networkResponse.clone();
            responseToCache.headers.set('sw-cached-at', Date.now().toString());
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);
        
        // Fallback to cache even if expired
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for API requests
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'This feature is not available offline'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Get cache configuration for URL
 */
function getCacheConfigForUrl(pathname) {
    for (const [type, config] of Object.entries(API_CACHE_CONFIG)) {
        if (config.patterns && config.patterns.some(pattern => pattern.test(pathname))) {
            return { type, maxAge: config.maxAge };
        }
    }
    
    // Default to short-term caching
    return { type: 'shortTerm', maxAge: API_CACHE_CONFIG.shortTerm.maxAge };
}

/**
 * Check if cached response is still valid
 */
function isCacheValid(response, maxAge) {
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return false;
    
    const age = Date.now() - parseInt(cachedAt);
    return age < maxAge;
}

/**
 * Fetch and update cache in background
 */
async function fetchAndUpdateCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const responseToCache = response.clone();
            responseToCache.headers.set('sw-cached-at', Date.now().toString());
            cache.put(request, responseToCache);
        }
    } catch (error) {
        console.log('[SW] Background cache update failed:', error);
    }
}

/**
 * Handle static requests with cache-first strategy
 */
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If not in cache, fetch from network and cache
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] Failed to fetch static asset:', request.url);
        
        // Return offline page for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            return cache.match('/offline.html') || new Response('Offline', { status: 503 });
        }
        
        throw error;
    }
}

/**
 * Handle dynamic requests with network-first strategy
 */
async function handleDynamicRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);
        
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            return cache.match('/offline.html') || new Response('Offline', { status: 503 });
        }
        
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case 'background-sync':
            event.waitUntil(doBackgroundSync());
            break;
        case 'sync-bookings':
            event.waitUntil(syncPendingBookings());
            break;
        case 'sync-reviews':
            event.waitUntil(syncPendingReviews());
            break;
        default:
            console.log('[SW] Unknown sync tag:', event.tag);
    }
});

/**
 * Perform background sync
 */
async function doBackgroundSync() {
    console.log('[SW] Performing background sync...');
    
    try {
        await Promise.all([
            syncPendingBookings(),
            syncPendingReviews(),
            updateCachedData()
        ]);
        
        console.log('[SW] Background sync completed');
        
        // Notify clients of sync completion
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: Date.now()
            });
        });
        
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

/**
 * Sync pending bookings
 */
async function syncPendingBookings() {
    const pendingBookings = await getPendingData('bookings');
    
    for (const booking of pendingBookings) {
        try {
            await syncBooking(booking);
            await removePendingData('bookings', booking.id);
            console.log('[SW] Synced booking:', booking.id);
        } catch (error) {
            console.error('[SW] Failed to sync booking:', error);
        }
    }
}

/**
 * Sync pending reviews
 */
async function syncPendingReviews() {
    const pendingReviews = await getPendingData('reviews');
    
    for (const review of pendingReviews) {
        try {
            await syncReview(review);
            await removePendingData('reviews', review.id);
            console.log('[SW] Synced review:', review.id);
        } catch (error) {
            console.error('[SW] Failed to sync review:', error);
        }
    }
}

/**
 * Update cached data
 */
async function updateCachedData() {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    // Update hotel data
    const hotelRequests = requests.filter(req => req.url.includes('/api/hotels'));
    for (const request of hotelRequests) {
        await fetchAndUpdateCache(request, cache);
    }
}

/**
 * Get pending data from IndexedDB
 */
async function getPendingData(type) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FinalDestinationOffline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([type], 'readonly');
            const store = transaction.objectStore(type);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(type)) {
                db.createObjectStore(type, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Remove pending data from IndexedDB
 */
async function removePendingData(type, id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FinalDestinationOffline', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

/**
 * Sync booking to server
 */
async function syncBooking(booking) {
    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${booking.token}`
        },
        body: JSON.stringify(booking.data)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to sync booking: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Sync review to server
 */
async function syncReview(review) {
    const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${review.token}`
        },
        body: JSON.stringify(review.data)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to sync review: ${response.status}`);
    }
    
    return response.json();
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    let notificationData = {
        title: 'FinalDestination',
        body: 'You have a new notification',
        icon: '/assets/icons/logo.svg',
        badge: '/assets/icons/badge.png'
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            notificationData.body = event.data.text();
        }
    }
    
    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        vibrate: [100, 50, 100],
        data: notificationData.data || {},
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/assets/icons/view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/icons/close.png'
            }
        ],
        requireInteraction: notificationData.requireInteraction || false,
        silent: notificationData.silent || false
    };
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        const urlToOpen = event.notification.data.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_VERSION });
            break;
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
        default:
            console.log('[SW] Unknown message type:', event.data.type);
    }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
        event.waitUntil(updateCachedData());
    }
});

console.log(`[SW] Service worker v${CACHE_VERSION} script loaded`);


