import { getAuth, getIdToken } from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { mainError } from '../domain/models';
import { createServicePlacesRepository } from './service-places-repository';
export function mainConfiguration() {
  const config = Constants.expoConfig?.extra?.mainMap ?? {};
  return { mapReady: Platform.OS === 'ios' ? config.iosReady === true : Platform.OS === 'android' && config.androidReady === true, detailsUrl: config.detailsUrl as string | undefined, photoUrl: config.photoUrl as string | undefined };
}
export function createFirebasePlacesRepository() {
  return createServicePlacesRepository(mainConfiguration(), async () => {
    const user = getAuth().currentUser;
    if (!user) throw mainError('unauthorized');
    const token = await getIdToken(user);
    if (getAuth().currentUser?.uid !== user.uid) throw mainError('unauthorized');
    return { id: user.uid, token };
  });
}
