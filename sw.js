// ════════════════════════════════════════════════════════════════════════════
// MIIA Service Worker — PWA Support (Network-First for HTML)
// (c) 2024-2026 Mariano De Stefano. All rights reserved.
// ════════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'miia-v2';
const STATIC_ASSETS = [
  '/miia-logo.svg',
  '/miia-logo.png',
  '/favicon.svg',
  '/manifest.json'
];

// Install: cache only static assets (NOT HTML)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets (v2)');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: NETWORK-FIRST for everything, cache as fallback only
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      // Cache successful GET responses for offline fallback
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Offline: try cache
      return caches.match(event.request);
    })
  );
});
