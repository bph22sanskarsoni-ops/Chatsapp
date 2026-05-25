# QuickChat — Setup Guide 🚀

Ye guide follow karke apna QuickChat app 30 minute mein live kar sakte ho!

---

## Kya milega tujhe

| Feature | Status |
|---|---|
| Room create karna (unique 6-digit code) | ✅ |
| Room join karna with code | ✅ |
| Invalid code → error message | ✅ |
| Naam puchna before join | ✅ |
| "X has joined the chat 👋" system message | ✅ |
| Real-time messaging | ✅ |
| Phone close karne ke baad bhi room yaad rehna | ✅ |
| Background push notifications | ✅ |
| Free hosting | ✅ |

---

## Step 1 — Firebase Project Banana

1. Ja [console.firebase.google.com](https://console.firebase.google.com)
2. **"Add Project"** click kar → naam de → "QuickChat"
3. Google Analytics OFF kar → **"Create project"**

---

## Step 2 — Realtime Database Enable Karna

1. Left sidebar mein **"Build → Realtime Database"**
2. **"Create Database"** → location: `us-central1` (default)
3. Mode: **"Start in test mode"** (baad mein rules update karenge)
4. **"Enable"** click kar

---

## Step 3 — Firebase Config Copy Karna

1. Project ka gear icon ⚙️ → **"Project settings"**
2. Scroll down → **"Your apps"** section
3. **Web icon `</>`** click kar → app naam "quickchat" → **"Register app"**
4. Ek `firebaseConfig` object dikhega — **ye copy karke rakh**

`index.html` mein `FB_CONFIG` wala section replace kar:
```js
const FB_CONFIG = {
  apiKey:            "AIzaSy...",         // ← apna paste karo
  authDomain:        "quickchat-xxx.firebaseapp.com",
  databaseURL:       "https://quickchat-xxx-default-rtdb.firebaseio.com",
  projectId:         "quickchat-xxx",
  storageBucket:     "quickchat-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};
```

**Same config `firebase-messaging-sw.js` mein bhi paste karo!**

---

## Step 4 — VAPID Key Lena (Push Notifications ke liye)

1. Project Settings → **"Cloud Messaging"** tab
2. Scroll down → **"Web Push certificates"**
3. **"Generate key pair"** click kar
4. Jo key generate ho — copy kar
5. `index.html` mein ye line update kar:
```js
const VAPID_KEY = "BPY...abcd";  // ← apni key yahan
```

---

## Step 5 — Database Rules Set Karna

1. Firebase Console → Realtime Database → **"Rules"** tab
2. Ye paste kar aur **"Publish"**:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "messages": { ".read": true, ".write": true },
        "tokens":   { ".read": true, ".write": true }
      }
    }
  }
}
```

---

## Step 6 — Firebase CLI Install karna (Notifications ke liye)

Node.js install hona chahiye. Phir:
```bash
npm install -g firebase-tools
firebase login
```

`quickchat/` folder mein ja:
```bash
cd quickchat
firebase init
```
Options select karo:
- ✅ Hosting
- ✅ Functions
- ✅ Database

Existing project select karo → apna "QuickChat" project.

---

## Step 7 — Cloud Function Deploy Karna

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Ye Cloud Function automatically push notifications bhejega jab bhi koi message aaye!

---

## Step 8 — GitHub Pages pe Host Karna

### Option A: Firebase Hosting (Recommended — Notifications fully work)
```bash
firebase deploy --only hosting
```
Tera app live ho jayega: `https://quickchat-xxx.web.app`

### Option B: GitHub Pages (Notifications work karein — HTTPS chahiye)
1. GitHub pe new repo banao: `quickchat`
2. Ye files push karo:
   ```
   index.html
   firebase-messaging-sw.js
   database.rules.json
   ```
3. Repo Settings → Pages → Branch: `main`, folder: `/root`
4. URL milega: `https://YOUR_USERNAME.github.io/quickchat`

**Recommendation:** Firebase Hosting use karo — same Google infrastructure, notifications better kaam karte hain, aur `.web.app` domain free milta hai.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Messages nahi aa rahe | `databaseURL` check karo in config |
| Notifications nahi aa rahe | VAPID key check karo, HTTPS pe hona chahiye |
| "Invalid code" sahi message chal raha hai? | Haan, Firebase se verify hota hai |
| Room yaad nahi reh raha | localStorage clear karo ya Private/Incognito mode mein test mat karo |
| Service Worker register nahi ho raha | HTTPS chahiye (localhost pe bhi kaam karta hai) |

---

## Folder Structure

```
quickchat/
├── index.html               ← Main app (edit karke Firebase config daal)
├── firebase-messaging-sw.js ← Background notifications (same config yahan bhi)
├── database.rules.json      ← Database security rules
├── firebase.json            ← Firebase hosting config
├── functions/
│   ├── index.js             ← Cloud Function (push notifications)
│   └── package.json
└── README.md                ← Ye file
```

---

## Quick Links

- Firebase Console: https://console.firebase.google.com
- Firebase Docs: https://firebase.google.com/docs
- GitHub Pages: https://pages.github.com

---

Made with ❤️ — QuickChat
