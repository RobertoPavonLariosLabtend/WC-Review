import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthUseCases } from '../src/features/auth/use-cases/index.ts';
import { mapAuthUser } from '../src/features/auth/repository/map-auth-user.ts';

const user = { id: 'uid', email: 'user@example.com', displayName: 'User' };
function fakeAuth(overrides = {}) {
  return {
    observeSession: () => () => {},
    loginWithEmail: async () => user,
    loginWithGoogle: async () => user,
    logout: async () => {},
    isGoogleAvailable: () => true,
    ...overrides,
  };
}

test('email case rejects invalid input before touching the repository', async () => {
  let calls = 0;
  const cases = createAuthUseCases(fakeAuth({ loginWithEmail: async () => { calls++; return user; } }));
  await assert.rejects(cases.loginWithEmail('bad', 'password'), { code: 'auth/invalid-email' });
  await assert.rejects(cases.loginWithEmail('user@example.com', ''), { code: 'auth/missing-password' });
  assert.equal(calls, 0);
});

test('email case trims email while preserving the exact password and session model', async () => {
  const cases = createAuthUseCases(fakeAuth({ loginWithEmail: async (email, password) => {
    assert.equal(email, 'user@example.com');
    assert.equal(password, ' password with spaces ');
    return user;
  } }));
  assert.deepEqual(await cases.loginWithEmail(' user@example.com ', ' password with spaces '), user);
});

test('Google case preserves cancellation and checks availability before calling the repository', async () => {
  const cancelled = createAuthUseCases(fakeAuth({ loginWithGoogle: async () => null }));
  assert.equal(await cancelled.loginWithGoogle(), null);
  let calls = 0;
  const unavailable = createAuthUseCases(fakeAuth({ isGoogleAvailable: () => false, loginWithGoogle: async () => { calls++; return user; } }));
  assert.equal(unavailable.isGoogleAvailable(), false);
  await assert.rejects(unavailable.loginWithGoogle(), { code: 'auth/google-not-configured' });
  assert.equal(calls, 0);
});

test('session case delivers signed-in/signed-out values and returns the same cleanup', () => {
  const cleanup = () => {};
  const values = [];
  const cases = createAuthUseCases(fakeAuth({ observeSession: listener => {
    listener(user); listener(null); return cleanup;
  } }));
  assert.equal(cases.observeSession(value => values.push(value)), cleanup);
  assert.deepEqual(values, [user, null]);
});

test('logout case awaits completion and propagates repository errors', async () => {
  const failure = new Error('network');
  const cases = createAuthUseCases(fakeAuth({ logout: async () => { throw failure; } }));
  await assert.rejects(cases.logout(), error => error === failure);
  await createAuthUseCases(fakeAuth()).logout();
});

test('session mapper exposes only domain fields and preserves anonymous profile values', () => {
  assert.equal(mapAuthUser(null), null);
  assert.deepEqual(mapAuthUser({ uid: 'uid', email: null, displayName: null, getIdToken: () => 'secret' }), { id: 'uid', email: null, displayName: null });
});
