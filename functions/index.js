// functions/index.js
// Deploy this with: firebase deploy --only functions
// ─────────────────────────────────────────────────────────────

const { onValueCreated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Fires whenever a new message is written to:
 *   /rooms/{roomId}/messages/{msgId}
 *
 * Sends an FCM push to every OTHER user in the room
 * who has registered their notification token.
 */
exports.notifyNewMessage = onValueCreated(
  "/rooms/{roomId}/messages/{msgId}",
  async (event) => {
    const msg    = event.data.val();
    const roomId = event.params.roomId;

    // Skip system messages
    if (!msg || msg.type === "system") return null;

    // Get all FCM tokens registered for this room
    const tokensSnap = await admin
      .database()
      .ref(`rooms/${roomId}/tokens`)
      .once("value");

    if (!tokensSnap.exists()) return null;

    // Collect tokens — skip the sender
    const tokens = [];
    tokensSnap.forEach(child => {
      if (child.key !== msg.userId) tokens.push(child.val());
    });

    if (tokens.length === 0) return null;

    // Build multicast message
    const multicastMsg = {
      tokens,
      notification: {
        title: msg.sender,
        body:  msg.text.length > 120 ? msg.text.substring(0, 117) + "…" : msg.text,
      },
      data: {
        roomId,
        sender: msg.sender,
        text:   msg.text,
        ts:     String(msg.ts),
      },
      webpush: {
        notification: {
          icon:  "/icon-192.png",
          badge: "/badge-72.png",
          tag:   "quickchat-" + roomId,
          renotify: true,
        },
        fcmOptions: {
          link: "/",
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(multicastMsg);
      console.log(
        `[FCM] Room ${roomId}: sent=${response.successCount}, failed=${response.failureCount}`
      );

      // Remove stale tokens (invalid / unregistered)
      const staleKeys = [];
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            const key = tokensSnap.val() && Object.keys(tokensSnap.val())[i];
            if (key) staleKeys.push(key);
          }
        }
      });

      if (staleKeys.length > 0) {
        const removes = staleKeys.map(k =>
          admin.database().ref(`rooms/${roomId}/tokens/${k}`).remove()
        );
        await Promise.all(removes);
        console.log(`[FCM] Removed ${staleKeys.length} stale token(s).`);
      }
    } catch (err) {
      console.error("[FCM] Error:", err);
    }

    return null;
  }
);
