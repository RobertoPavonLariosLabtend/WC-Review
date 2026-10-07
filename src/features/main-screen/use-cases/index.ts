import { mainError, type Coordinates, type LocationRepository, type PlacePhoto, type PlaceSelection, type PlacesRepository } from '../domain/models.ts';

export function validCoordinates(value: Coordinates) {
  return Number.isFinite(value?.latitude) && Number.isFinite(value?.longitude) && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}
export function validPlaceId(value: string) { return typeof value === 'string' && /^[A-Za-z0-9_-]{1,256}$/.test(value); }
export function createMainUseCases(places: PlacesRepository, location: LocationRepository) {
  return {
    select(selection: PlaceSelection): PlaceSelection {
      if (!selection || !validPlaceId(selection.placeId) || !validCoordinates(selection.coordinate)) throw mainError('invalid-selection');
      return { ...selection, name: selection.name?.trim() || 'Establecimiento' };
    },
    getDetails: (placeId: string, signal: AbortSignal) => {
      if (!validPlaceId(placeId)) throw mainError('invalid-selection');
      return places.getDetails(placeId, signal);
    },
    getPhoto(placeId: string, photo: PlacePhoto, signal: AbortSignal) {
      if (!validPlaceId(placeId) || !photo || typeof photo.resource !== 'string' || photo.resource.length > 1024 || !new RegExp(`^places/${placeId}/photos/[A-Za-z0-9_-]+$`).test(photo.resource)) throw mainError('invalid-selection');
      return places.getPhoto(placeId, photo, signal);
    },
    async locate() {
      const coordinate = await location.getCurrentCoordinates();
      if (!validCoordinates(coordinate)) throw mainError('location-unavailable');
      return coordinate;
    },
  };
}
export type MainUseCases = ReturnType<typeof createMainUseCases>;
