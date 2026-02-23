import admin from 'firebase-admin';

// Initialize Firebase Admin (no service account needed for token verification if we use project ID)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

/**
 * Express middleware to verify Firebase ID tokens.
 * Attaches `req.uid` and `req.user` on success.
 */
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
