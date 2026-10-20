import assert from 'node:assert/strict';
import { test } from 'node:test';
import { maneuverIcon } from './icons.js';

test('maneuverIcon: every icon is a sized SVG using currentColor', () => {
  for (const [type, modifier] of [
    ['turn', 'right'],
    ['turn', 'sharp left'],
    ['turn', 'uturn'],
    ['new name', 'straight'],
    ['depart', undefined],
    ['arrive', 'right'],
    ['fork', 'slight left'],
    [undefined, undefined],
  ]) {
    const svg = maneuverIcon(type, modifier, 40);
    assert.match(
      svg,
      /^<svg viewBox="0 0 48 48" width="40" height="40"/,
      `${type} ${modifier}`,
    );
    assert.match(svg, /stroke="currentColor"/);
    assert.match(svg, /<\/svg>$/);
    assert.doesNotMatch(svg, /NaN|undefined/);
  }
  assert.match(maneuverIcon('turn', 'left'), /width="56" height="56"/);
});

test('maneuverIcon: left and right turns mirror each other, and straight points up', () => {
  const tip = (svg) => {
    // The arrow shaft is the second path: M px py L ex ey.
    const [, shaft] = svg.match(/<path d="([^"]+)"/g);
    const [px, py, ex, ey] = shaft.match(/-?\d+(\.\d+)?/g).map(Number);
    return { dx: ex - px, dy: ey - py };
  };
  const right = tip(maneuverIcon('turn', 'right'));
  const left = tip(maneuverIcon('turn', 'left'));
  assert.ok(right.dx > 10 && Math.abs(right.dy) < 1e-6);
  assert.ok(left.dx < -10 && Math.abs(left.dy) < 1e-6);
  const straight = tip(maneuverIcon('new name', 'straight'));
  assert.ok(Math.abs(straight.dx) < 1e-6 && straight.dy < -10);
  // Modifiers it doesn't know fall back to straight.
  assert.deepEqual(tip(maneuverIcon('turn', 'wobble')), straight);
});
