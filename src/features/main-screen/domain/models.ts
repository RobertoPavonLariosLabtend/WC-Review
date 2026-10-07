export type Coordinates = { latitude: number; longitude: number };
export type PlaceSelection = { placeId: string; name: string; coordinate: Coordinates };
export type Attribution = { name: string; uri?: string };
export type PlacePhoto = { resource: string; authors: Attribution[] };
export type EstablishmentDetails = {
  id: string; name: string; coordinate?: Coordinates; address?: string;
  description?: string; photo?: PlacePhoto; attributions: Attribution[];
};
export type DisplayPhoto = { uri: string; authors: Attribution[] };
export type MainErrorCode = 'invalid-selection' | 'unavailable' | 'unauthorized' | 'rate-limit' | 'location-denied' | 'location-unavailable';
export function mainError(code: MainErrorCode) { return Object.assign(new Error(code), { code }); }
export interface PlacesRepository {
  listPlaces(signal: AbortSignal): Promise<PlaceSelection[]>;
  getDetails(placeId: string, signal: AbortSignal): Promise<EstablishmentDetails>;
  getPhoto(placeId: string, photo: PlacePhoto, signal: AbortSignal): Promise<DisplayPhoto>;
}
export interface LocationRepository { getCurrentCoordinates(): Promise<Coordinates>; }
