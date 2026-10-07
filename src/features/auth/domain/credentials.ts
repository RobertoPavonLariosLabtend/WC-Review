export function validateCredentials(email: string, password: string): { code: string } | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { code: 'auth/invalid-email' };
  if (!password) return { code: 'auth/missing-password' };
  return null;
}

