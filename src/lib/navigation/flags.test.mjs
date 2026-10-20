import assert from 'node:assert/strict';
import { test } from 'node:test';
import { devFlags, navigationEnabled } from './flags.js';
import defaults from '../../appConfig/defaults.js';
import sf from '../../appConfig/sf.js';
import contracosta from '../../appConfig/contracosta.js';
import tahoe from '../../appConfig/tahoe.js';

test('navigation is off by default and on or off for any URL when set to a boolean', () => {
  for (const search of ['', '?nav=1', '?sim=1&nav=1']) {
    assert.equal(navigationEnabled(false, search), false);
    assert.equal(navigationEnabled(undefined, search), false);
    assert.equal(navigationEnabled(true, search), true);
  }
});

test("'url' offers navigation only with ?nav=1", () => {
  assert.equal(navigationEnabled('url', ''), false);
  assert.equal(navigationEnabled('url', '?sim=1'), false);
  assert.equal(navigationEnabled('url', '?nav=0'), false);
  assert.equal(navigationEnabled('url', '?nav'), false);
  assert.equal(navigationEnabled('url', '?nav=1'), true);
  assert.equal(navigationEnabled('url', '?sim=1&nav=1&debug=1'), true);
});

test('regions: off everywhere except the Tahoe field test', () => {
  assert.equal(defaults.NAVIGATION_ENABLED, false);
  assert.equal({ ...defaults, ...sf }.NAVIGATION_ENABLED, false);
  assert.equal({ ...defaults, ...contracosta }.NAVIGATION_ENABLED, false);
  assert.equal(tahoe.NAVIGATION_ENABLED, 'url');
});

test('dev hooks need their own flag', () => {
  const off = { simulate: false, debug: false, warp: 1, noise: 0 };
  assert.deepEqual(devFlags(''), off);
  assert.deepEqual(devFlags('?nav=1'), off);
  assert.deepEqual(devFlags('?nav=1&sim=1'), { ...off, simulate: true });
  assert.deepEqual(devFlags('?debug=1'), { ...off, debug: true });
  assert.deepEqual(devFlags('?sim=1&debug=1'), { ...off, simulate: true, debug: true });
});

test('simulator warp and noise come from the URL, within limits', () => {
  assert.equal(devFlags('?sim=1&warp=8').warp, 8);
  assert.equal(devFlags('?warp=100').warp, 16);
  assert.equal(devFlags('?warp=0').warp, 1);
  assert.equal(devFlags('?warp=fast').warp, 1);
  assert.equal(devFlags('?noise=6').noise, 6);
  assert.equal(devFlags('?noise=-3').noise, 0);
});
