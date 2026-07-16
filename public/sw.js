// Zaria Service Worker

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const { title, message, data } = payload

    const options = {
      body: message || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: data || {},
      actions: [
        { action: 'open', title: 'View' },
        { action: 'close', title: 'Dismiss' }
      ],
      requireInteraction: true,
      tag: data?.requestId || 'default'
    }

    event.waitUntil(
      self.registration.showNotification(title || 'Zaria', options)
    )
  } catch (err) {
    // Plain text notification fallback
    event.waitUntil(
      self.registration.showNotification('Zaria', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png'
      })
    )
  }
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})