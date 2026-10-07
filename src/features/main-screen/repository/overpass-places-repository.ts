import { INITIAL_PLACE_BOUNDS, MAX_PLACES, mainError, validatePlaceBounds, type DisplayPhoto, type PlaceBounds, type PlacesRepository } from '../domain/models.ts';
import { mapOsmElement, type OsmRecord } from './osm-mapping.ts';
import { checkSignal, providerJson, type ProviderFetch } from './provider-http.ts';
import { resolveOsmPhoto } from './commons-photo.ts';

const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL = 5 * 60 * 1000;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export function overpassQuery(bounds: PlaceBounds) {
  validatePlaceBounds(bounds);
  const box = [bounds.south, bounds.west, bounds.north, bounds.east].join(',');
  return `[out:json][timeout:20];(nwr["name"]["amenity"~"^(restaurant|cafe|bar|pub|fast_food|food_court|fuel|library|cinema|theatre)$"](${box});nwr["name"]["shop"](${box});nwr["name"]["tourism"~"^(hotel|hostel|guest_house|museum|attraction)$"](${box});nwr["amenity"="toilets"](${box}););out body center ${MAX_PLACES};`;
}
export function createOverpassPlacesRepository({ fetcher = fetch, now = Date.now }: { fetcher?: ProviderFetch; now?: () => number } = {}): PlacesRepository {
  const areas = new Map<string, { at: number; records: OsmRecord[] }>();
  const photos = new Map<string, DisplayPhoto>();
  let nextRequestAt = 0;
  function findRecord(id: string) {
    // Most recently fetched records take precedence over earlier cached areas.
    return [...areas.values()].reverse().flatMap(area => area.records).find(record => record.details.id === id);
  }
  return {
    async listPlaces(signal, bounds = INITIAL_PLACE_BOUNDS) {
      checkSignal(signal);
      const query = overpassQuery(bounds);
      let area = areas.get(query);
      if (!area || now() - area.at >= CACHE_TTL) {
        if (now() < nextRequestAt) throw mainError('rate-limit');
        nextRequestAt = now() + 5000;
        let response: unknown;
        try {
          response = await providerJson(fetcher, ENDPOINT, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}`,
          }, signal);
        } catch (error) {
          if ((error as { code?: string }).code === 'rate-limit') nextRequestAt = now() + 60000;
          throw error;
        }
        const data = response as { elements?: unknown[]; remark?: string };
        if (!data || data.remark || !Array.isArray(data.elements)) throw mainError('unavailable');
        checkSignal(signal);
        const records = new Map<string, OsmRecord>();
        for (const element of data.elements.slice(0, MAX_PLACES)) {
          const record = mapOsmElement(element, bounds);
          if (record) records.set(record.details.id, record);
        }
        area = { at: now(), records: [...records.values()] };
        areas.delete(query);
        areas.set(query, area);
        if (areas.size > 16) areas.delete(areas.keys().next().value!);
      }
      return area.records.map(({ details }) => ({ placeId: details.id, name: details.name, coordinate: { ...details.coordinate! } }));
    },
    async getDetails(placeId, signal) {
      checkSignal(signal);
      const record = findRecord(placeId);
      if (!record) throw mainError('unavailable');
      return clone(record.details);
    },
    async getPhoto(placeId, photo, signal) {
      checkSignal(signal);
      const record = findRecord(placeId);
      if (!record?.photoSource || photo.resource !== record.details.photo?.resource) throw mainError('invalid-selection');
      const key = JSON.stringify(record.photoSource);
      let result = photos.get(key);
      if (!result) {
        result = await resolveOsmPhoto(record.photoSource, fetcher, signal);
        checkSignal(signal);
        photos.set(key, result);
        if (photos.size > 32) photos.delete(photos.keys().next().value!);
      }
      return clone(result);
    },
  };
}
