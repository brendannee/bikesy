import assert from 'node:assert/strict';
import { test } from 'node:test';
import { devFlags } from './flags.js';
test('dev hooks need their own flag', () => {
  const off = { simulate: false, debug: false, warp: 1, noise: 0 };
  assert.deepEqual(devFlags(''), off);
  assert.deepEqual(devFlags('?x=1'), off);
  assert.deepEqual(devFlags('?x=1&sim=1'), { ...off, simulate: true });
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
