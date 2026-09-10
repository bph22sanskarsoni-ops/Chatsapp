// ═══════════════════════════════════════════════════════
//  firebase-messaging-sw.js — Chatsapp Service Worker
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

// ── Background FCM push ──────────────────────────────────────────────────────
messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  const type = data.type || 'message';

  if (type === 'call') {
    self.registration.showNotification(
      `${data.callType === 'video' ? '📹' : '📞'} Incoming Call`,
      {
        body: `${data.sender} is calling in ${data.roomName}`,
        icon: '/icon-192.png', badge: '/badge-72.png',
        tag: 'call-' + data.roomId, renotify: true, requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: 'decline', title: '📵 Decline' },
          { action: 'accept',  title: data.callType === 'video' ? '📹 Accept' : '📞 Accept' },
        ],
        data: { type: 'incomingCall', roomId: data.roomId, callId: data.callId, callType: data.callType },
      }
    );
  } else {
    self.registration.showNotification(
      `${data.sender} · ${data.roomName}`,
      {
        body: data.text || '🔒 New message',
        icon: '/icon-192.png', badge: '/badge-72.png',
        tag: 'msg-' + data.roomId, renotify: true, vibrate: [200, 100, 200],
        data: { type: 'message', roomId: data.roomId },
      }
    );
  }
});

// ── Notification click handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  const d      = event.notification.data || {};
  const action = event.action;

  // Active call notification — Mute / Cam Off / End buttons
  if (event.notification.tag === 'chatsapp-active-call') {
    event.notification.close();

    if (action === 'end' || action === 'mic' || action === 'cam') {
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
          // Send control action to main page
          list.forEach(c => c.postMessage({ type: 'CALL_CTRL', action }));
          // Focus app for non-end actions so notification can update
          if (action !== 'end' && list.length) return list[0].focus();
        })
      );
      return;
    }

    // Tapped notification body → focus app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        if (list.length) return list[0].focus();
        return clients.openWindow('/');
      })
    );
    return;
  }

  // Incoming call — Accept / Decline
  if (d.type === 'incomingCall') {
    event.notification.close();
    if (action === 'decline') return;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        if (list.length) {
          list[0].postMessage({ type: 'NOTIF_ACTION', action: 'accept', data: d });
          return list[0].focus();
        }
        return clients.openWindow(`/?callId=${d.callId}&callType=${d.callType||'voice'}&roomId=${d.roomId}`);
      })
    );
    return;
  }

  // Message notification → open app
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

// ── Fallback push handler ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let payload; try { payload = event.data.json(); } catch(e) { return; }
  const data = payload.data || {};

  event.waitUntil(
    data.type === 'call'
      ? self.registration.showNotification(`${data.callType==='video'?'📹':'📞'} Incoming Call`, {
          body:`${data.sender} is calling in ${data.roomName}`,
          icon:'/icon-192.png',badge:'/badge-72.png',
          tag:'call-'+data.roomId,renotify:true,requireInteraction:true,vibrate:[300,100,300,100,300],
          actions:[{action:'decline',title:'📵 Decline'},{action:'accept',title:data.callType==='video'?'📹 Accept':'📞 Accept'}],
          data:{type:'incomingCall',roomId:data.roomId,callId:data.callId,callType:data.callType},
        })
      : self.registration.showNotification(`${data.sender} · ${data.roomName}`, {
          body:data.text||'🔒 New message',
          icon:'/icon-192.png',badge:'/badge-72.png',
          tag:'msg-'+data.roomId,renotify:true,vibrate:[200,100,200],
          data:{type:'message',roomId:data.roomId},
        })
  );
});
