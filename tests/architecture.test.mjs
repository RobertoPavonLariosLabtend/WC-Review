import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const sourceRoot = resolve('src');
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const path = join(directory, item.name);
    return item.isDirectory() ? files(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}
const modules = files(sourceRoot).map(path => {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require') && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { path, name: relative(sourceRoot, path), imports };
});
const nativeAuthSdk = specifier => /^(@react-native-firebase\/|@react-native-google-signin\/|expo-constants$)/.test(specifier);

test('domain and use cases depend only on their feature domain/use cases', () => {
  for (const module of modules.filter(module => /^features\/[^/]+\/(domain|use-cases)\//.test(module.name))) {
    const feature = module.name.split('/')[1];
    for (const specifier of module.imports) {
      assert.ok(specifier.startsWith('.'), `${module.name} imports external dependency ${specifier}`);
      const target = relative(sourceRoot, resolve(dirname(module.path), specifier));
      assert.ok(target.startsWith(`features/${feature}/domain/`) || target.startsWith(`features/${feature}/use-cases/`), `${module.name} depends on outer layer ${target}`);
    }
  }
});

test('native auth SDK dependencies stay inside the auth repository', () => {
  for (const module of modules) {
    for (const specifier of module.imports.filter(nativeAuthSdk)) {
      assert.ok(module.name.startsWith('features/auth/repository/'), `${module.name} imports SDK ${specifier}`);
    }
  }
});

test('only composition wires repositories from outside their own layer', () => {
  for (const module of modules) {
    for (const specifier of module.imports.filter(value => value.startsWith('.'))) {
      const target = relative(sourceRoot, resolve(dirname(module.path), specifier));
      if (/^features\/[^/]+\/repository\//.test(target)) {
        const repositoryRoot = target.split('/').slice(0, 3).join('/') + '/';
        assert.ok(module.name.startsWith('composition/') || module.name.startsWith(repositoryRoot), `${module.name} bypasses use cases to import ${target}`);
      }
    }
  }
});

test('repositories never depend on UI or use cases', () => {
  for (const module of modules.filter(module => /^features\/[^/]+\/repository\//.test(module.name))) {
    for (const specifier of module.imports.filter(value => value.startsWith('.'))) {
      const target = relative(sourceRoot, resolve(dirname(module.path), specifier));
      assert.ok(!/^features\/[^/]+\/(ui|use-cases)\//.test(target), `${module.name} has outward dependency ${target}`);
    }
  }
});
