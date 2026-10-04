import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bindPlaceAutocomplete, fetchRoutePlace, loadPlacesLibrary } from './places.js';

function prediction({
  address = '123 Main St',
  text = address,
  location = true,
  wait,
} = {}) {
  const calls = [];
  const place = {
    formattedAddress: address,
    location: location ? { lat: () => 37.9, lng: () => -122.1 } : null,
    async fetchFields(options) {
      calls.push(options);
      await wait;
    },
  };
  return { calls, text: { toString: () => text }, toPlace: () => place };
}

function fixture() {
  const element = new EventTarget();
  element.value = 'Main';
  const selected = [];
  const changes = [];
  const errors = [];
  const pending = [];
  const binding = bindPlaceAutocomplete(element, {
    onChange: (value) => changes.push(value),
    onPlaceSelected: (value) => selected.push(value),
    onError: (error) => errors.push(error),
    onPendingChange: (value) => pending.push(value),
  });
  const select = (placePrediction) => {
    const event = new Event('gmp-select');
    event.placePrediction = placePrediction;
    element.dispatchEvent(event);
  };
  return { element, selected, changes, errors, pending, binding, select };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('fetches exactly the two Essentials fields from the session-linked Place', async () => {
  const result = prediction();
  assert.deepEqual(await fetchRoutePlace(result), {
    address: '123 Main St',
    coordinates: { lat: 37.9, lng: -122.1 },
  });
  assert.deepEqual(result.calls, [{ fields: ['formattedAddress', 'location'] }]);
});

test('uses prediction text without fetching displayName, and rejects missing coordinates', async () => {
  assert.equal(
    (await fetchRoutePlace(prediction({ address: '', text: 'Prediction address' })))
      .address,
    'Prediction address',
  );
  await assert.rejects(
    fetchRoutePlace(prediction({ location: false })),
    /no routing location/,
  );
});

test('preserves the business name in the input and selected route label without extra fields', async () => {
  const f = fixture();
  const label = 'San Francisco International Airport (SFO), San Francisco, CA, USA';
  const result = prediction({ address: 'San Francisco, CA 94128, USA', text: label });
  f.select(result);
  await settle();
  assert.equal(f.element.value, label);
  assert.deepEqual(f.selected, [
    {
      address: label,
      coordinates: { lat: 37.9, lng: -122.1 },
    },
  ]);
  assert.deepEqual(result.calls, [{ fields: ['formattedAddress', 'location'] }]);
});

test('falls back to the formatted address when prediction text is blank or missing', async () => {
  const blank = prediction({ text: '   ' });
  const missing = prediction();
  delete missing.text;
  for (const result of [blank, missing]) {
    assert.equal((await fetchRoutePlace(result)).address, '123 Main St');
  }
});

test('selection updates address and coordinates and releases pending state', async () => {
  const f = fixture();
  f.select(prediction());
  assert.deepEqual(f.changes, ['Main']);
  assert.deepEqual(f.pending, [true]);
  await settle();
  assert.equal(f.element.value, '123 Main St');
  assert.equal(f.selected.length, 1);
  assert.deepEqual(f.pending, [true, false]);
});

test('typing, external clearing, and unmount ignore stale details responses', async () => {
  for (const action of ['input', 'clear', 'dispose']) {
    const f = fixture();
    const deferred = Promise.withResolvers();
    f.select(prediction({ wait: deferred.promise }));
    if (action === 'input') {
      f.element.value = 'Different address';
      f.element.dispatchEvent(new Event('input'));
      assert.deepEqual(f.changes, ['Main', 'Different address']);
    } else if (action === 'clear') {
      f.binding.setValue('');
      assert.equal(f.element.value, '');
    } else {
      f.binding.dispose();
    }
    deferred.resolve();
    await settle();
    assert.deepEqual(f.selected, []);
    assert.deepEqual(f.errors, []);
  }
});

test('newer selections win over slower earlier selections', async () => {
  const f = fixture();
  const deferred = Promise.withResolvers();
  f.select(prediction({ address: 'Old', wait: deferred.promise }));
  f.select(prediction({ address: 'New' }));
  await settle();
  deferred.resolve();
  await settle();
  assert.equal(f.selected.length, 1);
  assert.equal(f.element.value, 'New');
});

test('failed details release pending state and preserve typed-address fallback', async () => {
  const f = fixture();
  f.select(prediction({ location: false }));
  await settle();
  assert.equal(f.errors.length, 1);
  assert.equal(f.element.value, 'Main');
  assert.deepEqual(f.selected, []);
  assert.deepEqual(f.pending, [true, false]);
  f.element.dispatchEvent(new Event('gmp-error'));
  assert.equal(f.errors.length, 2);
});

test('loads the API once for both inputs and retries a failed library import', async () => {
  let imports = 0;
  const library = {};
  globalThis.window = {
    google: {
      maps: {
        async importLibrary(name) {
          assert.equal(name, 'places');
          imports += 1;
          if (imports === 1) {
            throw new Error('Offline');
          }
          return library;
        },
      },
    },
  };
  try {
    const first = loadPlacesLibrary();
    assert.equal(loadPlacesLibrary(), first);
    await assert.rejects(first, /Offline/);
    assert.equal(await loadPlacesLibrary(), library);
    assert.equal(await loadPlacesLibrary(), library);
    assert.equal(imports, 2);
  } finally {
    delete globalThis.window;
  }
});
