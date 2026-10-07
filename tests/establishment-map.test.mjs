import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('MapLibre source selects only catalogue IDs and camera uses longitude/latitude with overlay padding', () => {
  const movements = [], selected = [], stopped = [];
  const reference = { current: null };
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: {
      useRef: () => ({ current: { easeTo: options => movements.push(options) } }),
      useMemo: factory => factory(), useEffect: effect => effect(),
      useImperativeHandle: (ref, factory) => { ref.current = factory(); },
    },
    '@maplibre/maplibre-react-native': { Map: 'Map', Camera: 'Camera', GeoJSONSource: 'Source', Layer: 'Layer' },
    'react-native': { StyleSheet: { absoluteFill: {} } },
  };
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync('src/features/main-screen/ui/EstablishmentMap.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, { module, exports: module.exports, require: name => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`); return mocks[name];
  } });
  const place = { placeId: 'own-id', name: 'Local', coordinate: { longitude: -3.7, latitude: 40.4 } };
  const padding = { top: 150, bottom: 350, left: 12, right: 12 };
  const tree = module.exports.EstablishmentMap({
    ref: reference, places: [place], selected: place, padding, onSelect: item => selected.push(item), onReady() {}, onError() {},
  });
  const source = tree.props.children.find(child => child.type === 'Source');
  for (const id of ['base-map-poi', undefined, 'own-id']) {
    source.props.onPress({ nativeEvent: { features: [{ properties: { placeId: id } }] }, stopPropagation: () => stopped.push(id) });
  }
  assert.deepEqual(selected, [place]);
  assert.equal(stopped.length, 3);
  assert.deepEqual(Array.from(movements[0].center), [-3.7, 40.4]);
  assert.equal(movements[0].padding, padding);
  reference.current.centerOn({ longitude: -4, latitude: 41 });
  assert.deepEqual(Array.from(movements.at(-1).center), [-4, 41]);
  assert.equal(movements.at(-1).zoom, 16);
  assert.equal(tree.props.attributionPosition.bottom, padding.bottom);
});
