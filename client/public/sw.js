const CACHE_NAME = 'cloudphotos-v2';

// Shell assets — will be populated during build
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
];

// Install: precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('SW: precache partial failure', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Skip cross-origin
  if (url.origin !== self.location.origin) return;

  // API calls: network only (contains auth'd content)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first, fallback to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the navigation response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets (JS, CSS, images): stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);

      const fetchPromise = fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Network failed, return cached if available
          return cached;
        });

      // Return cached immediately, update in background
      return cached || fetchPromise;
    })
  );
});

// Handle push notifications (future)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CloudPhotos', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-32.png',
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
