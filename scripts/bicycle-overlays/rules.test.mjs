import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyWay } from './rules.mjs';
import { indexRelations } from './relations.mjs';
import { outputGeometry } from './geometry.mjs';
const road = (tags, routes) => classifyWay({ highway: 'residential', ...tags }, routes);
const route = { id: '100', network: 'lcn', conditional: {} };

test('mixed sides retain lane and track independently', () => {
  const r = road({ 'cycleway:left': 'track', 'cycleway:right': 'lane' });
  assert.deepEqual(
    r.facilities.map((f) => [f.class_like, f.side, f.directions]),
    [
      ['IV', 'left', ['backward']],
      ['II', 'right', ['forward']],
    ],
  );
});
test('explicit no and separate override both and generic without phantom geometry', () => {
  const r = road({
    cycleway: 'lane',
    'cycleway:both': 'track',
    'cycleway:left': 'no',
    'cycleway:right': 'separate',
  });
  assert.equal(r.facilities.length, 0);
  assert.equal(r.references[0].kind, 'separately_mapped_reference');
});
test('unsuffixed lane has unknown side/direction, not two invented lanes', () => {
  const r = road({ cycleway: 'lane' });
  assert.equal(r.facilities.length, 1);
  assert.equal(r.facilities[0].side, 'unspecified');
  assert.deepEqual(r.facilities[0].directions, []);
});
test('canonical share_busway is not an exclusive bike lane; alias warned', () => {
  assert.equal(road({ cycleway: 'share_busway' }).facilities[0].class_like, null);
  assert.ok(
    road({ cycleway: 'shared_busway' }).warnings.includes(
      'noncanonical_shared_busway_alias',
    ),
  );
});
test('legacy opposite track/lane and reverse road preserve contraflow', () => {
  assert.deepEqual(
    road({ oneway: 'yes', cycleway: 'opposite_lane' }).facilities[0].directions,
    ['backward'],
  );
  assert.deepEqual(
    road({ oneway: '-1', cycleway: 'opposite_track' }).facilities[0].directions,
    ['forward'],
  );
  assert.equal(road({ cycleway: 'opposite' }).facilities.length, 0);
  assert.equal(
    road({ cycleway: 'opposite_share_busway' }).facilities[0].kind,
    'shared_bus_lane',
  );
});
test('cycleway side oneway and bicycle direction access stay separate', () => {
  const r = road({
    oneway: 'yes',
    'oneway:bicycle': 'no',
    'cycleway:left': 'lane',
    'cycleway:left:oneway': '-1',
    'bicycle:backward': 'no',
  });
  assert.deepEqual(r.facilities[0].directions, ['backward']);
  assert.equal(r.facilities[0].eligible, false);
});
test('mode-specific bicycle permission overrides general private access', () => {
  assert.equal(
    road({ cycleway: 'lane', access: 'private', bicycle: 'yes' }).facilities[0].eligible,
    true,
  );
  assert.equal(road({ cycleway: 'lane', bicycle: 'no' }).facilities[0].eligible, false);
  assert.equal(
    road({ cycleway: 'lane', vehicle: 'no', bicycle: 'yes' }).facilities[0].eligible,
    true,
  );
});
test('access qualifications are distinct; dismount and use_sidepath are withheld', () => {
  for (const value of [
    'private',
    'destination',
    'permissive',
    'dismount',
    'use_sidepath',
  ]) {
    const f = road({ cycleway: 'lane', bicycle: value }).facilities[0];
    assert.equal(f.access.forward.value, value);
    assert.equal(f.eligible, value === 'permissive');
  }
});
test('bicycle direction permission can override general prohibition on one side', () => {
  const r = road({ 'cycleway:both': 'lane', bicycle: 'no', 'bicycle:forward': 'yes' });
  assert.equal(r.facilities.find((f) => f.side === 'right').eligible, true);
  assert.equal(r.facilities.find((f) => f.side === 'left').eligible, false);
});
test('bicycle conditionals are retained and not evaluated as currently open', () => {
  const r = road({ cycleway: 'lane', 'bicycle:conditional': 'no @ (Mo-Fr 08:00-10:00)' });
  assert.equal(r.facilities[0].eligible, false);
  assert.ok(r.conditional['bicycle:conditional']);
  assert.equal(
    road({ cycleway: 'lane', 'motorcar:conditional': 'no @ (Su)' }).facilities[0]
      .eligible,
    true,
  );
});
test('shared roadside cycleways are inferred I while access-only paths remain unclassified', () => {
  assert.equal(
    classifyWay({ highway: 'cycleway', is_sidepath: 'yes', foot: 'yes' }).facilities[0]
      .class_like,
    'I',
  );
  assert.equal(
    classifyWay({ highway: 'path', bicycle: 'yes' }).facilities[0].class_like,
    null,
  );
  assert.equal(
    classifyWay({ highway: 'cycleway', is_sidepath: 'no' }).facilities[0].class_like,
    'I',
  );
  assert.equal(
    classifyWay({ highway: 'cycleway', is_sidepath: 'yes', foot: 'no' }).facilities[0]
      .class_like,
    'IV',
  );
  assert.equal(
    classifyWay({
      highway: 'footway',
      footway: 'sidewalk',
      bicycle: 'designated',
      is_sidepath: 'no',
    }).facilities[0].class_like,
    null,
  );
});
test('advisory, buffers, physical separation conflicts and segregated stay distinct', () => {
  const advisory = road({ cycleway: 'lane', 'cycleway:lane': 'advisory' }).facilities[0];
  assert.equal(advisory.confidence, 'low');
  assert.ok(advisory.warnings.includes('advisory_lane_not_exclusive'));
  assert.equal(
    road({ cycleway: 'lane', 'cycleway:buffer': '1.0' }).facilities[0].class_like,
    'II',
  );
  const conflict = road({ cycleway: 'lane', 'cycleway:separation': 'bollard' })
    .facilities[0];
  assert.equal(conflict.class_like, 'II');
  assert.ok(conflict.warnings.includes('lane_with_physical_separation_conflict'));
  assert.equal(
    road({ cycleway: 'lane', segregated: 'yes' }).facilities[0].class_like,
    'II',
  );
});
test('surface overrides, unknown and compacted are explicit', () => {
  const r = road({
    surface: 'asphalt',
    'cycleway:both': 'track',
    'cycleway:left:surface': 'compacted',
  });
  assert.equal(r.facilities[0].surface_state, 'unpaved');
  assert.equal(r.facilities[1].surface_state, 'paved');
  assert.equal(road({ cycleway: 'lane' }).facilities[0].surface_state, 'unknown');
  assert.equal(
    road({ cycleway: 'track', surface: 'mystery' }).facilities[0].surface_state,
    'unknown',
  );
});
test('route relation does not replace lane or permit motorway access', () => {
  assert.equal(road({ cycleway: 'lane' }, [route]).facilities[0].class_like, 'II');
  assert.equal(road({}, [route]).facilities[0].class_like, 'III');
  assert.equal(classifyWay({ highway: 'motorway' }, [route]).facilities.length, 0);
  assert.equal(
    classifyWay({ highway: 'motorway', cycleway: 'lane' }, [route]).facilities[0]
      .eligible,
    false,
  );
  assert.equal(road({}, [{ ...route, state: 'proposed' }]).facilities.length, 0);
});
test('steps, inactive ways and areas are retained but withheld', () => {
  assert.equal(
    classifyWay({ highway: 'steps', 'ramp:bicycle': 'yes' }).facilities[0].eligible,
    false,
  );
  assert.equal(
    road({ cycleway: 'lane', 'disused:highway': 'residential' }).facilities[0].eligible,
    false,
  );
  assert.equal(
    classifyWay({ highway: 'construction', construction: 'cycleway' }).facilities[0]
      .eligible,
    false,
  );
  assert.equal(
    classifyWay({ 'disused:highway': 'cycleway' }).facilities[0].eligible,
    false,
  );
  assert.equal(
    classifyWay({ highway: 'cycleway', area: 'yes' }).facilities[0].eligible,
    false,
  );
});
test('nested memberships are bounded, deduplicated, and cycles diagnosed', () => {
  const relations = [
    { id: '1', tags: { network: 'ncn' }, members: [{ type: 'r', ref: '2', role: '' }] },
    {
      id: '2',
      tags: { network: 'lcn' },
      members: [
        { type: 'w', ref: '9', role: 'forward' },
        { type: 'w', ref: '9', role: 'forward' },
        { type: 'r', ref: '1', role: '' },
      ],
    },
  ];
  const result = indexRelations(relations);
  assert.equal(result.ways.get('9').length, 2);
  assert.ok(result.warnings.relation_cycle);
  assert.throws(() => indexRelations(relations, { maxDepth: 1 }), /depth/);
  assert.throws(() => indexRelations(relations, { maxMemberships: 1 }), /memberships/);
});
test('geometry defaults preserve points, optional meters simplify, rounding never emits a collapsed line', () => {
  const coords = [
    [-122.45, 37.77],
    [-122.449, 37.770001],
    [-122.448, 37.77],
  ];
  assert.deepEqual(outputGeometry(coords).coordinates, coords);
  assert.equal(outputGeometry(coords, { simplify: 1 }).coordinates.length, 2);
  assert.equal(outputGeometry(coords, { simplify: 0.01 }).coordinates.length, 3);
  assert.equal(
    outputGeometry(
      [
        [0, 0],
        [0.000001, 0],
      ],
      { precision: 5 },
    ),
    null,
  );
  assert.equal(outputGeometry(null), null);
});

test('proposed child routes cannot create active fallback through a parent network', () => {
  const relations = [
    { id: '1', tags: { network: 'ncn' }, members: [{ type: 'r', ref: '2', role: '' }] },
    {
      id: '2',
      tags: { network: 'lcn', proposed: 'yes' },
      members: [{ type: 'w', ref: '9', role: '' }],
    },
  ];
  const result = indexRelations(relations);
  assert.ok(result.ways.get('9').every((r) => r.inactive));
  assert.equal(road({}, result.ways.get('9')).facilities.length, 0);
  assert.throws(
    () => indexRelations([...relations, { ...relations[0], tags: {} }]),
    /duplicate relation/,
  );
});

test('practical paths retain designation without claiming independent Class I', () => {
  for (const tags of [
    { highway: 'cycleway' },
    { highway: 'path', bicycle: 'designated' },
    { highway: 'footway', bicycle: 'designated' },
  ]) {
    const f = classifyWay(tags).facilities[0];
    assert.equal(f.class_like, 'I');
    assert.equal(
      classifyWay(tags, [], undefined, { pathPolicy: 'strict' }).facilities[0].class_like,
      null,
    );
    assert.equal(f.path_candidate.road_context, 'independence_unverified');
    assert.equal(f.path_candidate.confidence, 'medium');
    assert.equal(f.path_candidate.official_class, false);
    assert.equal(f.review_required, true);
  }
  assert.equal(
    classifyWay({ highway: 'path', bicycle: 'yes' }).facilities[0].path_candidate,
    undefined,
  );
  assert.equal(road({ bicycle: 'designated' }).facilities.length, 0);
});

test('practical paths separate strict independence, shared roadside context and protected tracks', () => {
  const get = (tags) => classifyWay({ highway: 'cycleway', ...tags }).facilities[0];
  assert.equal(
    get({ is_sidepath: 'no' }).path_candidate.road_context,
    'tagged_independent',
  );
  assert.equal(get({ is_sidepath: 'no' }).class_like, 'I');
  assert.equal(
    get({ is_sidepath: 'yes', foot: 'yes' }).path_candidate.road_context,
    'tagged_roadside_shared_or_unresolved',
  );
  assert.equal(get({ is_sidepath: 'yes', foot: 'no' }).path_candidate, undefined);
  assert.equal(get({ cycleway: 'track' }).path_candidate, undefined);
  assert.equal(road({ cycleway: 'track' }).facilities[0].path_candidate, undefined);
  for (const footway of ['sidewalk', 'crossing', 'traffic_island']) {
    assert.equal(
      classifyWay({ highway: 'footway', bicycle: 'designated', footway }).facilities[0]
        .path_candidate,
      undefined,
    );
  }
  assert.equal(get({ bicycle: 'dismount' }).eligible, false);
});

test('unknown cycleway value does not suppress explicit road route evidence, while separate still does', () => {
  assert.equal(road({ cycleway: 'shared', lcn: 'yes' }).facilities[0].class_like, 'III');
  assert.equal(road({ cycleway: 'separate', lcn: 'yes' }).facilities.length, 0);
  assert.equal(
    classifyWay({ highway: 'trunk', lcn: 'yes' }).facilities[0].class_like,
    'III',
  );
  assert.equal(
    classifyWay({ highway: 'cycleway', cycleway: 'track' }).facilities[0].class_like,
    'IV',
  );
});
