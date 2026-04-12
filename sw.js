// ════════════════════════════════════════════════════════════════════════════
// MIIA Service Worker — PWA Support (Network-First for HTML)
// (c) 2024-2026 Mariano De Stefano. All rights reserved.
// ════════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'miia-v3';
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

// Fetch: HTML always from network (NEVER cache). Static assets: network-first with cache fallback.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // HTML pages: ALWAYS network, NEVER cache — prevents stale dashboard
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
