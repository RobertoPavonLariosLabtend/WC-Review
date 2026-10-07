import assert from 'node:assert/strict';
import test from 'node:test';
import { createMainUseCases } from '../src/features/main-screen/use-cases/index.ts';
import { createSelectionLoader } from '../src/features/main-screen/ui/selection-loader.ts';
import { createCatalogPlacesRepository } from '../src/features/main-screen/repository/catalog-places-repository.ts';
import { catalogue } from '../src/features/main-screen/repository/catalogue.ts';
const place = id => ({ placeId: id, name: id, coordinate: { latitude: 40, longitude: -3 } });
const details = id => ({ id, name: id, attributions: [] });
function cases(overrides = {}, location = { getCurrentCoordinates: async () => ({ latitude: 40, longitude: -3 }) }) {
  return createMainUseCases({ listPlaces: async () => [], getDetails: async id => details(id), getPhoto: async () => ({ uri: 'data:image/png;base64,YQ==', authors: [] }), ...overrides }, location);
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

test('catalogue lists selectable places and delivers its own descriptions and credited photos', async () => {
  const repository = createCatalogPlacesRepository(catalogue, asset => `file:///photos/${asset}.jpg`);
  const signal = new AbortController().signal;
  const selections = await createMainUseCases(repository, {}).listPlaces(signal);
  assert.equal(selections.length, 2);
  for (const place of selections) {
    const info = await repository.getDetails(place.placeId, signal);
    assert.equal(info.name, place.name);
    assert.ok(info.description);
    assert.deepEqual(info.coordinate, place.coordinate);
    const photo = await repository.getPhoto(place.placeId, info.photo, signal);
    assert.ok(photo.uri.startsWith('file:///photos/'));
    assert.ok(photo.authors.some(author => author.uri.includes('creativecommons.org')));
  }
});

test('catalogue isolates data, supports missing photos/descriptions and rejects mismatched photos', async () => {
  const records = [{ id: 'A', name: 'Local', coordinate: { latitude: 40, longitude: -3 }, attributions: [] }];
  const repository = createCatalogPlacesRepository(records, () => { throw new Error('Must not resolve photo'); });
  const signal = new AbortController().signal;
  records[0].name = 'Changed';
  const info = await repository.getDetails('A', signal);
  assert.equal(info.name, 'Local');
  assert.equal(info.photo, undefined); assert.equal(info.description, undefined);
  info.coordinate.latitude = 90;
  assert.equal((await repository.getDetails('A', signal)).coordinate.latitude, 40);
  await assert.rejects(repository.getDetails('unknown', signal), { code: 'unavailable' });
  const full = createCatalogPlacesRepository(catalogue, () => 'file:///photo.jpg');
  await assert.rejects(full.getPhoto('botin', { resource: 'places/casa-labra/photos/main', authors: [] }, signal), { code: 'invalid-selection' });
  assert.throws(() => createCatalogPlacesRepository([...records, ...records], () => ''), /Duplicate/);
});

test('catalogue respects aborted loads and list use case validates marker coordinates', async () => {
  const repository = createCatalogPlacesRepository(catalogue, () => 'file:///photo.jpg');
  // RN has a smaller AbortSignal implementation than Node: no throwIfAborted.
  const signal = { aborted: true };
  await assert.rejects(repository.listPlaces(signal), { name: 'AbortError' });
  await assert.rejects(repository.getDetails('botin', signal), { name: 'AbortError' });
  const invalid = cases({ listPlaces: async () => [place('valid'), { ...place('bad'), coordinate: { latitude: 95, longitude: 0 } }] });
  await assert.rejects(invalid.listPlaces(new AbortController().signal), { code: 'invalid-selection' });
});
