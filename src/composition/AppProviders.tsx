import { useState, type PropsWithChildren } from 'react';
import { createFirebaseAuthRepository } from '../features/auth/repository/firebase-auth-repository';
import { createAuthUseCases } from '../features/auth/use-cases';
import { AuthProvider } from '../features/auth/ui/AuthProvider';
import { createMemoryCounterRepository } from '../features/counter/repository/memory-counter-repository';
import { createCounterUseCases } from '../features/counter/use-cases';
import CounterScreen from '../features/counter/ui/CounterScreen';

const authUseCases = createAuthUseCases(createFirebaseAuthRepository());

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider useCases={authUseCases}>{children}</AuthProvider>;
}

export function CounterFeature() {
  const [useCases] = useState(() => createCounterUseCases(createMemoryCounterRepository()));
  return <CounterScreen useCases={useCases} />;
}
