import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signOut } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { AuthRepository } from '../domain/auth-repository';
import { createAuthQueue, googleConfigurationReady, performGoogleSignIn, type GoogleConfiguration } from './google-sign-in';
import { mapAuthUser } from './map-auth-user';

export function createFirebaseAuthRepository(): AuthRepository {
  const configuration: GoogleConfiguration = Constants.expoConfig?.extra?.googleAuth ?? {};
  const googleAvailable = googleConfigurationReady(Platform.OS, configuration);
  let configured = false;
  const run = createAuthQueue();

  function configureGoogle() {
    if (!googleAvailable) throw Object.assign(new Error('Google OAuth is not configured'), { code: 'auth/google-not-configured' });
    if (!configured) {
      GoogleSignin.configure({ webClientId: configuration.webClientId, iosClientId: configuration.iosClientId });
      configured = true;
    }
  }

  return {
    observeSession: listener => onAuthStateChanged(getAuth(), user => listener(mapAuthUser(user))),
    loginWithEmail: (email, password) => run(async () => {
      const result = await signInWithEmailAndPassword(getAuth(), email, password);
      return mapAuthUser(result.user);
    }),
    loginWithGoogle: () => run(async () => {
      configureGoogle();
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      return performGoogleSignIn({
        request: () => GoogleSignin.signIn(),
        exchange: async token => {
          const result = await signInWithCredential(getAuth(), GoogleAuthProvider.credential(token));
          return mapAuthUser(result.user);
        },
      });
    }),
    logout: () => run(async () => {
      await signOut(getAuth());
      if (googleAvailable) {
        configureGoogle();
        // Firebase sign-out succeeds even if clearing Google's cache fails.
        await GoogleSignin.signOut().catch(() => undefined);
      }
    }),
    isGoogleAvailable: () => googleAvailable,
  };
}
