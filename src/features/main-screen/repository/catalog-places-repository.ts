import { mainError, type PlacesRepository } from '../domain/models.ts';
import type { CatalogueRecord } from './catalogue.ts';

export function createCatalogPlacesRepository(records: CatalogueRecord[], resolveAsset: (asset: string) => string): PlacesRepository {
  // Keep each adapter's source isolated from callers and from later mutations.
  const catalogue = new Map<string, CatalogueRecord>();
  for (const record of records) {
    if (catalogue.has(record.id)) throw new Error(`Duplicate catalogue id: ${record.id}`);
    catalogue.set(record.id, JSON.parse(JSON.stringify(record)));
  }
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  function checkSignal(signal: AbortSignal) {
    // React Native's AbortSignal polyfill does not expose throwIfAborted.
    if (signal.aborted) throw Object.assign(new Error('Carga cancelada'), { name: 'AbortError' });
  }
  function recordFor(placeId: string, signal: AbortSignal) {
    checkSignal(signal);
    const record = catalogue.get(placeId);
    if (!record) throw mainError('unavailable');
    return record;
  }
  return {
    async listPlaces(signal) {
      checkSignal(signal);
      return [...catalogue.values()].map(record => ({ placeId: record.id, name: record.name, coordinate: { ...record.coordinate } }));
    },
    async getDetails(placeId, signal) {
      const record = recordFor(placeId, signal);
      return clone({
        id: record.id, name: record.name, coordinate: record.coordinate,
        address: record.address, description: record.description,
        photo: record.photo ? { resource: `places/${record.id}/photos/main`, authors: record.photo.authors } : undefined,
        attributions: record.attributions,
      });
    },
    async getPhoto(placeId, photo, signal) {
      const record = recordFor(placeId, signal);
      if (!record.photo || photo.resource !== `places/${record.id}/photos/main`) throw mainError('invalid-selection');
      const uri = resolveAsset(record.photo.asset);
      if (!uri) throw mainError('unavailable');
      return { uri, authors: clone(record.photo.authors) };
    },
  };
}
