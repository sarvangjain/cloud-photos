import { cors, verifyAuth, getCookies } from './_lib/firebase.js';
import { AmazonPhotosService } from './_lib/amazonPhotos.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    if (!cookies) return res.status(401).json({ error: 'Amazon not connected' });

    const svc = new AmazonPhotosService(cookies);
    const { nodeId, type, tempLink } = req.query;

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

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
