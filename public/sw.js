const CACHE_NAME = 'jjs-manage-cache-v1';
const ASSETS_TO_CACHE = [
  '/login',
  '/icon-192.png',
  '/icon-512.png',
  '/logojjsmanage.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/maskable-icon.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
];

// Install Event - Pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll, but wrap with a promise that catches failures
      // to prevent service worker install failure if a page/asset isn't available
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to pre-cache asset: ${url}`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Explicitly delete cached '/' response to immediately fix installed PWAs
      // that are showing "Site cannot be reached" due to a cached redirect response.
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.delete('/');
      });
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve cached assets when offline, update cache in background
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET requests, API routes, hot-reload, and internal next.js development assets
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/__nextjs') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-While-Revalidate: serve cached version, fetch and cache the new version in the background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silently catch fetch errors (e.g. when offline)
          });
        return cachedResponse;
      }

      // If not cached, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Cache static assets dynamically (images, fonts, stylesheets, scripts)
          const isStaticAsset =
            url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/) ||
            url.pathname.startsWith('/_next/static/');

          if (response && response.status === 200 && isStaticAsset && !response.redirected) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch((err) => {
          // If network fetch fails (e.g. offline) and not in cache, fallback to login if it's a navigation request
          if (event.request.mode === 'navigate') {
            return caches.match('/login').then((loginResponse) => {
              return loginResponse || Response.error();
            });
          }
          return Response.error();
        });
    })
  );
});
