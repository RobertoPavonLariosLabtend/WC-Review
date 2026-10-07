import type { AuthUser } from './auth-user';

export interface AuthRepository {
  observeSession(listener: (user: AuthUser | null) => void): () => void;
  loginWithEmail(email: string, password: string): Promise<AuthUser>;
  loginWithGoogle(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  isGoogleAvailable(): boolean;
}
