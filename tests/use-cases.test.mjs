import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthUseCases } from '../src/features/auth/use-cases/index.ts';
import { createCounterUseCases } from '../src/features/counter/use-cases/index.ts';
import { createMemoryCounterRepository } from '../src/features/counter/repository/memory-counter-repository.ts';
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

test('counter cases read, increment and reset through their repository', () => {
  let value = 4;
  const writes = [];
  const cases = createCounterUseCases({ getCount: () => value, saveCount: next => { value = next; writes.push(next); } });
  assert.equal(cases.getCount(), 4);
  assert.equal(cases.increment(), 5);
  assert.equal(cases.increment(), 6);
  assert.equal(cases.reset(), 0);
  assert.deepEqual(writes, [5, 6, 0]);
});

test('new counter instances start at zero and never share user state', () => {
  const first = createCounterUseCases(createMemoryCounterRepository());
  first.increment(); first.increment();
  const second = createCounterUseCases(createMemoryCounterRepository());
  assert.equal(first.getCount(), 2);
  assert.equal(second.getCount(), 0);
  second.reset();
  assert.equal(first.getCount(), 2);
});
