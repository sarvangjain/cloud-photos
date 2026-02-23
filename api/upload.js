import { cors, verifyAuth, getCookies } from './_lib/firebase.js';
import { AmazonPhotosService } from './_lib/amazonPhotos.js';
import Busboy from 'busboy';

export const config = { api: { bodyParser: false } };

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
    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });

    const { fields, fileBuffer, fileInfo } = await parseMultipart(req);
    if (!fileBuffer) return res.status(400).json({ error: 'No file provided' });

    const svc = new AmazonPhotosService(cookies);
    const filename = fields.filename || `CloudPhotos_${Date.now()}.jpg`;
    const result = await svc.uploadPhoto(fileBuffer, filename, fileInfo.mimeType || 'image/jpeg');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
