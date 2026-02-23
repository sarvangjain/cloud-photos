import FormData from 'form-data';

export class AmazonPhotosService {
  constructor(cookies) {
    this.cookies = cookies;
    this.contentUrl = null;
    this.metadataUrl = null;
  }

  _cookieString() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  _headers(extra = {}) {
    return {
      'Cookie': this._cookieString(),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.amazon.com',
      'Referer': 'https://www.amazon.com/photos/',
      'x-amzn-sessionid': this.cookies['session-id'] || '',
      ...extra,
    };
  }

  async _getEndpoints() {
    if (this.contentUrl && this.metadataUrl) return { contentUrl: this.contentUrl, metadataUrl: this.metadataUrl };
    try {
      const res = await fetch('https://www.amazon.com/drive/v1/account/endpoint', { headers: this._headers() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      this.contentUrl = data.contentUrl?.replace(/\/$/, '') || 'https://content-na.drive.amazonaws.com/cdproxy';
      this.metadataUrl = data.metadataUrl?.replace(/\/$/, '') || 'https://cdws.us-east-1.amazonaws.com/drive/v1';
    } catch {
      this.contentUrl = 'https://content-na.drive.amazonaws.com/cdproxy';
      this.metadataUrl = 'https://cdws.us-east-1.amazonaws.com/drive/v1';
    }
    return { contentUrl: this.contentUrl, metadataUrl: this.metadataUrl };
  }

  async getUsage() {
    const { metadataUrl } = await this._getEndpoints();
    const res = await fetch(`${metadataUrl}/account/usage`, { headers: this._headers() });
    if (!res.ok) throw new Error(`Usage failed: ${res.status}`);
    return res.json();
  }

  async searchPhotos({ query, sort, offset = 0, limit = 50 }) {
    const { metadataUrl } = await this._getEndpoints();
    const params = new URLSearchParams({
      asset: 'ALL', tempLink: 'true', resourceVersion: 'V2', ContentType: 'JSON',
      limit: String(limit), lowResThumbnail: 'true', searchContext: 'customer',
      sort: sort || "['createdDate DESC']", filters: query || 'type:(PHOTOS)', offset: String(offset),
    });
    const res = await fetch(`${metadataUrl}/search?${params}`, { headers: this._headers() });
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const data = await res.json();
    const photos = (data.data || []).map(node => ({
      id: node.id, name: node.name, kind: node.kind, status: node.status,
      createdDate: node.createdDate, modifiedDate: node.modifiedDate,
      contentType: node.contentProperties?.contentType || node.contentType || 'image/jpeg',
      width: node.contentProperties?.image?.width || node.image?.width || null,
      height: node.contentProperties?.image?.height || node.image?.height || null,
      size: node.contentProperties?.size,
      tempLink: node.tempLink || null, lowResThumbnail: node.lowResThumbnail || null,
    }));
    return { photos, count: data.count || photos.length, offset, hasMore: photos.length === limit };
  }

  async downloadPhoto(nodeId, type = 'thumbnail') {
    const { contentUrl } = await this._getEndpoints();
    const urls = type === 'thumbnail'
      ? [
          `${contentUrl}/nodes/${nodeId}/property/image?viewBox=600`,
          `https://thumbnails-photos.amazon.com/v1/thumbnail/${nodeId}?viewBox=600&ownerId=${this.cookies['session-id']}`,
          `${contentUrl}/nodes/${nodeId}/content?viewBox=600`,
        ]
      : [`${contentUrl}/nodes/${nodeId}/content`];
    let lastError;
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: this._headers({ 'Accept': 'image/*' }), redirect: 'follow' });
        if (res.ok) return Buffer.from(await res.arrayBuffer());
        lastError = new Error(`HTTP ${res.status}`);
      } catch (err) { lastError = err; }
    }
    throw lastError;
  }

  async downloadFromTempLink(tempLink) {
    const res = await fetch(tempLink, { headers: this._headers({ 'Accept': 'image/*' }), redirect: 'follow' });
    if (!res.ok) throw new Error(`TempLink failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async uploadPhoto(buffer, filename, contentType = 'image/jpeg') {
    const { contentUrl } = await this._getEndpoints();
    const form = new FormData();
    form.append('metadata', JSON.stringify({ name: filename, kind: 'FILE' }), {
      contentType: 'application/json', filename: 'metadata.json',
    });
    form.append('content', buffer, { filename, contentType, knownLength: buffer.length });
    const uploadRes = await fetch(`${contentUrl}/nodes?suppress=deduplication`, {
      method: 'POST', headers: { ...this._headers(), ...form.getHeaders() }, body: form,
    });
    const resText = await uploadRes.text();
    if (!uploadRes.ok) {
      if (uploadRes.status === 409) return { success: true, duplicate: true };
      throw new Error(`Upload failed (${uploadRes.status}): ${resText}`);
    }
    let result = {};
    try { result = JSON.parse(resText); } catch {}
    return { success: true, nodeId: result.id || null, name: filename, ...result };
  }
}
