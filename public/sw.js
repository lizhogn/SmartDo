const CACHE_NAME = 'smartdo-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.css',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache First Strategy for static assets
    if (url.origin === self.location.origin || url.href.includes('cdn')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then(fetchResponse => {
                    // Optional: Cache new requests dynamically
                    return fetchResponse;
                });
            })
        );
    }
});
