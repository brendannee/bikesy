import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const modules = readdirSync(new URL('.', import.meta.url))
  .filter((name) => name.endsWith('.js'))
  .sort();

test('there is a module for each piece of the navigation library', () => {
  assert.deepEqual(modules, [
    'camera.js',
    'device.js',
    'ferrostar.js',
    'flags.js',
    'format.js',
    'geo.js',
    'heading.js',
    'icons.js',
    'layers.js',
    'navigator.js',
    'ride.js',
    'sim.js',
  ]);
});

// Server-side rendering imports every module, so nothing may touch a browser global
// while a module loads. Make any such access throw, then import them all.
test('importing the modules does not read browser globals', async (t) => {
  const names = [
    'window',
    'document',
    'navigator',
    'screen',
    'speechSynthesis',
    'localStorage',
  ];
  for (const name of names) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        throw new Error(`${name} read while importing`);
      },
    });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }
  for (const file of modules) {
    await assert.doesNotReject(import(new URL(file, import.meta.url)), file);
  }
});

test('navigator.js leaves Ferrostar to the caller', () => {
  const source = readFileSync(new URL('navigator.js', import.meta.url), 'utf8');
  const code = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.doesNotMatch(code, /\bimport\b/);
  assert.doesNotMatch(code, /\brequire\(/);
  assert.doesNotMatch(code, /@stadiamaps/);
});
