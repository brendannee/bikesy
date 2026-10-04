import assert from 'node:assert/strict';
import { test } from 'node:test';

async function fixture(t, name) {
  const scripts = [];
  const imports = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({
      remove() {
        this.removed = true;
      },
    }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  t.after(() => {
    delete globalThis.window;
    delete globalThis.document;
  });
  const { loadGoogleMapsLibrary } = await import(`./google-maps.js?test=${name}`);
  const ready = (script) => {
    window.google = {
      maps: {
        async importLibrary(library) {
          imports.push(library);
          return { library };
        },
      },
    };
    window[new URL(script.src).searchParams.get('callback')]();
  };
  return { scripts, imports, ready, load: loadGoogleMapsLibrary };
}

test('Places and geocoding share one script when requested concurrently', async (t) => {
  const f = await fixture(t, 'concurrent');
  const geocoding = f.load('geocoding');
  const places = f.load('places');
  assert.equal(f.load('geocoding'), geocoding);
  assert.equal(f.scripts.length, 1);
  f.ready(f.scripts[0]);
  assert.deepEqual(await Promise.all([geocoding, places]), [
    { library: 'geocoding' },
    { library: 'places' },
  ]);
  assert.deepEqual(f.imports, ['geocoding', 'places']);
});

test('a failed script load can be retried by either service', async (t) => {
  const f = await fixture(t, 'script-retry');
  const results = Promise.allSettled([f.load('places'), f.load('geocoding')]);
  f.scripts[0].onerror();
  assert.deepEqual(
    (await results).map((result) => result.status),
    ['rejected', 'rejected'],
  );
  assert.equal(f.scripts[0].removed, true);
  const retry = f.load('geocoding');
  assert.equal(f.scripts.length, 2);
  f.ready(f.scripts[1]);
  assert.deepEqual(await retry, { library: 'geocoding' });
});

test('a failed Places import does not block geocoding or duplicate the Maps script', async (t) => {
  const f = await fixture(t, 'library-retry');
  const places = f.load('places');
  f.ready(f.scripts[0]);
  window.google.maps.importLibrary = async (name) => {
    if (name === 'places') {
      throw new Error('Places unavailable');
    }
    return { library: name };
  };
  await assert.rejects(places, /Places unavailable/);
  assert.deepEqual(await f.load('geocoding'), { library: 'geocoding' });
  window.google.maps.importLibrary = async (name) => ({ library: name });
  assert.deepEqual(await f.load('places'), { library: 'places' });
  assert.equal(f.scripts.length, 1);
});
