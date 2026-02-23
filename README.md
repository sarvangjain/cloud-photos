# CloudPhotos

A personal PWA to capture photos and store them in your Amazon Photos account.

## Architecture

```
CloudPhotos/
├── client/          ← React + Vite + Tailwind (PWA)
│   └── src/
│       ├── components/   (Gallery, Camera, Sidebar, etc.)
│       ├── hooks/        (useAuth, useIsMobile, useInstallPrompt)
│       └── services/     (Firebase auth, Cloud Functions API)
│
├── functions/       ← Firebase Cloud Functions (serverless backend)
│   ├── index.js         (HTTP endpoints)
│   └── amazonPhotos.js  (Amazon Photos API service)
│
├── firebase.json    ← Firebase config (hosting + functions + firestore)
└── firestore.rules  ← Security rules
```

**No local server needed.** The backend runs as Firebase Cloud Functions.

## Setup

### 1. Install
```bash
npm run install:all
```

### 2. Deploy Cloud Functions + Firestore Rules
```bash
firebase login
npm run deploy:functions
npm run deploy:rules
```

> ⚠️ Cloud Functions require the **Blaze (pay-as-you-go)** plan because they make outbound network requests to Amazon. You won't be charged unless you exceed free tier limits (2M invocations/month).

### 3. Get Amazon Cookies
1. Open [Amazon Photos](https://www.amazon.com/photos) → Log in
2. DevTools (F12) → Application → Cookies
3. Copy: `session-id`, `ubid-main`, `at-main`
4. You'll paste these in the app after signing in with Google

### 4. Run (development)
```bash
npm run dev
```
Opens at http://localhost:5173. Functions run from the deployed URL.

### 5. Deploy Everything
```bash
npm run deploy
```

## Features
- 🔐 Google Sign-In (Firebase Auth)
- 📸 Camera capture with front/back switch
- ☁️ Upload to Amazon Photos
- 🖼️ Browse gallery with date grouping + infinite scroll
- 📱 Mobile-first PWA (installable, offline shell)
- 🖥️ Desktop sidebar layout
- 🔒 Cookies stored in Firestore (server-side only, not readable by client)
