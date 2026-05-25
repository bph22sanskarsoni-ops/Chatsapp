// ═══════════════════════════════════════════════════════════════
//  firebase-messaging-sw.js
//  ⚠️  Replace Firebase config below with your own project config
// ═══════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Same config as in index.html
firebase.initializeApp({
  apiKey:            "AIzaSyDNhKKQVUZapEMS5Dq2LaSXlVe6qPkHQpI",
  authDomain:        "chatsapp-khush.firebaseapp.com",
  databaseURL:       "https://chatsapp-khush-default-rtdb.firebaseio.com",
  projectId:         "chatsapp-khush",
  storageBucket:     "chatsapp-khush.firebasestorage.app",
  messagingSenderId: "794097187007",
  appId:             "1:794097187007:web:65a7d1724006c25d53ae0a"
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || payload.data?.sender || 'QuickChat';
  const body  = payload.notification?.body  || payload.data?.text   || 'New message';
  const roomId = payload.data?.roomId || '';

  self.registration.showNotification(title, {
    body,
    icon:  '/icon-192.png',
    badge: '/badge-72.png',
    tag:   'quickchat-' + roomId,         // group by room
    renotify: true,
    data: { roomId },
  });
});

// Click on notification → open/focus app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = self.location.origin + '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.startsWith(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
