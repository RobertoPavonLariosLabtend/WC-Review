export function validateCredentials(email: string, password: string): { code: string; message: string } | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { code: 'auth/invalid-email', message: 'Introduce un email válido.' };
  if (!password) return { code: 'auth/missing-password', message: 'Introduce tu contraseña.' };
  return null;
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}

export function isAuthCancellation(error: unknown): boolean {
  return ['SIGN_IN_CANCELLED', '12501'].includes(errorCode(error));
}

export function authErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials': return 'El email o la contraseña no son correctos.';
    case 'auth/invalid-email': return 'Introduce un email válido.';
    case 'auth/missing-password': return 'Introduce tu contraseña.';
    case 'auth/network-request-failed': return 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
    case 'auth/user-disabled': return 'Esta cuenta está deshabilitada. Contacta con soporte.';
    case 'auth/operation-not-allowed': return 'Este método de acceso todavía no está habilitado.';
    case 'auth/account-exists-with-different-credential': return 'Accede con el método que ya utilizabas para esta cuenta.';
    case 'auth/google-not-configured': return 'El acceso con Google estará disponible próximamente.';
    case 'auth/missing-identity-token': return 'No se pudo completar el acceso. Vuelve a intentarlo.';
    case 'PLAY_SERVICES_NOT_AVAILABLE': return 'Google Play Services no está disponible en este dispositivo.';
    default: return 'No se pudo iniciar sesión. Vuelve a intentarlo.';
  }
}

export type GoogleConfiguration = { webClientId?: string; iosClientId?: string; iosUrlScheme?: string };

export function googleConfigurationReady(platform: string, configuration: GoogleConfiguration): boolean {
  if (platform === 'android') return Boolean(configuration.webClientId);
  if (platform === 'ios') return Boolean(configuration.webClientId && configuration.iosClientId && configuration.iosUrlScheme);
  return false;
}

type GoogleDependencies<T> = {
  request: () => Promise<{ type: 'cancelled' } | { type: 'success'; data: { idToken: string | null } }>;
  exchange: (idToken: string) => Promise<T>;
};

export async function performGoogleSignIn<T>(dependencies: GoogleDependencies<T>): Promise<T | null> {
  const response = await dependencies.request();
  if (response.type === 'cancelled') return null;
  if (!response.data.idToken) throw Object.assign(new Error('Missing Google identity token'), { code: 'auth/missing-identity-token' });
  return dependencies.exchange(response.data.idToken);
}

export function createAuthQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>): Promise<T> => {
    const result = tail.then(operation);
    tail = result.catch(() => undefined);
    return result;
  };
}
