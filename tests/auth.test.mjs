import assert from 'node:assert/strict';
import test from 'node:test';
import { authErrorMessage, isAuthCancellation, validateCredentials, performGoogleSignIn, createAuthQueue, googleConfigurationReady } from '../src/services/auth/logic.ts';

test('rejects malformed email and blank password without changing the password', () => {
  assert.ok(validateCredentials('wrong', 'password'));
  assert.ok(validateCredentials('user@example.com', ''));
  assert.equal(validateCredentials(' user@example.com ', ' pass with spaces '), null);
});

test('invalid email credentials never reveal whether an account exists', () => {
  const errors = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
  const messages = errors.map(code => authErrorMessage({ code }));
  assert.ok(messages[0]);
  assert.equal(new Set(messages).size, 1);
  assert.notEqual(authErrorMessage({ code: 'auth/network-request-failed' }), messages[0]);
  assert.notEqual(authErrorMessage({ code: 'auth/too-many-requests' }), messages[0]);
});

test('provider cancellation is distinguished from network or auth errors', () => {
  for (const code of ['SIGN_IN_CANCELLED', '12501']) {
    assert.equal(isAuthCancellation({ code }), true);
  }
  assert.equal(isAuthCancellation({ code: 'auth/network-request-failed' }), false);
  assert.equal(isAuthCancellation(null), false);
  assert.equal(isAuthCancellation({ code: 'auth/invalid-credential' }), false);
});

test('Google stays unavailable until required platform OAuth IDs are present', () => {
  assert.equal(googleConfigurationReady('ios', { webClientId: 'web' }), false);
  assert.equal(googleConfigurationReady('android', {}), false);
  assert.equal(googleConfigurationReady('ios', { webClientId: 'web', iosClientId: 'ios', iosUrlScheme: 'scheme' }), true);
  assert.equal(googleConfigurationReady('android', { webClientId: 'web' }), true);
  assert.equal(googleConfigurationReady('web', { webClientId: 'web' }), false);
});

test('Google resolved cancellation does not exchange credentials or report failure', async () => {
  let exchanged = false;
  const result = await performGoogleSignIn({ request: async () => ({ type: 'cancelled' }), exchange: async () => { exchanged = true; } });
  assert.equal(result, null);
  assert.equal(exchanged, false);
});

test('Google missing identity token is rejected before Firebase authentication', async () => {
  let exchanged = false;
  await assert.rejects(performGoogleSignIn({ request: async () => ({ type: 'success', data: { idToken: null } }), exchange: async () => { exchanged = true; } }));
  assert.equal(exchanged, false);
});

test('Google exchanges the returned identity token', async () => {
  const result = await performGoogleSignIn({ request: async () => ({ type: 'success', data: { idToken: 'google-token' } }), exchange: async token => { assert.equal(token, 'google-token'); return 'user'; } });
  assert.equal(result, 'user');
});

test('new login waits for logout cleanup and a failed operation does not block later attempts', async () => {
  const run = createAuthQueue();
  const order = [];
  let finishCleanup;
  const cleanup = new Promise(resolve => { finishCleanup = resolve; });
  const logout = run(async () => { order.push('logout'); await cleanup; order.push('cleaned'); });
  const login = run(async () => { order.push('login'); return 'user'; });
  await Promise.resolve();
  assert.deepEqual(order, ['logout']);
  finishCleanup();
  await logout;
  assert.equal(await login, 'user');
  assert.deepEqual(order, ['logout', 'cleaned', 'login']);
  await assert.rejects(run(async () => { throw new Error('cancelled'); }));
  assert.equal(await run(async () => 'next'), 'next');
});
