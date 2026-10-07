import type { AuthRepository } from '../domain/auth-repository';
import { validateCredentials } from '../domain/credentials.ts';
import type { AuthUser } from '../domain/auth-user';

export function createAuthUseCases(repository: AuthRepository) {
  return {
    async loginWithEmail(email: string, password: string) {
      const validation = validateCredentials(email, password);
      if (validation) throw Object.assign(new Error(validation.code), validation);
      return repository.loginWithEmail(email.trim(), password);
    },
    async loginWithGoogle() {
      if (!repository.isGoogleAvailable()) {
        throw Object.assign(new Error('Google unavailable'), { code: 'auth/google-not-configured' });
      }
      return repository.loginWithGoogle();
    },
    observeSession: (listener: (user: AuthUser | null) => void) => repository.observeSession(listener),
    logout: () => repository.logout(),
    isGoogleAvailable: () => repository.isGoogleAvailable(),
  };
}

export type AuthUseCases = ReturnType<typeof createAuthUseCases>;
