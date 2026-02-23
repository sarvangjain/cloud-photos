import { cors, verifyAuth, getCookies } from './_lib/firebase.js';
import { AmazonPhotosService } from './_lib/amazonPhotos.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });
    const svc = new AmazonPhotosService(cookies);
    res.json(await svc.getUsage());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
