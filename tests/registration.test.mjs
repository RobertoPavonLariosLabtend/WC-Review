import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthUseCases } from '../src/features/auth/use-cases/index.ts';
import { authErrorMessage } from '../src/features/auth/ui/auth-errors.ts';

test('invalid registration never reaches the repository', async () => {
  let calls = 0;
  const cases = createAuthUseCases({ createAccount: async () => { calls++; } });
  for (const [email, password, confirmation, code] of [
    ['bad', '123456', '123456', 'auth/invalid-email'],
    ['user@example.com', '', '', 'auth/missing-password'],
    ['user@example.com', '12345', '12345', 'auth/weak-password'],
    ['user@example.com', '123456', 'different', 'auth/password-mismatch'],
    ['user@example.com', '123456', '', 'auth/password-mismatch'],
  ]) await assert.rejects(cases.createAccount(email, password, confirmation), { code });
  assert.equal(calls, 0);
});

test('registration trims email, preserves the password and returns the domain user', async () => {
  const user = { id: 'created', email: 'new@example.com', displayName: null };
  const cases = createAuthUseCases({ createAccount: async (email, password) => {
    assert.equal(email, 'new@example.com');
    assert.equal(password, ' pass with spaces ');
    return user;
  } });
  assert.deepEqual(await cases.createAccount(' new@example.com ', ' pass with spaces ', ' pass with spaces '), user);
});

test('provider rejection propagates without converting it into registration success', async () => {
  const failure = { code: 'auth/email-already-in-use' };
  const cases = createAuthUseCases({ createAccount: async () => { throw failure; } });
  await assert.rejects(cases.createAccount('user@example.com', '123456', '123456'), error => error === failure);
});

test('registration errors are Spanish and unknown failures describe account creation', () => {
  assert.match(authErrorMessage({ code: 'auth/password-mismatch' }, 'registration'), /no coinciden/);
  assert.match(authErrorMessage({ code: 'auth/weak-password' }, 'registration'), /contraseña/);
  assert.match(authErrorMessage({ code: 'auth/email-already-in-use' }, 'registration'), /Inicia sesión/);
  assert.match(authErrorMessage({}, 'registration'), /crear la cuenta/);
  assert.match(authErrorMessage({}), /iniciar sesión/);
});
