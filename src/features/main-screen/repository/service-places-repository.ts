import { mainError, type Attribution, type DisplayPhoto, type EstablishmentDetails, type PlacesRepository } from '../domain/models.ts';

type Session = { id: string; token: string };
function credits(items: Attribution[]) {
  return items.filter(item => item && typeof item.name === 'string').map(item => ({ name: item.name, uri: typeof item.uri === 'string' && item.uri.startsWith('https://') ? item.uri : undefined }));
}
const optionalText = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined;
export function createServicePlacesRepository(configuration: { detailsUrl?: string; photoUrl?: string }, session: () => Promise<Session>, fetcher: typeof fetch = fetch): PlacesRepository {
  async function request(endpoint: string | undefined, params: Record<string, string>, signal: AbortSignal): Promise<unknown> {
    if (!endpoint || !/^https:\/\//.test(endpoint)) throw mainError('unavailable');
    const before = await session();
    if (signal.aborted) throw mainError('unavailable');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 25000);
    try {
      const query = Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
      const response = await fetcher(`${endpoint}?${query}`, { headers: { Authorization: `Bearer ${before.token}` }, signal: controller.signal });
      if (!response.ok) throw mainError(response.status === 401 ? 'unauthorized' : response.status === 429 ? 'rate-limit' : 'unavailable');
      const raw = await response.text();
      if (raw.length > 7 * 1024 * 1024) throw mainError('unavailable');
      const after = await session();
      if (after.id !== before.id || signal.aborted) throw mainError('unauthorized');
      return JSON.parse(raw);
    } catch (error) {
      if (error instanceof Error && 'code' in error) throw error;
      throw mainError('unavailable');
    } finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
  }
  return {
    async getDetails(placeId, signal) {
      const data = await request(configuration.detailsUrl, { placeId }, signal) as EstablishmentDetails;
      if (!data || data.id !== placeId || typeof data.name !== 'string' || !Array.isArray(data.attributions)) throw mainError('unavailable');
      const coordinate = data.coordinate;
      const resource = data.photo?.resource;
      return {
        id: data.id, name: data.name, address: optionalText(data.address), description: optionalText(data.description),
        coordinate: coordinate && Number.isFinite(coordinate.latitude) && Math.abs(coordinate.latitude) <= 90 && Number.isFinite(coordinate.longitude) && Math.abs(coordinate.longitude) <= 180 ? { latitude: coordinate.latitude, longitude: coordinate.longitude } : undefined,
        photo: typeof resource === 'string' && resource.length <= 1024 && new RegExp(`^places/${placeId}/photos/[A-Za-z0-9_-]+$`).test(resource) ? { resource, authors: credits(Array.isArray(data.photo?.authors) ? data.photo.authors : []) } : undefined,
        attributions: credits(data.attributions),
      };
    },
    async getPhoto(placeId, photo, signal) {
      const data = await request(configuration.photoUrl, { placeId, photo: photo.resource }, signal) as DisplayPhoto;
      if (!data || typeof data.uri !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.uri) || !Array.isArray(data.authors)) throw mainError('unavailable');
      return { uri: data.uri, authors: credits(data.authors) };
    },
  };
}
