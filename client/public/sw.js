// Service Worker for offline support and caching
const CACHE_NAME = 'gigconnect-v1';
const STATIC_CACHE = 'gigconnect-static-v1';
const DYNAMIC_CACHE = 'gigconnect-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // API requests - network first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response and cache it
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }
  
  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((fetchResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});

// Background sync for pending actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-gigs') {
    event.waitUntil(syncGigs());
  }
});

async function syncGigs() {
  try {
    // Retrieve pending actions from IndexedDB and sync with server
    console.log('[SW] Syncing pending gigs...');
    // Implementation would go here
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Gig Available';
  const options = {
    body: data.body || 'Check out new gig opportunities',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'view', title: 'View Gig' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});
