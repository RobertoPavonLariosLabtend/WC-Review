import type { AuthUser } from '../domain/auth-user';

type NativeUserProfile = { uid: string; email: string | null; displayName: string | null };

export function mapAuthUser(user: NativeUserProfile): AuthUser;
export function mapAuthUser(user: NativeUserProfile | null): AuthUser | null;
export function mapAuthUser(user: NativeUserProfile | null): AuthUser | null {
  return user ? { id: user.uid, email: user.email, displayName: user.displayName } : null;
}
