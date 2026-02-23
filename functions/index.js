import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import Busboy from 'busboy';
import { AmazonPhotosService } from './amazonPhotos.js';

initializeApp();
const db = getFirestore();

// ============== HELPERS ==============

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function handleCors(req, res) {
  const origin = req.headers.origin || '*';
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => res.set(k, v));
  if (req.method === 'OPTIONS') { res.status(204).send(''); return true; }
  return false;
}

async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = auth.split('Bearer ')[1];
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

async function getCookies(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return doc.data().amazonCookies || null;
}

function getService(cookies) {
  return new AmazonPhotosService(cookies);
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let fileInfo = {};

    busboy.on('field', (name, val) => { fields[name] = val; });
    busboy.on('file', (name, stream, info) => {
      fileInfo = info;
      const chunks = [];
      stream.on('data', (d) => chunks.push(d));
      stream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });
    busboy.on('finish', () => resolve({ fields, fileBuffer, fileInfo }));
    busboy.on('error', reject);

    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  });
}

// ============== CLOUD FUNCTIONS ==============

// --- Save cookies ---
export const saveCookies = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const { cookies } = JSON.parse(req.body || '{}');
    if (!cookies?.['session-id']) return res.status(400).json({ error: 'Missing cookies' });
    await db.collection('users').doc(uid).set({ amazonCookies: cookies, updatedAt: new Date() }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    console.error('saveCookies:', err.message);
    res.status(err.message === 'Unauthorized' ? 401 : 500).json({ error: err.message });
  }
});

// --- Check connection status ---
export const amazonStatus = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    res.json({ connected: !!cookies });
  } catch (err) {
    res.status(err.message === 'Unauthorized' ? 401 : 500).json({ error: err.message });
  }
});

// --- Disconnect ---
export const disconnectAmazon = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    await db.collection('users').doc(uid).update({ amazonCookies: null });
    res.json({ success: true });
  } catch (err) {
    res.status(err.message === 'Unauthorized' ? 401 : 500).json({ error: err.message });
  }
});

// --- Search photos ---
export const searchPhotos = onRequest({ cors: false, region: 'us-central1', timeoutSeconds: 30 }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });
    const svc = getService(cookies);
    const { query, sort, offset, limit } = req.query;
    const result = await svc.searchPhotos({
      query: query || 'type:(PHOTOS)',
      sort: sort || "['createdDate DESC']",
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 50,
    });
    res.json(result);
  } catch (err) {
    console.error('searchPhotos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Download/proxy photo ---
export const getPhoto = onRequest({ cors: false, region: 'us-central1', timeoutSeconds: 60, memory: '512MiB' }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });

    const svc = getService(cookies);
    // Extract nodeId from path: /getPhoto?nodeId=xxx or /getPhoto/xxx
    const nodeId = req.query.nodeId || req.path.split('/').pop();
    const { type, tempLink } = req.query;

    let imageBuffer;
    if (tempLink) {
      try {
        const viewBox = type === 'full' ? '' : '?viewBox=600';
        imageBuffer = await svc.downloadFromTempLink(tempLink + viewBox);
      } catch {
        imageBuffer = await svc.downloadPhoto(nodeId, type || 'thumbnail');
      }
    } else {
      imageBuffer = await svc.downloadPhoto(nodeId, type || 'thumbnail');
    }

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (err) {
    console.error('getPhoto:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Upload photo ---
export const uploadPhoto = onRequest({ cors: false, region: 'us-central1', timeoutSeconds: 120, memory: '512MiB' }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });

    const { fields, fileBuffer, fileInfo } = await parseMultipart(req);
    if (!fileBuffer) return res.status(400).json({ error: 'No file provided' });

    const svc = getService(cookies);
    const filename = fields.filename || `CloudPhotos_${Date.now()}.jpg`;
    const result = await svc.uploadPhoto(fileBuffer, filename, fileInfo.mimeType || 'image/jpeg');
    res.json(result);
  } catch (err) {
    console.error('uploadPhoto:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Get usage ---
export const getUsage = onRequest({ cors: false, region: 'us-central1' }, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });
    const svc = getService(cookies);
    const usage = await svc.getUsage();
    res.json(usage);
  } catch (err) {
    console.error('getUsage:', err.message);
    res.status(500).json({ error: err.message });
  }
});
