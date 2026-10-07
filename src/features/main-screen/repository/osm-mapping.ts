import type { EstablishmentDetails, PlaceBounds } from '../domain/models.ts';

export type OsmRecord = { details: EstablishmentDetails; commonsFile?: string };
const categories: Record<string, string> = {
  restaurant: 'Restaurante', cafe: 'Cafetería', bar: 'Bar', pub: 'Pub', fast_food: 'Comida rápida', food_court: 'Zona de restauración',
  fuel: 'Gasolinera', library: 'Biblioteca', cinema: 'Cine', theatre: 'Teatro',
  toilets: 'Baños', hotel: 'Hotel', hostel: 'Hostal', guest_house: 'Alojamiento', museum: 'Museo', attraction: 'Lugar de interés',
};
export function text(value: unknown, limit = 600): string | undefined {
  return typeof value === 'string' ? value.trim().slice(0, limit) || undefined : undefined;
}
export function httpsUrl(value: unknown): string | undefined {
  try {
    const url = new URL(text(value, 2048) ?? '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}
export function mapOsmElement(value: unknown, bounds: PlaceBounds): OsmRecord | undefined {
  if (!value || typeof value !== 'object') return;
  const element = value as Record<string, unknown>;
  if (!['node', 'way', 'relation'].includes(String(element.type)) || !Number.isSafeInteger(element.id) || Number(element.id) <= 0) return;
  const tags = element.tags && typeof element.tags === 'object' ? element.tags as Record<string, unknown> : {};
  const center = element.type === 'node' ? element : element.center as Record<string, unknown> | undefined;
  const latitude = center?.lat, longitude = center?.lon;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < bounds.south || latitude > bounds.north || longitude < bounds.west || longitude > bounds.east) return;
  const name = text(tags['name:es'], 160) ?? text(tags.name, 160) ?? (tags.amenity === 'toilets' ? 'Baños' : undefined);
  if (!name) return;
  const id = `osm-${element.type}-${element.id}`;
  const category = categories[String(tags.amenity ?? tags.tourism)] ?? (tags.shop ? 'Comercio' : 'Establecimiento');
  const street = text(tags['addr:street'], 160), number = text(tags['addr:housenumber'], 30);
  const address = text(tags['addr:full']) ?? ([street && [street, number].filter(Boolean).join(' '), text(tags['addr:postcode'], 20), text(tags['addr:city'], 100)].filter(Boolean).join(', ') || undefined);
  const commons = text(tags.wikimedia_commons, 240) ?? text(tags.image, 240);
  const commonsFile = commons && /^File:[^|\r\n]+\.(jpe?g|png|webp)$/i.test(commons) ? commons : undefined;
  return {
    commonsFile,
    details: {
      id, name, coordinate: { latitude, longitude }, category, address,
      description: text(tags['description:es']) ?? text(tags.description), openingHours: text(tags.opening_hours),
      website: httpsUrl(tags.website ?? tags['contact:website']),
      toilets: {
        availability: tags.amenity === 'toilets' ? 'yes' : text(tags.toilets, 60),
        access: text(tags['toilets:access'] ?? (tags.amenity === 'toilets' ? tags.access : undefined), 60),
        wheelchair: text(tags['toilets:wheelchair'] ?? (tags.amenity === 'toilets' ? tags.wheelchair : undefined), 60),
        fee: text(tags['toilets:fee'] ?? (tags.amenity === 'toilets' ? tags.fee : undefined), 60),
      },
      photo: commonsFile ? { resource: `places/${id}/photos/commons`, authors: [] } : undefined,
      attributions: [
        { name: 'Datos: © colaboradores de OpenStreetMap', uri: `https://www.openstreetmap.org/${element.type}/${element.id}` },
        { name: 'OpenStreetMap · licencia ODbL', uri: 'https://www.openstreetmap.org/copyright' },
      ],
    },
  };
}
