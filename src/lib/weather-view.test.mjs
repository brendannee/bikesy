import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { loadBindings, transform } = require('next/dist/build/swc');
await loadBindings();
const { code } = await transform(
  readFileSync(new URL('../components/Weather.js', import.meta.url), 'utf8'),
  {
    filename: 'Weather.js',
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      transform: { react: { runtime: 'automatic' } },
    },
    module: { type: 'commonjs' },
  },
);
const tick = () => new Promise((resolve) => setImmediate(resolve));
function harness() {
  let index = 0,
    effect,
    cleanup;
  const state = [],
    calls = [],
    errors = [];
  const request = (service) => (lat, lng) =>
    new Promise((resolve, reject) => calls.push({ service, lat, lng, resolve, reject }));
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    console: { error: (e) => errors.push(e) },
    require: (id) => {
      if (id === 'react')
        return {
          useState: () => {
            const slot = index++;
            return [
              state[slot],
              (value) => {
                state[slot] = value;
              },
            ];
          },
          useEffect: (fn) => {
            effect = fn;
          },
        };
      if (id === '../lib/weather') return { getWeather: request('weather') };
      if (id === '../lib/airquality') return { getAirQuality: request('aqi') };
      return require(id);
    },
  });
  return {
    state,
    calls,
    errors,
    render(lat, lng) {
      cleanup?.();
      index = 0;
      module.exports.default({ lat, lng });
      cleanup = effect();
    },
    unmount() {
      cleanup?.();
    },
  };
}
const weather = (temp) => ({
  main: { temp, humidity: 42 },
  weather: [{ main: 'Clear' }],
});

test('a late weather response cannot overwrite a new location or start its stale AQI request', async () => {
  const h = harness();
  h.render(1, 2);
  const old = h.calls[0];
  h.render(3, 4);
  h.calls[1].resolve(weather(72));
  await tick();
  h.calls[2].resolve([{ aqi: 20, categoryNumber: 1, categoryName: 'Good' }]);
  await tick();
  old.resolve(weather(30));
  await tick();
  assert.equal(h.state[0].temperature, 72);
  assert.equal(h.state[1].aqi, 20);
  assert.equal(h.calls.length, 3);
  assert.equal(h.errors.length, 0);
});

test('changing location clears old display; late AQI and unmounted results are ignored', async () => {
  const h = harness();
  h.render(1, 2);
  h.calls[0].resolve(weather(60));
  await tick();
  const oldAqi = h.calls[1];
  h.render(3, 4);
  assert.equal(h.state[0], undefined);
  assert.equal(h.state[1], undefined);
  oldAqi.resolve([{ aqi: 100 }]);
  await tick();
  assert.equal(h.state[1], undefined);
  h.unmount();
  h.calls[2].resolve(weather(90));
  await tick();
  assert.equal(h.state[0], undefined);
  assert.equal(h.calls.length, 3);
});
