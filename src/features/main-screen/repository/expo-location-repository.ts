import * as Location from 'expo-location';
import { mainError, type LocationRepository } from '../domain/models';
export function createExpoLocationRepository(): LocationRepository {
  return {
    async getCurrentCoordinates() {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw mainError('location-denied');
        const result = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(mainError('location-unavailable')), 15000); }),
        ]);
        return { latitude: result.coords.latitude, longitude: result.coords.longitude };
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'location-denied') throw error;
        throw mainError('location-unavailable');
      }
      finally { clearTimeout(timer); }
    },
  };
}
