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
  console.log('🔔 Push notification received:', event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Failed to parse push data:', e);
    // Fallback to text if JSON parsing fails
    data = { body: event.data?.text() || 'New notification' };
  }

  const title = data.title || 'SLTR';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/icon-192.png', // Use existing icon as badge
    tag: data.tag || 'message-notification',
    data: {
      url: data.url || '/messages',
      conversationId: data.conversationId,
      type: data.type || 'message'
    },
    requireInteraction: false,
    vibrate: [100, 50, 100], // Vibration pattern for mobile
    actions: [
      {
        action: 'open',
        title: 'Open'
        // Removed icon references that don't exist
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
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

  // Handle dismiss action - just close the notification
  if (event.action === 'dismiss' || event.action === 'close') {
    return;
  }

  // Determine URL to open based on notification type
  const notificationData = event.notification.data || {};
  let urlToOpen = notificationData.url || '/messages';

  // For conversation-specific notifications, go directly to that conversation
  if (notificationData.conversationId) {
    urlToOpen = `/messages/${notificationData.conversationId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open at this URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Check if there's any SLTR window open, and navigate it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen
            });
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
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
