// Service Worker for PWA
const CACHE_NAME = 'flightpro-v3'; // Incremented to clear old cache
const urlsToCache = [
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Service worker cache addAll failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for:
  // - API routes
  // - Admin routes (should always be fresh)
  // - Home page
  // - Next.js internal routes (_next)
  // - Non-GET requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin/') ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname.startsWith('/_next/') ||
    event.request.method !== 'GET'
  ) {
    // Always fetch fresh from network, don't use cache
    event.respondWith(
      fetch(event.request).catch((err) => {
        // Suppress "Failed to fetch" errors - these are expected during:
        // - Auth sync (401, 404 responses)
        // - Network interruptions
        // - CORS issues in development
        // The actual API endpoints handle their own error responses
        // Only log if it's not a "Failed to fetch" error (which is usually expected)
        if (err.name !== 'TypeError' || err.message !== 'Failed to fetch') {
          console.warn('Service worker: Unexpected fetch error:', err);
        }
        // Return a basic error response instead of failing completely
        return new Response('Network error', {
          status: 408,
          statusText: 'Request Timeout',
        });
      })
    );
    return;
  }
  
  // For other routes, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      // Fetch from network and cache successful responses
      return fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                console.warn('Service worker cache put failed:', err);
              });
            });
          }
          return response;
        })
        .catch((err) => {
          // Suppress "Failed to fetch" errors - these are expected during normal operation
          // The actual API endpoints handle their own error responses
          if (err.name !== 'TypeError' || err.message !== 'Failed to fetch') {
            console.warn('Service worker: Unexpected fetch error:', err);
          }
          // Return a basic error response
          return new Response('Network error', {
            status: 408,
            statusText: 'Request Timeout',
          });
        });
    })
  );
});

