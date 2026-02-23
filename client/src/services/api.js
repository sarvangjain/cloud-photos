import { getIdToken } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function authHeaders() {
  const token = await getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ---------- Amazon connection ----------

export async function getAmazonStatus() {
  return request('/api/amazon/status');
}

export async function saveAmazonCookies(cookies) {
  return request('/api/amazon/cookies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookies }),
  });
}

export async function disconnectAmazon() {
  return request('/api/amazon/cookies', { method: 'DELETE' });
}

// ---------- Photos ----------

export async function getUsage() {
  return request('/api/amazon/usage');
}

export async function searchPhotos({ query, sort, offset = 0, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (sort) params.set('sort', sort);
  params.set('offset', String(offset));
  params.set('limit', String(limit));
  return request(`/api/amazon/photos?${params}`);
}

export function getPhotoUrl(nodeId, type = 'thumbnail') {
  // Returns the proxy URL — auth token will be added by the img loader
  return `${API_BASE}/api/amazon/photo/${nodeId}?type=${type}`;
}

export async function uploadPhoto(file, filename) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append('photo', file);
  if (filename) form.append('filename', filename);

  const res = await fetch(`${API_BASE}/api/amazon/upload`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

// ---------- Authenticated image loader ----------

/**
 * Fetches an image as a blob URL with auth headers.
 * Used because <img src> can't send Authorization headers.
 */
export async function loadAuthImage(nodeId, type = 'thumbnail', tempLink = null) {
  const headers = await authHeaders();
  const params = new URLSearchParams({ type });
  if (tempLink) params.set('tempLink', tempLink);
  const res = await fetch(`${API_BASE}/api/amazon/photo/${nodeId}?${params}`, { headers });
  if (!res.ok) throw new Error('Image load failed');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
