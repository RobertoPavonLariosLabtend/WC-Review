import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createAuthQueue, googleConfigurationReady, performGoogleSignIn, validateCredentials, type GoogleConfiguration } from './logic';

const googleConfiguration: GoogleConfiguration = Constants.expoConfig?.extra?.googleAuth ?? {};
export const googleAvailable = googleConfigurationReady(Platform.OS, googleConfiguration);
let googleConfigured = false;
const runAuthOperation = createAuthQueue();

function configureGoogle() {
  if (!googleAvailable) throw Object.assign(new Error('Google OAuth is not configured'), { code: 'auth/google-not-configured' });
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: googleConfiguration.webClientId, iosClientId: googleConfiguration.iosClientId });
    googleConfigured = true;
  }
}

export function observeSession(listener: (user: User | null) => void) {
  return onAuthStateChanged(getAuth(), listener);
}

export async function loginWithEmail(email: string, password: string) {
  const validation = validateCredentials(email, password);
  if (validation) throw Object.assign(new Error(validation.message), { code: validation.code });
  return runAuthOperation(() => signInWithEmailAndPassword(getAuth(), email.trim(), password));
}

export async function loginWithGoogle() {
  return runAuthOperation(async () => {
    configureGoogle();
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    return performGoogleSignIn({ request: () => GoogleSignin.signIn(), exchange: token => signInWithCredential(getAuth(), GoogleAuthProvider.credential(token)) });
  });
}

export async function logout() {
  return runAuthOperation(async () => {
    await firebaseSignOut(getAuth());
    if (googleAvailable) {
      configureGoogle();
      // Firebase logout is complete even if clearing Google's cached account fails.
      await GoogleSignin.signOut().catch(() => undefined);
    }
  });
}
