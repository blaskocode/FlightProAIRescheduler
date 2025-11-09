// Service Worker for PWA
// Version: Increment this to force service worker update
const CACHE_NAME = 'flightpro-v4'; // Incremented to clear old cache and force update
const urlsToCache = [
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v4...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('[SW] Cache addAll failed:', err);
      });
    })
  );
  // Force activation of new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v4...');
  event.waitUntil(
    Promise.all([
      // Delete all old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
  console.log('[SW] Service worker v4 activated');
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRITICAL: Don't intercept ANY Next.js routes or API calls
  // Let the browser/Next.js handle these natively
  // This prevents service worker from interfering with Next.js routing
  const shouldIgnore = 
    // Next.js internal files
    url.pathname.startsWith('/_next/') ||
    // API routes
    url.pathname.startsWith('/api/') ||
    // Main pages (Next.js handles routing)
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname.match(/^\/(login|signup|dashboard|flights|profile|discovery|admin|settings)/) ||
    // Next.js page files
    url.pathname.endsWith('/page.js') ||
    url.pathname.endsWith('/page.tsx') ||
    // Non-GET requests
    event.request.method !== 'GET' ||
    // Development mode - don't cache anything
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (shouldIgnore) {
    // Don't intercept at all - let browser/Next.js handle natively
    return;
  }
  
  // Only cache static assets (images, fonts, etc.) in production
  // For development, we've already returned above
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      // Fetch from network
      return fetch(event.request)
        .then((response) => {
          // Only cache successful GET responses for static assets
          if (response.status === 200 && event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Silently fail - caching is optional
              });
            });
          }
          return response;
        })
        .catch(() => {
          // If fetch fails, just let it fail naturally
          // Don't return error responses that might confuse Next.js
          throw new Error('Network request failed');
        });
    })
  );
});

