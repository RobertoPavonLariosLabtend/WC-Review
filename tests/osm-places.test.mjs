import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_PLACE_BOUNDS as bounds, MAX_PLACES } from '../src/features/main-screen/domain/models.ts';
import { createMainUseCases } from '../src/features/main-screen/use-cases/index.ts';
import { mapOsmElement } from '../src/features/main-screen/repository/osm-mapping.ts';
import { createOverpassPlacesRepository, overpassQuery } from '../src/features/main-screen/repository/overpass-places-repository.ts';
import { loadCommonsPhoto, resolveOsmPhoto } from '../src/features/main-screen/repository/commons-photo.ts';
import { createPlacesLoader } from '../src/features/main-screen/ui/places-loader.ts';

const signal = () => new AbortController().signal;
const element = (id = 1, tags = {}) => ({ type: 'node', id, lat: 40.4168, lon: -3.7038, tags: { name: 'Local', amenity: 'restaurant', ...tags } });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('OSM nodes/ways/relations map stable IDs and partial factual details without inventing toilets', () => {
  const mapped = mapOsmElement(element(2, { 'name:es': 'Nombre español', 'addr:street': 'Calle', 'addr:housenumber': '4', 'addr:city': 'Madrid', 'description:es': 'Texto', opening_hours: 'Mo-Fr 09:00-18:00', website: 'https://example.org', toilets: 'yes', 'toilets:access': 'customers', 'toilets:wheelchair': 'limited' }), bounds);
  assert.equal(mapped.details.id, 'osm-node-2');
  assert.equal(mapped.details.name, 'Nombre español');
  assert.equal(mapped.details.address, 'Calle 4, Madrid');
  assert.equal(mapped.details.description, 'Texto');
  assert.equal(mapped.details.openingHours, 'Mo-Fr 09:00-18:00');
  assert.equal(mapped.details.toilets.access, 'customers');
  assert.ok(mapped.details.attributions.some(a => a.uri.endsWith('/node/2')));
  assert.equal(mapOsmElement(element(), bounds).details.toilets.availability, undefined);
  assert.equal(mapOsmElement(element(3, { name: '', amenity: 'toilets', access: 'private' }), bounds).details.toilets.access, 'private');
  for (const type of ['way', 'relation']) {
    const info = mapOsmElement({ ...element(), type, lat: undefined, lon: undefined, center: { lat: 40.4168, lon: -3.7038 } }, bounds);
    assert.equal(info.details.id, `osm-${type}-1`);
  }
});

test('malformed/off-area OSM elements and arbitrary image/site URLs are rejected or ignored', () => {
  for (const bad of [null, {}, { ...element(), type: 'user' }, { ...element(), id: -1 }, { ...element(), lat: 99 }, { ...element(), lon: NaN }, { ...element(), lat: '40.4168' }, element(1, { name: '' })]) assert.equal(mapOsmElement(bad, bounds), undefined);
  const info = mapOsmElement(element(1, { website: 'javascript:alert(1)', image: 'https://untrusted.example/photo.jpg', wikimedia_commons: 'https://untrusted.example/category' }), bounds);
  assert.equal(info.details.website, undefined);
  assert.equal(info.details.photo, undefined);
  assert.equal(mapOsmElement(element(1, { image: 'File:Example.jpg' }), bounds).details.photo.resource, 'places/osm-node-1/photos/commons');
});

test('bbox use case prevents invalid/worldwide queries before reaching repository', async () => {
  let calls = 0;
  const cases = createMainUseCases({ listPlaces: async () => { calls++; return []; } }, {});
  for (const bad of [{ ...bounds, north: NaN }, { ...bounds, west: bounds.east }, { ...bounds, north: 95 }]) await assert.rejects(cases.listPlaces(signal(), bad), { code: 'invalid-selection' });
  await assert.rejects(cases.listPlaces(signal(), { ...bounds, north: bounds.south + 1 }), { code: 'area-too-large' });
  assert.equal(calls, 0);
  assert.match(overpassQuery(bounds), /out body center 300;/);
  assert.match(overpassQuery(bounds), /40\.409,-3\.714,40\.425,-3\.694/);
});

test('Overpass caches a bounded query and resolves details without more requests', async () => {
  let calls = 0, time = 10000;
  const repository = createOverpassPlacesRepository({ now: () => time, fetcher: async (url, options) => {
    calls++;
    assert.equal(url, 'https://overpass-api.de/api/interpreter');
    assert.equal(options.method, 'POST');
    assert.match(options.headers['User-Agent'], /WCReview/);
    assert.equal(options.headers.Authorization, undefined);
    assert.match(decodeURIComponent(options.body), /\[timeout:20\]/);
    return json({ elements: [element(), element(), { ...element(2), lat: 99 }] });
  } });
  const first = await repository.listPlaces(signal(), bounds);
  assert.equal(first.length, 1);
  first[0].name = 'Changed';
  assert.equal((await repository.listPlaces(signal(), bounds))[0].name, 'Local');
  const details = await repository.getDetails('osm-node-1', signal());
  details.name = 'Changed';
  assert.equal((await repository.getDetails('osm-node-1', signal())).name, 'Local');
  assert.equal(calls, 1);
  await assert.rejects(repository.listPlaces(signal(), { ...bounds, north: bounds.north + 0.001 }), { code: 'rate-limit' });
  time += 300001;
  await repository.listPlaces(signal(), bounds);
  assert.equal(calls, 2);
});

test('Overpass caps output and does not treat error remarks as an empty successful area', async () => {
  const repository = createOverpassPlacesRepository({ fetcher: async () => json({ elements: Array.from({ length: 400 }, (_, i) => element(i + 1)) }) });
  assert.equal((await repository.listPlaces(signal())).length, MAX_PLACES);
  for (const response of [{ remark: 'runtime error: timeout', elements: [] }, { error: 'bad' }, null]) {
    const broken = createOverpassPlacesRepository({ fetcher: async () => json(response) });
    await assert.rejects(broken.listPlaces(signal()), { code: 'unavailable' });
  }
});

test('provider cooldown after 429/406 prevents repeat requests and network failures remain retryable', async () => {
  for (const status of [429, 406]) {
    let time = 10000, calls = 0;
    const repo = createOverpassPlacesRepository({ now: () => time, fetcher: async () => { calls++; return json({}, status); } });
    await assert.rejects(repo.listPlaces(signal()), { code: 'rate-limit' });
    time += 5001;
    await assert.rejects(repo.listPlaces(signal()), { code: 'rate-limit' });
    assert.equal(calls, 1);
    time += 60000;
    await assert.rejects(repo.listPlaces(signal()), { code: 'rate-limit' });
    assert.equal(calls, 2);
  }
  const repo = createOverpassPlacesRepository({ fetcher: async () => { throw new TypeError('Network'); } });
  await assert.rejects(repo.listPlaces(signal()), { code: 'unavailable' });
});

test('aborted requests cannot populate repository cache even when transport resolves late', async () => {
  const late = deferred(); let time = 10000, calls = 0;
  const repo = createOverpassPlacesRepository({ now: () => time, fetcher: () => { calls++; return late.promise; } });
  const controller = new AbortController();
  const loading = repo.listPlaces(controller.signal);
  controller.abort(); late.resolve(json({ elements: [element()] }));
  await assert.rejects(loading, { name: 'AbortError' });
  await assert.rejects(repo.getDetails('osm-node-1', signal()), { code: 'unavailable' });
  time += 5001;
  await repo.listPlaces(signal());
  assert.equal(calls, 2);
});

const photoInfo = () => ({ thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Test.jpg/960px-Test.jpg', mime: 'image/jpeg', extmetadata: { Artist: { value: '<a href="https://example.org">Ana &amp; Luis</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' }, LicenseUrl: { value: 'http://creativecommons.org/licenses/by-sa/4.0/' } } });
test('Commons metadata preserves attribution/license and rejects unsafe or unlicensed images', async () => {
  const fetcher = info => async url => {
    assert.ok(url.startsWith('https://commons.wikimedia.org/w/api.php?'));
    assert.equal(new URL(url).searchParams.get('titles'), 'File:Test.jpg');
    return json({ query: { pages: [{ imageinfo: [info] }] } });
  };
  const photo = await loadCommonsPhoto('File:Test.jpg', fetcher(photoInfo()), signal());
  assert.match(photo.authors[0].name, /Ana & Luis/);
  assert.equal(photo.authors[1].uri, 'https://creativecommons.org/licenses/by-sa/4.0/');
  const currentThumb = await loadCommonsPhoto('File:Test.jpg', fetcher({ ...photoInfo(), thumburl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Test.jpg/960px-Test.jpg?utm_source=commons.wikimedia.org' }), signal());
  assert.equal(currentThumb.uri, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Test.jpg/960px-Test.jpg');
  for (const bad of [{ ...photoInfo(), thumburl: 'https://evil.example/photo.jpg' }, { ...photoInfo(), mime: 'image/svg+xml' }, { ...photoInfo(), extmetadata: {} }, { ...photoInfo(), extmetadata: { ...photoInfo().extmetadata, LicenseUrl: { value: 'https://example.org/all-rights-reserved' } } }]) await assert.rejects(loadCommonsPhoto('File:Test.jpg', fetcher(bad), signal()), { code: 'unavailable' });
});

test('OSM photo lookup is bound to its place and cached only after successful resolution', async () => {
  let photoRequests = 0;
  const repo = createOverpassPlacesRepository({ fetcher: async url => url.includes('overpass') ? json({ elements: [element(1, { wikimedia_commons: 'File:Test.jpg' })] }) : (photoRequests++, json({ query: { pages: [{ imageinfo: [photoInfo()] }] } })) });
  await repo.listPlaces(signal());
  const details = await repo.getDetails('osm-node-1', signal());
  await assert.rejects(repo.getPhoto('osm-node-1', { resource: 'places/other/photos/commons' }, signal()), { code: 'invalid-selection' });
  for (let i = 0; i < 2; i++) await repo.getPhoto('osm-node-1', details.photo, signal());
  assert.equal(photoRequests, 1);
});

test('OSM retains exact category/entity associations and ignores brand or malformed Wikidata IDs', () => {
  const mapped = mapOsmElement(element(1, { wikimedia_commons: 'Category:Teatro Alfil (Madrid)', image: 'File:Alfil.jpg', wikidata: 'Q6139590', 'brand:wikidata': 'Q999' }), bounds);
  assert.deepEqual(mapped.photoSource, { file: 'File:Alfil.jpg', category: 'Category:Teatro Alfil (Madrid)', wikidata: 'Q6139590' });
  assert.ok(mapped.details.photo);
  const brand = mapOsmElement(element(2, { 'brand:wikidata': 'Q999', wikidata: 'Q1|Q2' }), bounds);
  assert.equal(brand.photoSource, undefined);
  assert.equal(brand.details.photo, undefined);
});

const statement = (value, rank = 'normal') => ({ rank, mainsnak: { snaktype: 'value', datavalue: { type: 'string', value } } });
test('Wikidata P18 resolves the linked entity preferred image and preserves its actual file credit', async () => {
  const calls = [];
  const photo = await resolveOsmPhoto({ wikidata: 'Q123' }, async url => {
    calls.push(url);const params = new URL(url).searchParams;
    if (new URL(url).hostname === 'www.wikidata.org') {
      assert.equal(params.get('ids'), 'Q123');
      return json({ entities: { Q123: { claims: { P18: [statement('Wrong.jpg', 'deprecated'), statement('Other.jpg'), statement('Real.jpg', 'preferred')] } } } });
    }
    assert.equal(params.get('titles'), 'File:Real.jpg');
    return json({ query: { pages: [{ imageinfo: [photoInfo()] }] } });
  }, signal());
  assert.equal(calls.length, 2);
  assert.match(photo.authors[0].uri, /File%3AReal.jpg/);
});

test('linked Commons category is one bounded metadata request and skips unlicensed/non-raster files', async () => {
  let calls = 0;
  const photo = await resolveOsmPhoto({ category: 'Category:Exact place' }, async url => {
    calls++;const params = new URL(url).searchParams;
    assert.equal(params.get('generator'), 'categorymembers');
    assert.equal(params.get('gcmtitle'), 'Category:Exact place');
    assert.equal(params.get('gcmtype'), 'file');
    assert.equal(params.get('gcmlimit'), '6');
    return json({ query: { pages: [
      { title: 'File:Logo.svg', imageinfo: [photoInfo()] },
      { title: 'File:Unlicensed.jpg', imageinfo: [{ ...photoInfo(), extmetadata: {} }] },
      { title: 'File:Facade.jpg', imageinfo: [photoInfo()] },
    ] } });
  }, signal());
  assert.equal(calls, 1);
  assert.match(photo.authors[0].uri, /Facade.jpg/);
});

test('missing direct image falls through entity P373 category without searching by name', async () => {
  const calls = [];
  const photo = await resolveOsmPhoto({ file: 'File:Missing.jpg', wikidata: 'Q123' }, async url => {
    calls.push(url);const params = new URL(url).searchParams;
    if (params.get('titles')) return json({ query: { pages: [{ missing: true }] } });
    if (params.get('ids')) return json({ entities: { Q123: { claims: { P373: [statement('Exact place')] } } } });
    assert.equal(params.get('gcmtitle'), 'Category:Exact place');
    return json({ query: { pages: [{ title: 'File:Photo.jpg', imageinfo: [photoInfo()] }] } });
  }, signal());
  assert.equal(calls.length, 3);
  assert.ok(calls.every(url => !new URL(url).searchParams.has('search')));
  assert.match(photo.authors[0].uri, /Photo.jpg/);
});

test('photo lookup abort/throttling stop fallbacks; unassociated places never issue image queries', async () => {
  for (const status of [429, 406]) {
    let calls = 0;
    await assert.rejects(resolveOsmPhoto({ file: 'File:Test.jpg', category: 'Category:Place', wikidata: 'Q123' }, async () => { calls++;return json({}, status); }, signal()), { code: 'rate-limit' });
    assert.equal(calls, 1);
  }
  const controller = new AbortController();let calls = 0;
  await assert.rejects(resolveOsmPhoto({ wikidata: 'Q123', category: 'Category:Place' }, async () => { calls++;controller.abort();return json({}); }, controller.signal), { name: 'AbortError' });
  assert.equal(calls, 1);
  await assert.rejects(resolveOsmPhoto({}, async () => { throw new Error('Must not fetch'); }, signal()), { code: 'unavailable' });
});

test('category photo is cached by complete association, without cross-place name matches', async () => {
  let calls = 0;
  const repo = createOverpassPlacesRepository({ fetcher: async url => url.includes('overpass') ? json({ elements: [element(1, { wikimedia_commons: 'Category:Alfil' }), element(2, { wikimedia_commons: 'Category:Different' })] }) : (calls++, json({ query: { pages: [{ title: 'File:Photo.jpg', imageinfo: [photoInfo()] }] } })) });
  await repo.listPlaces(signal());
  for (const id of ['osm-node-1', 'osm-node-1', 'osm-node-2']) {
    const details = await repo.getDetails(id, signal());await repo.getPhoto(id, details.photo, signal());
  }
  assert.equal(calls, 2);
});

test('area loader ignores old results, preserves points on failure and cancels session disposal', async () => {
  const old = deferred(), newer = deferred(), states = [];
  let calls = 0;
  const loader = createPlacesLoader({ listPlaces: () => ++calls === 1 ? old.promise : newer.promise }, state => states.push(state));
  const first = loader.search(bounds), second = loader.search(bounds);
  newer.resolve([{ placeId: 'new' }]); await second;
  old.resolve([{ placeId: 'old' }]); await first;
  assert.equal(states.at(-1).places[0].placeId, 'new');
  const pending = deferred(); const disposed = [];
  const session = createPlacesLoader({ listPlaces: () => pending.promise }, state => disposed.push(state));
  const work = session.search(bounds); session.dispose(); pending.resolve([{ placeId: 'stale' }]); await work;
  assert.equal(disposed.length, 1);
  let fail = false; const retryStates = [];
  const retry = createPlacesLoader({ listPlaces: async () => { if (fail) throw Object.assign(new Error(), { code: 'rate-limit' }); return [{ placeId: 'keep' }]; } }, s => retryStates.push(s));
  await retry.search(bounds); fail = true; await retry.search(bounds);
  assert.equal(retryStates.at(-1).places[0].placeId, 'keep');
  assert.equal(retryStates.at(-1).error, 'rate-limit');
});
