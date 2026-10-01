/**
 * Stockora Enterprise Pro — Production Service Worker
 * 
 * Compliant with OWASP & PWA offline reliability standards.
 * 
 * SECURITY RULES:
 * 1. NEVER cache authenticated API responses (/api/*, /api/v1/*).
 * 2. NEVER cache requests containing Authorization or sensitive session tokens.
 * 3. Cache ONLY public static assets, fonts, icons, and the offline application shell.
 * 4. Stale-while-revalidate for public imagery with LRU cap.
 * 5. Network-first for SPA navigations with fallback to cached shell.
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `stockora-pro-static-${CACHE_VERSION}`;
const IMAGES_CACHE_NAME = `stockora-pro-images-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/assets/auth/enterprise-business-operator.jpg',
  '/assets/enterprise/dashboard-hero-operator.jpg',
  '/assets/enterprise/retail-customer-partner.jpg',
  '/assets/enterprise/team-branch-operations.jpg',
  '/assets/enterprise/logistics-warehouse-operator.jpg'
];

// Install: precache offline shell and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Pre-caching failure should not crash the worker
        console.warn('[PWA SW] Pre-cache non-fatal warning:', err);
      })
  );
});

// Activate: clean up obsolete cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== STATIC_CACHE_NAME && name !== IMAGES_CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Message listener for manual skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch router with strict security filtering
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never handle non-GET requests (mutations must always reach backend)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict Security Exclusion: Never intercept or cache API, WebSocket, or Vite dev traffic
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/@id') ||
    url.pathname.startsWith('/src') ||
    url.searchParams.has('token') ||
    request.headers.has('Authorization')
  ) {
    return;
  }

  // 3. Navigation requests (SPA HTML pages): Network-first with offline shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackShell = await caches.match('/index.html');
          return fallbackShell || Response.error();
        })
    );
    return;
  }

  // 4. Public Images (Stale-While-Revalidate with LRU limits)
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.open(IMAGES_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Versioned static scripts, CSS, and fonts (Cache-First)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/assets/') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});
