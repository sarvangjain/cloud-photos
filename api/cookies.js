import { cors, verifyAuth, db } from './_lib/firebase.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  try {
    const uid = await verifyAuth(req);

    if (req.method === 'POST') {
      const { cookies } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (!cookies?.['session-id']) return res.status(400).json({ error: 'Missing cookies' });
      await db.collection('users').doc(uid).set({ amazonCookies: cookies, updatedAt: new Date() }, { merge: true });
      return res.json({ success: true });
    }

    if (req.method === 'DELETE') {
      await db.collection('users').doc(uid).set({ amazonCookies: null }, { merge: true });
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(err.message === 'Unauthorized' ? 401 : 500).json({ error: err.message });
  }
}
