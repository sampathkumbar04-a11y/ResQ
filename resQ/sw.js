const CACHE_NAME = 'resq-cache-v1';
const MAP_CACHE_NAME = 'resq-map-tiles-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './assets/css/style.css',
    './assets/js/app.js',
    './assets/logo.jpg',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/lucide@latest'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened static cache');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== MAP_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Network interception
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Handle Map Tiles (openstreetmap.org)
    // Strategy: Cache First, fallback to Network (and then cache it for future offline use)
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(MAP_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse; // Return from cache if found
                    }
                    // If not in cache, fetch from network and cache it
                    return fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => {
                        // Offline and tile not cached. Provide a fallback or let it fail gracefully.
                        return new Response('Offline Tile Not Found', { status: 503, statusText: 'Service Unavailable' });
                    });
                });
            })
        );
        return;
    }

    // 2. Handle Static Assets and App Files
    // Strategy: Network First, fallback to Cache (ensures app logic updates)
    event.respondWith(
        fetch(event.request).then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
