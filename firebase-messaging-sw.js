// firebase-messaging-sw.js
// Service Worker — background notifications jab browser band ho

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

// ─── Background push handler ───────────────────────────────
messaging.onBackgroundMessage(payload => {
  const data  = payload.data || {};
  const type  = data.type || 'message';

  if (type === 'call') {
    // CALL notification — with Accept / Decline buttons
    self.registration.showNotification(
      `${data.callType === 'video' ? '📹' : '📞'} Incoming ${data.callType === 'video' ? 'Video' : 'Voice'} Call`,
      {
        body:             `${data.sender} is calling in ${data.roomName}`,
        icon:             '/icon-192.png',
        badge:            '/badge-72.png',
        tag:              'call-' + data.roomId,
        renotify:         true,
        requireInteraction: true,   // IMPORTANT: stays on screen until user acts
        vibrate:          [300,100,300,100,300],
        actions: [
          { action: 'decline', title: '📵 Decline' },
          { action: 'accept',  title: data.callType === 'video' ? '📹 Accept' : '📞 Accept' },
        ],
        data: { type:'call', roomId: data.roomId, callId: data.callId, callType: data.callType },
      }
    );
  } else {
    // MESSAGE notification
    self.registration.showNotification(
      `${data.sender} · ${data.roomName}`,
      {
        body:     data.text || '🔒 New message',
        icon:     '/icon-192.png',
        badge:    '/badge-72.png',
        tag:      'msg-' + data.roomId,
        renotify: true,
        vibrate:  [200, 100, 200],
        data:     { type:'message', roomId: data.roomId },
      }
    );
  }
});

// ─── Notification tap / button click handler ───────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const d = event.notification.data || {};

  if (event.action === 'decline') {
    // User declined call — just close, do nothing
    return;
  }

  // Accept call OR tapped on any notification → open/focus app
  // Pass roomId + callId in URL so app auto-handles it
  let url = '/';
  if (d.type === 'call' && d.callId) {
    url = `/?callId=${d.callId}&callType=${d.callType || 'voice'}&roomId=${d.roomId}`;
  } else if (d.roomId) {
    url = `/?roomId=${d.roomId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // If app tab already open — focus it
      for (const c of list) {
        if (c.url.includes(self.location.origin)) {
          c.postMessage({ type: 'NOTIF_ACTION', action: event.action || 'open', data: d });
          return c.focus();
        }
      }
      // Else open new tab
      return clients.openWindow(url);
    })
  );
});

// ─── Fallback push event ───────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch(e) { return; }
  const data = payload.data || {};
  const type = data.type || 'message';

  event.waitUntil(
    type === 'call'
      ? self.registration.showNotification(
          `${data.callType === 'video' ? '📹' : '📞'} Incoming Call`,
          {
            body: `${data.sender} is calling in ${data.roomName}`,
            icon: '/icon-192.png', badge: '/badge-72.png',
            tag: 'call-' + data.roomId, renotify: true, requireInteraction: true,
            vibrate: [300,100,300,100,300],
            actions: [
              {action:'decline', title:'📵 Decline'},
              {action:'accept',  title: data.callType==='video'?'📹 Accept':'📞 Accept'},
            ],
            data: {type:'call', roomId:data.roomId, callId:data.callId, callType:data.callType},
          }
        )
      : self.registration.showNotification(
          `${data.sender} · ${data.roomName}`,
          {
            body: data.text || '🔒 New message',
            icon: '/icon-192.png', badge: '/badge-72.png',
            tag: 'msg-' + data.roomId, renotify: true, vibrate: [200,100,200],
            data: {type:'message', roomId: data.roomId},
          }
        )
  );
});
