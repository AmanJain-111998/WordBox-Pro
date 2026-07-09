const CACHE_NAME = 'gamebox-pro-v5.6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './words.js',
  './crosswords.js',
  './sudokus.js',
  './app.js',
  './manifest.json',
  './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js'
];

// Install Event - Precache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Stale-While-Revalidate strategy
// Returns cached assets instantly for offline reliability, while updating cache in background when online
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background to update cache for next time
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const url = new URL(event.request.url);
            if (url.protocol.startsWith('http')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
        }).catch(() => { /* Ignore background fetch failures (offline) */ });

        return cachedResponse;
      }

      // Fallback for directory root requests in case caches.match failed to normalize
      const url = new URL(event.request.url);
      if (url.pathname.endsWith('/')) {
        return caches.match(url.pathname + 'index.html', { ignoreSearch: true }).then((fallbackResponse) => {
          if (fallbackResponse) return fallbackResponse;
          return fetch(event.request);
        });
      }

      // Fallback for requests not in cache
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
          const url = new URL(event.request.url);
          if (url.protocol.startsWith('http')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      });
    })
  );
});
