// Service Worker for PWA - Notifications + Offline Support
const CACHE_NAME = 'sltr-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const CORE_ASSETS = [
  '/',
  '/app',
  '/messages',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Message';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'message-notification',
    data: {
      url: data.url || '/messages',
      conversationId: data.conversationId
    },
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action, event.notification.data);

  event.notification.close();

  if (event.action === 'dismiss' || event.action === 'close') {
    return;
  }

  const notificationData = event.notification.data || {};
  let path = notificationData.url || '/messages';

  if (notificationData.conversationId) {
    path = `/messages/${notificationData.conversationId}`;
  }

  // Normalize to same-origin absolute URL (prevents open redirect)
  let urlToOpen;
  try {
    urlToOpen = new URL(path, self.location.origin).toString();
  } catch {
    urlToOpen = new URL('/messages', self.location.origin).toString();
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus a client already at the target URL
        for (const client of clientList) {
          if (client.url && urlToOpen && client.url.startsWith(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Focus any same-origin client and instruct it to navigate
        for (const client of clientList) {
          if (client.url && client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
            return client.focus();
          }
        }
        // Open a new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// Handle background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // This would sync pending messages when back online
  console.log('Syncing messages...');
}

// Fetch handler - Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone response before caching
        const responseToCache = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('📦 Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            // If requesting a page, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return offline response for other resources
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
