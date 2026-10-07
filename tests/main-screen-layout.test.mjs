import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Render the real component with a deferred state queue: React may release an
// onLayout event before it invokes the functional updater, especially in dev.
function renderMainScreen() {
  const pending = [];
  let size;
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: {
      useEffect: () => {},
      useMemo: factory => factory(),
      useRef: value => ({ current: value }),
      useState: initial => {
        const value = typeof initial === 'function' ? initial() : initial;
        if (stateIndex++ === 0) {
          size = value;
          return [value, update => pending.push(update)];
        }
        return [value, () => {}];
      },
    },
    'react-native': {
      View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
      StyleSheet: { create: styles => styles, absoluteFill: {} },
    },
    './EstablishmentMap': { EstablishmentMap: 'EstablishmentMap' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 20 }) },
    '../../auth/ui/AuthProvider': { useAuth: () => ({ user: { id: 'user' }, useCases: {} }) },
    './EstablishmentCard': { EstablishmentCard: 'EstablishmentCard' },
    './selection-loader': { createSelectionLoader: () => ({}) },
  };
  const { outputText } = ts.transpileModule(readFileSync('src/features/main-screen/ui/MainScreen.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports, require: name => {
    assert.ok(name in mocks, `Unexpected component dependency: ${name}`);
    return mocks[name];
  } });
  const tree = module.exports.default({ useCases: {} });
  const header = tree.props.children.find(child => child?.props?.onLayout);
  return {
    measureScreen: tree.props.onLayout,
    measureHeader: header.props.onLayout,
    flush: () => { for (const update of pending.splice(0)) size = update(size); return size; },
  };
}

test('screen and header measurements survive released events and preserve both queued dimensions', () => {
  const screen = renderMainScreen();
  const fullEvent = { nativeEvent: { layout: { height: 720 } } };
  const headerEvent = { nativeEvent: { layout: { height: 64 } } };
  screen.measureScreen(fullEvent);
  screen.measureHeader(headerEvent);
  fullEvent.nativeEvent = null;
  headerEvent.nativeEvent = null;
  const measured = screen.flush();
  assert.equal(measured.height, 720);
  assert.equal(measured.header, 64);
});

test('repeated layout measurements preserve state identity and avoid redundant renders', () => {
  const screen = renderMainScreen();
  screen.measureScreen({ nativeEvent: { layout: { height: 720 } } });
  screen.measureHeader({ nativeEvent: { layout: { height: 64 } } });
  const measured = screen.flush();
  screen.measureScreen({ nativeEvent: { layout: { height: 720 } } });
  screen.measureHeader({ nativeEvent: { layout: { height: 64 } } });
  assert.equal(screen.flush(), measured);
});
