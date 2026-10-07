import type { AuthUser } from '../domain/auth-user';
import type { AuthUseCases } from '../use-cases';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

type AuthState = {
  useCases: AuthUseCases;
  user: AuthUser | null;
  initializing: boolean;
  initializationError: boolean;
  retry: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children, useCases }: PropsWithChildren<{ useCases: AuthUseCases }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const fail = () => { if (active) { setInitializationError(true); setInitializing(false); } };
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = useCases.observeSession(current => {
        if (active) { setUser(current); setInitializing(false); setInitializationError(false); }
      });
    } catch { fail(); }
    return () => { active = false; unsubscribe?.(); };
  }, [attempt, useCases]);

  function retry() {
    setInitializing(true);
    setInitializationError(false);
    setAttempt(value => value + 1);
  }

  return <AuthContext.Provider value={{ useCases, user, initializing, initializationError, retry }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
