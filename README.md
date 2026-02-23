# CloudPhotos

A personal web app to capture photos via your device camera and store them in your Amazon Photos account.

## Features

- 🔐 Google Sign-In via Firebase Auth
- 📸 Camera capture (photo) with device camera
- ☁️ Upload photos directly to Amazon Photos
- 🖼️ Browse your Amazon Photos gallery with a fast, masonry-style UI
- 🔗 Amazon Photos integration via cookie-based authentication

## Prerequisites

- Node.js 18+
- An Amazon account with Amazon Photos
- A Firebase project with Google Auth enabled

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Google** sign-in under Authentication → Sign-in method
4. Go to Project Settings → General → Your apps → Add a web app
5. Copy the Firebase config and create `client/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Configure Server

Create `server/.env`:

```env
PORT=3001
FIREBASE_PROJECT_ID=your_project_id
COOKIE_ENCRYPTION_KEY=any-random-32-char-string-here!!
```

### 4. Get Amazon Photos Cookies

1. Open [Amazon Photos](https://www.amazon.com/photos) in your browser
2. Log in to your Amazon account
3. Open DevTools (F12) → Application → Cookies → `https://www.amazon.com`
4. Copy these cookies:
   - `ubid-main`
   - `at-main`  
   - `session-id`
5. You'll paste these into the app after logging in with Google

### 5. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   React Frontend    │────▶│   Express Backend    │
│   (Vite + Tailwind) │     │   (API Proxy)        │
│                     │     │                      │
│ • Firebase Auth     │     │ • Verify Firebase    │
│ • Camera Capture    │     │   tokens             │
│ • Gallery UI        │     │ • Proxy Amazon API   │
│ • Amazon Cookie     │     │   calls with cookies │
│   Setup             │     │ • Encrypt/store      │
└─────────────────────┘     │   cookies locally    │
                            └──────────┬───────────┘
                                       │
                            ┌──────────▼───────────┐
                            │   Amazon Photos      │
                            │   (Internal API)     │
                            │                      │
                            │ • Upload photos      │
                            │ • List/search        │
                            │ • Download/thumbs    │
                            └──────────────────────┘
```

## ⚠️ Disclaimer

This app uses **unofficial, reverse-engineered** Amazon Photos API endpoints. It is intended for **personal use only**. Amazon could change or block these endpoints at any time. Use at your own risk.
