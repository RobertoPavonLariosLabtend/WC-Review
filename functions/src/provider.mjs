import { ServiceError, validPhoto } from './service.mjs';
const FIELD_MASK = 'id,displayName,location,formattedAddress,editorialSummary,photos,attributions';
const MAX_PHOTO = 5 * 1024 * 1024;
const text = value => typeof value === 'string' && value.trim() ? value : undefined;
const https = value => typeof value === 'string' ? value.startsWith('https://') ? value : value.startsWith('//') ? `https:${value}` : undefined : undefined;
const authors = list => Array.isArray(list) ? list.map(a => ({ name: text(a.displayName) ?? text(a.provider) ?? 'Google', uri: https(a.uri) ?? https(a.providerUri) })) : [];
export function normalizeDetails(id, raw) {
  const photo = raw.photos?.find(p => validPhoto(id, p.name));
  const lat = raw.location?.latitude, lng = raw.location?.longitude;
  return {
    id, name: text(raw.displayName?.text) ?? 'Establecimiento',
    coordinate: Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { latitude: lat, longitude: lng } : undefined,
    address: text(raw.formattedAddress), description: text(raw.editorialSummary?.text),
    photo: photo ? { resource: photo.name, authors: authors(photo.authorAttributions) } : undefined,
    attributions: authors(raw.attributions),
  };
}
async function boundedBody(response, max) {
  if (Number(response.headers.get('content-length')) > max) throw new ServiceError(502, 'response-too-large');
  const reader = response.body?.getReader();
  if (!reader) throw new ServiceError(502, 'unavailable');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) throw new ServiceError(502, 'response-too-large');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}
export function createPlacesProvider(key, fetcher = fetch) {
  async function request(path, headers, maximum, image = false) {
    try {
      const response = await fetcher(`https://places.googleapis.com/v1/${path}`, {
        headers: { 'X-Goog-Api-Key': key(), ...headers }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new ServiceError(503, 'provider-unavailable');
      const mime = response.headers.get('content-type')?.split(';')[0];
      if (image && !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new ServiceError(502, 'invalid-image');
      const body = await boundedBody(response, maximum);
      return image ? { uri: `data:${mime};base64,${body.toString('base64')}` } : JSON.parse(body.toString('utf8'));
    } catch (error) { if (error instanceof ServiceError) throw error; throw new ServiceError(503, 'provider-unavailable'); }
  }
  return {
    async details(id) {
      const raw = await request(`places/${id}?languageCode=es`, { 'X-Goog-FieldMask': FIELD_MASK }, 1024 * 1024);
      return normalizeDetails(id, raw);
    },
    photo: resource => request(`${resource}/media?maxWidthPx=800&maxHeightPx=800`, {}, MAX_PHOTO, true),
  };
}
