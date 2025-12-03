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

// Allowed origins for safe navigation
const ALLOWED_ORIGINS = [
  'https://getsltr.com',
  'https://www.getsltr.com',
  'https://sltr.vercel.app'
];

// Check if running in development
const isDev = self.location.hostname === 'localhost' || 
              self.location.hostname === '127.0.0.1' ||
              self.location.hostname.endsWith('.local');

// Validate URL for safe navigation
function isValidNotificationUrl(url) {
  if (!url) return false;
  
  try {
    const parsed = new URL(url, self.location.origin);
    
    // Allow relative URLs (same origin)
    if (parsed.origin === self.location.origin) {
      return true;
    }
    
    // In development, allow localhost
    if (isDev && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return true;
    }
    
    // Check against allowed origins
    return ALLOWED_ORIGINS.includes(parsed.origin);
  } catch (e) {
    console.error('Invalid notification URL:', url);
    return false;
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get URL from notification data, default to messages
  let urlToOpen = event.notification.data?.url || '/messages';
  
  // Validate URL for security - prevent open redirect
  if (!isValidNotificationUrl(urlToOpen)) {
    console.warn('Blocked unsafe notification URL:', urlToOpen);
    urlToOpen = '/messages'; // Safe fallback
  }
  
  // Ensure URL is absolute for openWindow
  if (urlToOpen.startsWith('/')) {
    urlToOpen = self.location.origin + urlToOpen;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab with our app open
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen);
            
            // If same origin, navigate existing window
            if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
              // Navigate to the target path if different
              if (clientUrl.pathname !== targetUrl.pathname) {
                // Try to post message for client-side navigation
                // If client doesn't handle NAVIGATE, fall back to direct navigation
                try {
                  client.postMessage({
                    type: 'NAVIGATE',
                    url: targetUrl.pathname + targetUrl.search
                  });
                } catch (messageError) {
                  console.log('postMessage failed, client will handle via focus');
                }
              }
              return client.focus();
            }
          } catch (e) {
            console.error('Error checking client URL:', e);
          }
        }
        
        // Open new window if no existing window found
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
