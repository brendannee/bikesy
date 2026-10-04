import assert from 'node:assert/strict';
import { test } from 'node:test';
import { geocode, reverseGeocode } from './geocode.js';

test('browser geocoding preserves routing coordinates and reverse-address behavior', async (t) => {
  const requests = [];
  const imports = [];
  let response;
  let failure;
  globalThis.window = {
    google: {
      maps: {
        async importLibrary(name) {
          imports.push(name);
          return {
            Geocoder: class {
              async geocode(request) {
                requests.push(request);
                if (failure) {
                  throw failure;
                }
                return response;
              }
            },
          };
        },
      },
    },
  };
  t.after(() => {
    delete globalThis.window;
  });
  t.mock.method(globalThis, 'fetch', () => {
    assert.fail('Geocoding must not use the REST endpoint');
  });

  await t.test(
    'returns serializable coordinates and an address with minimal requests',
    async () => {
      const location = { lat: 37.9, lng: -122.1 };
      response = {
        results: [
          {
            formatted_address: '123 Main St',
            geometry: { location: { lat: () => location.lat, lng: () => location.lng } },
          },
        ],
      };
      const results = await Promise.all([
        geocode('123 Main St'),
        reverseGeocode(location),
      ]);
      assert.deepEqual(results, [location, '123 Main St']);
      assert.deepEqual(JSON.parse(JSON.stringify(results[0])), location);
      assert.deepEqual(requests, [
        { address: '123 Main St', fulfillOnZeroResults: true },
        { location, fulfillOnZeroResults: true },
      ]);
      assert.deepEqual(imports, ['geocoding']);
    },
  );

  await t.test('handles zero results for both directions', async () => {
    response = { results: [] };
    await assert.rejects(geocode('Unknown'), /No geocoding results/);
    assert.equal(await reverseGeocode({ lat: 0, lng: 0 }), 'Unknown Address');
  });

  await t.test(
    'rejects forward errors and returns a reverse-address fallback',
    async () => {
      failure = new Error('REQUEST_DENIED');
      await assert.rejects(geocode('123 Main St'), /REQUEST_DENIED/);
      assert.equal(await reverseGeocode({ lat: 0, lng: 0 }), 'Unable to get address');
    },
  );

  await t.test(
    'a failed request does not prevent later successful requests',
    async () => {
      failure = undefined;
      response = { results: [{ formatted_address: 'Recovered address' }] };
      assert.equal(await reverseGeocode({ lat: 0, lng: 0 }), 'Recovered address');
    },
  );
});
