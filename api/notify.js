// api/notify.js
// Vercel Serverless Function — FCM push sender
// Ye function message/call notifications bhejta hai browser band hone par bhi

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const FCM_KEY = process.env.FCM_SERVER_KEY;
  if (!FCM_KEY) return res.status(500).json({ error: 'FCM_SERVER_KEY not set in Vercel env' });

  const { tokens, type, sender, roomName, roomId, text, callType, callId } = req.body;

  if (!tokens || tokens.length === 0) return res.status(200).json({ sent: 0 });

  // Build notification payload based on type
  let notification, data;

  if (type === 'call') {
    // ─── CALL NOTIFICATION (with Accept/Decline buttons) ───
    notification = {
      title: `${callType === 'video' ? '📹' : '📞'} Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`,
      body: `${sender} is calling in ${roomName}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'call-' + roomId,
      renotify: true,
      requireInteraction: true,  // stays until user taps — important for calls
    };
    data = { type: 'call', roomId, roomName, callId, callType, sender };

  } else {
    // ─── MESSAGE NOTIFICATION ───
    const preview = text && text.length > 80 ? text.substring(0, 77) + '…' : (text || '🔒 New message');
    notification = {
      title: `${sender} · ${roomName}`,
      body: preview,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'msg-' + roomId,
      renotify: true,
    };
    data = { type: 'message', roomId, roomName, sender, text: preview };
  }

  // Send to every token
  const results = await Promise.allSettled(
    tokens.map(token =>
      fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${FCM_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          priority: 'high',
          notification,
          data,
          webpush: {
            notification: {
              ...notification,
              // Add Accept/Decline action buttons for calls
              ...(type === 'call' ? {
                actions: [
                  { action: 'decline', title: '📵 Decline' },
                  { action: 'accept',  title: `${callType === 'video' ? '📹' : '📞'} Accept` },
                ],
                vibrate: [300, 100, 300, 100, 300],
              } : {
                vibrate: [200, 100, 200],
              }),
            },
            fcm_options: { link: '/' },
          },
        }),
      })
    )
  );

  const sent     = results.filter(r => r.status === 'fulfilled').length;
  const failed   = results.filter(r => r.status === 'rejected').length;
  console.log(`[Notify] type=${type} sent=${sent} failed=${failed}`);

  return res.status(200).json({ sent, failed });
}
