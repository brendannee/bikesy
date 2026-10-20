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
  assert.deepEqual(devFlags(''), { simulate: false, debug: false });
  assert.deepEqual(devFlags('?nav=1'), { simulate: false, debug: false });
  assert.deepEqual(devFlags('?nav=1&sim=1'), { simulate: true, debug: false });
  assert.deepEqual(devFlags('?debug=1'), { simulate: false, debug: true });
  assert.deepEqual(devFlags('?sim=1&debug=1'), { simulate: true, debug: true });
});
