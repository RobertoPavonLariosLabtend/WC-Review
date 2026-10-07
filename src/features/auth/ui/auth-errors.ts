function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}

export function isAuthCancellation(error: unknown): boolean {
  return ['SIGN_IN_CANCELLED', '12501'].includes(errorCode(error));
}

export function authErrorMessage(error: unknown, operation: 'login' | 'registration' = 'login'): string {
  switch (errorCode(error)) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials': return 'El email o la contraseña no son correctos.';
    case 'auth/invalid-email': return 'Introduce un email válido.';
    case 'auth/missing-password': return 'Introduce tu contraseña.';
    case 'auth/password-mismatch': return 'Las contraseñas no coinciden.';
    case 'auth/weak-password': return 'Usa una contraseña de al menos 6 caracteres y que cumpla los requisitos de seguridad.';
    case 'auth/password-does-not-meet-requirements': return 'La contraseña no cumple los requisitos de seguridad.';
    case 'auth/email-already-in-use': return 'Ya existe una cuenta con este email. Inicia sesión.';
    case 'auth/network-request-failed': return 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
    case 'auth/user-disabled': return 'Esta cuenta está deshabilitada. Contacta con soporte.';
    case 'auth/operation-not-allowed': return 'Este método de acceso todavía no está habilitado.';
    case 'auth/account-exists-with-different-credential': return 'Accede con el método que ya utilizabas para esta cuenta.';
    case 'auth/google-not-configured': return 'El acceso con Google estará disponible próximamente.';
    case 'auth/missing-identity-token': return 'No se pudo completar el acceso. Vuelve a intentarlo.';
    case 'PLAY_SERVICES_NOT_AVAILABLE': return 'Google Play Services no está disponible en este dispositivo.';
    default: return operation === 'registration' ? 'No se pudo crear la cuenta. Vuelve a intentarlo.' : 'No se pudo iniciar sesión. Vuelve a intentarlo.';
  }
}
