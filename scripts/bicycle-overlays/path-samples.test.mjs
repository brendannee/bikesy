import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyWay } from './rules.mjs';

test('representative Iron Horse and Lafayette-Moraga tags produce practical path candidates without name-based inference', () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL('./fixtures/bay-area-path-samples.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(fixture.ways.length, 4);
  for (const way of fixture.ways) {
    assert.equal(way.tags.is_sidepath, undefined);
    const facility = classifyWay(way.tags).facilities[0];
    assert.equal(facility.eligible, true, way.id);
    assert.equal(facility.class_like, 'I', way.id);
    assert.equal(facility.path_candidate.road_context, 'independence_unverified');
    assert.deepEqual(
      classifyWay({ ...way.tags, name: 'An unrelated name' }).facilities[0]
        .path_candidate,
      facility.path_candidate,
    );
  }
});
