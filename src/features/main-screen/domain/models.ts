export type Coordinates = { latitude: number; longitude: number };
export type PlaceBounds = { south: number; west: number; north: number; east: number };
export const INITIAL_PLACE_BOUNDS: PlaceBounds = { south: 40.409, west: -3.714, north: 40.425, east: -3.694 };
export const MAX_PLACES = 300;
export function validatePlaceBounds(bounds: PlaceBounds) {
  if (!bounds || ![bounds.south, bounds.west, bounds.north, bounds.east].every(Number.isFinite)
    || bounds.south < -90 || bounds.north > 90 || bounds.west < -180 || bounds.east > 180
    || bounds.south >= bounds.north || bounds.west >= bounds.east) throw mainError('invalid-selection');
  if (bounds.north - bounds.south > 0.05 || bounds.east - bounds.west > 0.05) throw mainError('area-too-large');
}
export type PlaceSelection = { placeId: string; name: string; coordinate: Coordinates };
export type Attribution = { name: string; uri?: string };
export type PlacePhoto = { resource: string; authors: Attribution[] };
export type EstablishmentDetails = {
  id: string; name: string; coordinate?: Coordinates; address?: string;
  description?: string; photo?: PlacePhoto; attributions: Attribution[];
  category?: string; openingHours?: string; website?: string;
  toilets?: { availability?: string; access?: string; wheelchair?: string; fee?: string };
};
export type DisplayPhoto = { uri: string; authors: Attribution[] };
export type MainErrorCode = 'invalid-selection' | 'area-too-large' | 'unavailable' | 'unauthorized' | 'rate-limit' | 'location-denied' | 'location-unavailable';
export function mainError(code: MainErrorCode) { return Object.assign(new Error(code), { code }); }
export interface PlacesRepository {
  listPlaces(signal: AbortSignal, bounds?: PlaceBounds): Promise<PlaceSelection[]>;
  getDetails(placeId: string, signal: AbortSignal): Promise<EstablishmentDetails>;
  getPhoto(placeId: string, photo: PlacePhoto, signal: AbortSignal): Promise<DisplayPhoto>;
}
export interface LocationRepository { getCurrentCoordinates(): Promise<Coordinates>; }
