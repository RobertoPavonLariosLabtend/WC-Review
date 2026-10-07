export function validateCredentials(email: string, password: string): { code: string } | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { code: 'auth/invalid-email' };
  if (!password) return { code: 'auth/missing-password' };
  return null;
}

export function validateRegistration(email: string, password: string, confirmation: string): { code: string } | null {
  const credentials = validateCredentials(email, password);
  if (credentials) return credentials;
  if (password.length < 6) return { code: 'auth/weak-password' };
  if (password !== confirmation) return { code: 'auth/password-mismatch' };
  return null;
}
