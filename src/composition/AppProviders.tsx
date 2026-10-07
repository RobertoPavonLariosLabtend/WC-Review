import { type PropsWithChildren } from 'react';
import { createFirebaseAuthRepository } from '../features/auth/repository/firebase-auth-repository';
import { createAuthUseCases } from '../features/auth/use-cases';
import { AuthProvider } from '../features/auth/ui/AuthProvider';

const authUseCases = createAuthUseCases(createFirebaseAuthRepository());

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider useCases={authUseCases}>{children}</AuthProvider>;
}
