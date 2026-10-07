import assert from 'node:assert/strict';
import test from 'node:test';
import { createService, createHttpHandler, ServiceError } from '../src/service.mjs';
import { normalizeDetails, createPlacesProvider } from '../src/provider.mjs';
import { createSharedLimiter } from '../src/limiter.mjs';
const details = { id: 'A', name: 'Local', attributions: [], photo: { resource: 'places/A/photos/P', authors: [{ name: 'Autor', uri: 'https://example.com' }] } };
const request = query => ({ authorization: 'Bearer valid', query });
function setup(overrides = {}) {
  const calls = [];
  const service = createService({ verify: async () => ({ uid: 'user' }), limit: async (uid, kind) => calls.push(kind), provider: { details: async () => { calls.push('provider-details'); return details; }, photo: async () => { calls.push('provider-photo'); return { uri: 'data:image/png;base64,YQ==' }; } }, ...overrides });
  return { service, calls };
}
test('missing, invalid and revoked identity never reaches limits or provider', async () => {
  const { service, calls } = setup();
  await assert.rejects(service('details', { query: { placeId: 'A' } }), { status: 401 });
  assert.deepEqual(calls, []);
  const bad = setup({ verify: async () => { throw new Error(); } });
  await assert.rejects(bad.service('details', request({ placeId: 'A' })), { status: 401 }); assert.deepEqual(bad.calls, []);
});
test('malformed IDs, arrays, and foreign or traversal photos fail before provider', async () => {
  const { service, calls } = setup();
  for (const placeId of ['../A', '', ['A'], 'a'.repeat(257)]) await assert.rejects(service('details', request({ placeId })), { status: 400 });
  for (const photo of ['places/B/photos/P', 'places/A/photos/../P', ['places/A/photos/P']]) await assert.rejects(service('photo', request({ placeId: 'A', photo })), { status: 400 });
  assert.deepEqual(calls, []);
});
test('limit rejects before provider; membership and photo credits are enforced', async () => {
  const limited = setup({ limit: async () => { throw new ServiceError(429, 'rate-limit'); } });
  await assert.rejects(limited.service('details', request({ placeId: 'A' })), { status: 429 }); assert.deepEqual(limited.calls, []);
  const { service, calls } = setup();
  await assert.rejects(service('photo', request({ placeId: 'A', photo: 'places/A/photos/unknown' })), { status: 400 });
  assert.ok(!calls.includes('provider-photo'));
  const result = await service('photo', request({ placeId: 'A', photo: 'places/A/photos/P' }));
  assert.deepEqual(result.authors, details.photo.authors);
  assert.equal(calls.filter(c => c === 'details').length, 2);
});
test('normalization handles partial data and preserves provider summary and attribution', () => {
  assert.deepEqual(normalizeDetails('A', {}), { id: 'A', name: 'Establecimiento', coordinate: undefined, address: undefined, description: undefined, photo: undefined, attributions: [] });
  const result = normalizeDetails('A', { displayName: { text: 'Local' }, editorialSummary: { text: 'Resumen original' }, attributions: [{ provider: 'Proveedor', providerUri: 'https://example.com' }], photos: [{ name: 'places/A/photos/P', authorAttributions: [{ displayName: 'Autor', uri: '//example.com' }] }] });
  assert.equal(result.description, 'Resumen original'); assert.equal(result.attributions[0].name, 'Proveedor'); assert.equal(result.photo.authors[0].name, 'Autor'); assert.equal(result.photo.authors[0].uri, 'https://example.com');
});
test('provider uses explicit Spanish fields, bounds photos and rejects provider failures', async () => {
  const provider = createPlacesProvider(() => 'server-key', async (url, options) => {
    assert.equal(options.headers['X-Goog-Api-Key'], 'server-key'); assert.ok(options.signal);
    if (url.includes('/media')) { assert.ok(url.includes('maxWidthPx=800&maxHeightPx=800')); return new Response('image', { headers: { 'Content-Type': 'image/jpeg' } }); }
    assert.ok(url.includes('languageCode=es')); assert.equal(options.headers['X-Goog-FieldMask'], 'id,displayName,location,formattedAddress,editorialSummary,photos,attributions');
    return new Response('{}');
  });
  assert.equal((await provider.details('A')).id, 'A');
  assert.ok((await provider.photo('places/A/photos/P')).uri.startsWith('data:image/jpeg;base64,'));
  for (const response of [new Response('bad', { status: 403 }), new Response('html', { headers: { 'Content-Type': 'text/html' } }), new Response('large', { headers: { 'Content-Type': 'image/png', 'Content-Length': String(6*1024*1024) } }), new Response(new Uint8Array(5*1024*1024+1), { headers: { 'Content-Type': 'image/png' } })]) {
    await assert.rejects(createPlacesProvider(() => 'key', async () => response).photo('places/A/photos/P'), error => error instanceof ServiceError);
  }
  await assert.rejects(createPlacesProvider(() => 'key', async () => { throw new Error('timeout'); }).details('A'), { code: 'provider-unavailable' });
});
test('shared transactional limiter isolates users, endpoints and minute windows across instances', async () => {
  const records = new Map(); let timestamp = 0; let queue = Promise.resolve();
  const db = { collection: () => ({ doc: id => id }), runTransaction: action => { const operation = queue.then(() => action({ get: async ref => ({ data: () => records.get(ref) }), set: (ref, data) => records.set(ref, data) })); queue = operation.catch(() => {}); return operation; } };
  const a = createSharedLimiter(db, { details: 2, photo: 1 }, () => timestamp), b = createSharedLimiter(db, { details: 2, photo: 1 }, () => timestamp);
  const attempts = await Promise.allSettled([a('u', 'details'), b('u', 'details'), a('u', 'details')]);
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 2);
  assert.equal(attempts.find(r => r.status === 'rejected').reason.status, 429);
  await a('other', 'details'); await a('u', 'photo'); timestamp = 60000; await b('u', 'details');
  assert.ok([...records.values()].every(r => r.expiresAt instanceof Date));
});
test('HTTP wrapper rejects methods, disables cache and hides upstream secrets', async () => {
  const outputs = [];
  const res = { set: (...args) => outputs.push(args), status: code => { outputs.push(code); return res; }, json: body => outputs.push(body) };
  const handler = createHttpHandler('details', async () => { throw new Error('secret-provider-key'); });
  await handler({ method: 'POST' }, res); assert.ok(outputs.includes(405));
  await handler({ method: 'GET', headers: {}, query: {} }, res); assert.ok(outputs.includes(503)); assert.deepEqual(outputs.at(-1), { code: 'unavailable' });
  assert.ok(!JSON.stringify(outputs).includes('secret-provider-key'));
});
