// ═══════════════════════════════════════════════════════
//  firebase-messaging-sw.js  —  Chatsapp Service Worker
//  Handles background push notifications (browser closed)
// ═══════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

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

// ── Background push handler (browser closed/tab hidden) ──
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);

  const data     = payload.data     || {};
  const notif    = payload.notification || {};
  const sender   = notif.title || data.sender || 'Someone';
  const body     = notif.body  || data.text   || 'New message';
  const roomId   = data.roomId || '';
  const roomName = data.roomName || roomId;

  // Rich notification with sender, message, and room name
  self.registration.showNotification(`${sender} · ${roomName}`, {
    body:      body,
    icon:      '/icon-192.png',
    badge:     '/badge-72.png',
    tag:       'chatsapp-' + roomId,   // group per room
    renotify:  true,                    // always notify even if same tag
    silent:    false,
    vibrate:   [200, 100, 200],        // vibration pattern
    data:      { roomId, url: '/' },
    actions: [
      { action: 'open',    title: '💬 Open' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ]
  });
});

// ── Notification click → open / focus app ──
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = self.location.origin + '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // If app already open in a tab — focus it
      for (const client of list) {
        if (client.url.startsWith(url) && 'focus' in client) return client.focus();
      }
      // Else open new tab
      return clients.openWindow(url);
    })
  );
});

// ── Push event fallback (if onBackgroundMessage doesn't fire) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch(e) { return; }

  const data     = payload.data     || {};
  const notif    = payload.notification || {};
  const sender   = notif.title || data.sender || 'Someone';
  const body     = notif.body  || data.text   || 'New message';
  const roomId   = data.roomId || '';
  const roomName = data.roomName || roomId;

  event.waitUntil(
    self.registration.showNotification(`${sender} · ${roomName}`, {
      body,
      icon:     '/icon-192.png',
      badge:    '/badge-72.png',
      tag:      'chatsapp-' + roomId,
      renotify: true,
      vibrate:  [200, 100, 200],
      data:     { roomId, url: '/' }
    })
  );
});
