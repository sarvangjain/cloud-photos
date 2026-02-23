import { cors, verifyAuth, getCookies } from './_lib/firebase.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const uid = await verifyAuth(req);
    const cookies = await getCookies(uid);
    res.json({ connected: !!cookies });
  } catch (err) {
    res.status(err.message === 'Unauthorized' ? 401 : 500).json({ error: err.message });
  }
}
