import assert from 'node:assert/strict';
import test from 'node:test';
import { createMainUseCases } from '../src/features/main-screen/use-cases/index.ts';
import { createSelectionLoader } from '../src/features/main-screen/ui/selection-loader.ts';
import { createServicePlacesRepository } from '../src/features/main-screen/repository/service-places-repository.ts';
const place = id => ({ placeId: id, name: id, coordinate: { latitude: 40, longitude: -3 } });
const details = id => ({ id, name: id, attributions: [] });
function cases(overrides = {}, location = { getCurrentCoordinates: async () => ({ latitude: 40, longitude: -3 }) }) {
  return createMainUseCases({ getDetails: async id => details(id), getPhoto: async () => ({ uri: 'data:image/png;base64,YQ==', authors: [] }), ...overrides }, location);
}
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }

test('selection and details reject malformed identifiers and coordinates before repository access', () => {
  let calls = 0;
  const useCases = cases({ getDetails: () => { calls++; } });
  for (const id of ['', '../secret', 'x'.repeat(257)]) {
    assert.throws(() => useCases.select(place(id)), { code: 'invalid-selection' });
    assert.throws(() => useCases.getDetails(id, new AbortController().signal), { code: 'invalid-selection' });
  }
  assert.throws(() => useCases.select({ ...place('A'), coordinate: { latitude: 91, longitude: 0 } }));
  assert.throws(() => useCases.select({ ...place('A'), coordinate: { latitude: NaN, longitude: 0 } }));
  assert.equal(useCases.select({ ...place('A'), name: ' ' }).name, 'Establecimiento');
  assert.throws(() => useCases.getPhoto('A', { resource: 'places/B/photos/P', authors: [] }, new AbortController().signal), { code: 'invalid-selection' });
  assert.equal(calls, 0);
});

test('location is requested only by its use case and preserves denial', async () => {
  let calls = 0;
  const c = cases({}, { getCurrentCoordinates: async () => { calls++; throw Object.assign(new Error(), { code: 'location-denied' }); } });
  assert.equal(calls, 0);
  await assert.rejects(c.locate(), { code: 'location-denied' });
  assert.equal(calls, 1);
  await assert.rejects(cases({}, { getCurrentCoordinates: async () => ({ latitude: 0, longitude: Infinity }) }).locate(), { code: 'location-unavailable' });
});

test('a slow A cannot overwrite B, including providers that ignore cancellation', async () => {
  const a = deferred(), b = deferred(); const states = []; const signals = [];
  const loader = createSelectionLoader(cases({ getDetails: (id, signal) => { signals.push(signal); return id === 'A' ? a.promise : b.promise; } }), s => states.push(s));
  const first = loader.select(place('A')); const second = loader.select(place('B'));
  assert.equal(signals[0].aborted, true);
  b.resolve(details('B')); await second; a.resolve(details('A')); await first;
  assert.equal(states.at(-1).details.id, 'B');
  assert.equal(states.filter(s => s?.details?.id === 'A').length, 0);
});

test('close and session disposal invalidate details and photos, and new session is isolated', async () => {
  for (const action of ['clear', 'dispose']) {
    const pending = deferred(); const states = [];
    const loader = createSelectionLoader(cases({ getDetails: () => pending.promise }), s => states.push(s));
    const work = loader.select(place('A')); loader[action](); const length = states.length;
    pending.resolve(details('A')); await work; assert.equal(states.length, length);
    const fresh = []; await createSelectionLoader(cases(), s => fresh.push(s)).select(place('B'));
    assert.equal(fresh.at(-1).details.id, 'B');
  }
  const photo = deferred(), states = [];
  const loader = createSelectionLoader(cases({ getDetails: async () => ({ ...details('A'), photo: { resource: 'places/A/photos/P', authors: [] } }), getPhoto: () => photo.promise }), s => states.push(s));
  const work = loader.select(place('A')); await Promise.resolve(); loader.clear();
  photo.resolve({ uri: 'old', authors: [] }); await work; assert.equal(states.at(-1), null);
});

test('details errors offer retry; photo failure preserves details and clears loading', async () => {
  let fail = true; const states = [];
  const loader = createSelectionLoader(cases({ getDetails: async () => { if (fail) throw new Error(); return { ...details('A'), photo: { resource: 'places/A/photos/P', authors: [] } }; }, getPhoto: async () => { throw new Error(); } }), s => states.push(s));
  await loader.select(place('A')); assert.equal(states.at(-1).error, true);
  fail = false; await loader.select(place('A'));
  assert.equal(states.at(-1).details.id, 'A'); assert.equal(states.at(-1).photoLoading, undefined);
});

test('service adapter authenticates, encodes parameters, rejects session changes and unsafe photos', async () => {
  let id = 'one'; const session = async () => ({ id, token: 'private-token' });
  const repository = createServicePlacesRepository({ detailsUrl: 'https://example.com/details', photoUrl: 'https://example.com/photo' }, session, async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer private-token'); assert.ok(!url.includes('private-token'));
    assert.ok(url.includes('placeId=A'));
    return new Response(JSON.stringify(details('A')));
  });
  assert.equal((await repository.getDetails('A', new AbortController().signal)).id, 'A');
  const changed = createServicePlacesRepository({ detailsUrl: 'https://example.com/details' }, session, async () => { id = 'two'; return new Response(JSON.stringify(details('A'))); });
  await assert.rejects(changed.getDetails('A', new AbortController().signal), { code: 'unauthorized' });
  const unsafe = createServicePlacesRepository({ photoUrl: 'https://example.com/photo' }, session, async () => new Response(JSON.stringify({ uri: 'https://evil/?key=secret', authors: [] })));
  await assert.rejects(unsafe.getPhoto('A', { resource: 'places/A/photos/P', authors: [] }, new AbortController().signal));
  const missing = createServicePlacesRepository({}, session);
  await assert.rejects(missing.getDetails('A', new AbortController().signal), { code: 'unavailable' });
});
