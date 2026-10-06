import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyWay } from './rules.mjs';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/fort-mason.json', import.meta.url), 'utf8'),
);
for (const way of fixture.ways) {
  test(`Fort Mason ${way.id}: explicit cycleway outranks footway=sidewalk`, () => {
    const facility = classifyWay(way.tags).facilities[0];
    assert.equal(facility.class_like, 'I');
    assert.equal(facility.eligible, true);
    assert.equal(facility.path_candidate.sidewalk_context, true);
    assert.equal(facility.official_class, false);
  });
}

test('cycleway/sidewalk precedence does not override access or lifecycle restrictions', () => {
  const base = { highway: 'cycleway', footway: 'sidewalk', surface: 'asphalt' };
  for (const tags of [
    { bicycle: 'no' },
    { bicycle: 'dismount' },
    { access: 'private' },
    { access: 'no' },
    { 'bicycle:conditional': 'no @ (Su)' },
    { construction: 'yes' },
    { area: 'yes' },
  ]) {
    const f = classifyWay({ ...base, ...tags }).facilities[0];
    assert.equal(f.eligible, false, JSON.stringify(tags));
  }
  assert.equal(
    classifyWay({ ...base, access: 'no', bicycle: 'designated' }).facilities[0].eligible,
    true,
  );
});

test('ordinary sidewalks, crossings, protected-track and strict-mode safeguards remain', () => {
  assert.equal(
    classifyWay({ highway: 'footway', footway: 'sidewalk', bicycle: 'designated' })
      .facilities[0].class_like,
    null,
  );
  assert.equal(
    classifyWay({ highway: 'path', footway: 'sidewalk', bicycle: 'yes' }).facilities[0]
      .class_like,
    null,
  );
  assert.equal(
    classifyWay({
      highway: 'cycleway',
      footway: 'sidewalk',
      cycleway: 'crossing',
      bicycle: 'designated',
    }).facilities[0].class_like,
    null,
  );
  assert.equal(
    classifyWay({ highway: 'cycleway', footway: 'crossing', bicycle: 'designated' })
      .facilities[0].class_like,
    null,
  );
  assert.equal(
    classifyWay({ highway: 'cycleway', footway: 'sidewalk', cycleway: 'track' })
      .facilities[0].class_like,
    'IV',
  );
  assert.equal(
    classifyWay(fixture.ways[0].tags, [], undefined, { pathPolicy: 'strict' })
      .facilities[0].class_like,
    null,
  );
});
