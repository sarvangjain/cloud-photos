import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { verifyFirebaseToken } from './middleware/auth.js';
import { AmazonPhotosService } from './amazonPhotos.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ---------- Cookie encryption helpers ----------
const ALGO = 'aes-256-gcm';
const ENC_KEY = crypto.scryptSync(process.env.COOKIE_ENCRYPTION_KEY || 'default-dev-key-change-in-prod!!', 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, ENC_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(text) {
  const [ivHex, tagHex, encrypted] = text.split(':');
  const decipher = crypto.createDecipheriv(ALGO, ENC_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ---------- Cookie storage (per-user, file-based) ----------
function getCookiePath(uid) {
  return path.join(DATA_DIR, `${uid}.enc`);
}

function loadCookies(uid) {
  const p = getCookiePath(uid);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(decrypt(fs.readFileSync(p, 'utf8')));
  } catch {
    return null;
  }
}

function saveCookies(uid, cookies) {
  fs.writeFileSync(getCookiePath(uid), encrypt(JSON.stringify(cookies)));
}

function deleteCookies(uid) {
  const p = getCookiePath(uid);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// ---------- Amazon Photos service cache (per-user) ----------
const services = new Map();

function getService(uid) {
  if (services.has(uid)) return services.get(uid);
  const cookies = loadCookies(uid);
  if (!cookies) return null;
  const svc = new AmazonPhotosService(cookies);
  services.set(uid, svc);
  return svc;
}

// ---------- Routes ----------

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Save Amazon cookies
app.post('/api/amazon/cookies', verifyFirebaseToken, (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies || !cookies['session-id']) {
      return res.status(400).json({ error: 'Missing required cookies (session-id, ubid-main, at-main)' });
    }
    saveCookies(req.uid, cookies);
    services.delete(req.uid); // Clear cached service
    res.json({ success: true });
  } catch (err) {
    console.error('Save cookies error:', err);
    res.status(500).json({ error: 'Failed to save cookies' });
  }
});

// Check if Amazon cookies are configured
app.get('/api/amazon/status', verifyFirebaseToken, (req, res) => {
  const cookies = loadCookies(req.uid);
  res.json({ connected: !!cookies });
});

// Disconnect Amazon
app.delete('/api/amazon/cookies', verifyFirebaseToken, (req, res) => {
  deleteCookies(req.uid);
  services.delete(req.uid);
  res.json({ success: true });
});

// Get account usage
app.get('/api/amazon/usage', verifyFirebaseToken, async (req, res) => {
  try {
    const svc = getService(req.uid);
    if (!svc) return res.status(401).json({ error: 'Amazon not connected' });
    const usage = await svc.getUsage();
    res.json(usage);
  } catch (err) {
    console.error('Usage error:', err);
    res.status(500).json({ error: 'Failed to get usage info' });
  }
});

// List/search photos
app.get('/api/amazon/photos', verifyFirebaseToken, async (req, res) => {
  try {
    const svc = getService(req.uid);
    if (!svc) return res.status(401).json({ error: 'Amazon not connected' });
    const { query, sort, offset, limit } = req.query;
    const photos = await svc.searchPhotos({
      query: query || 'type:(PHOTOS)',
      sort: sort || "['createdDate DESC']",
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 50,
    });
    res.json(photos);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search photos' });
  }
});

// Get thumbnail/image URL (proxy to avoid CORS)
app.get('/api/amazon/photo/:nodeId', verifyFirebaseToken, async (req, res) => {
  try {
    const svc = getService(req.uid);
    if (!svc) return res.status(401).json({ error: 'Amazon not connected' });
    const { nodeId } = req.params;
    const { type, tempLink } = req.query; // type: 'thumbnail' or 'full'

    let imageBuffer;
    // Try tempLink first if provided (pre-signed, most reliable)
    if (tempLink) {
      try {
        const viewBox = type === 'full' ? '' : '?viewBox=600';
        imageBuffer = await svc.downloadFromTempLink(tempLink + viewBox);
      } catch {
        // Fall back to node-based download
        imageBuffer = await svc.downloadPhoto(nodeId, type || 'thumbnail');
      }
    } else {
      imageBuffer = await svc.downloadPhoto(nodeId, type || 'thumbnail');
    }

    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: 'Failed to download photo' });
  }
});

// Upload photo
app.post('/api/amazon/upload', verifyFirebaseToken, upload.single('photo'), async (req, res) => {
  try {
    const svc = getService(req.uid);
    if (!svc) return res.status(401).json({ error: 'Amazon not connected' });

    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    console.log(`[Upload] Received file: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

    const filename = req.body.filename || `CloudPhotos_${Date.now()}.jpg`;
    const result = await svc.uploadPhoto(req.file.buffer, filename, req.file.mimetype);
    res.json(result);
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to upload photo' });
  }
});

app.listen(PORT, () => {
  console.log(`☁️  CloudPhotos server running on http://localhost:${PORT}`);
});
