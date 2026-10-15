import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyWay, DEFAULT_SURFACES } from './rules.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const hard = ['wood', 'metal', 'metal_grid', 'bricks', 'chipseal'];
const bridges = JSON.parse(
  await readFile(path.join(here, 'fixtures/metal-bridges.json'), 'utf8'),
).ways;

test('real Lefty O’Doul bridge ways retain protected-track classification and metal surface', () => {
  for (const way of bridges) {
    const facilities = classifyWay(way.tags).facilities;
    assert.ok(facilities.length);
    assert.ok(
      facilities.every(
        (f) => f.eligible && f.class_like === 'IV' && f.surface_state === 'paved',
      ),
    );
  }
});

test('decking preserves class I–IV and explicit cycleway precedence over sidewalk', () => {
  for (const surface of hard) {
    for (const [tags, expected] of [
      [{ highway: 'cycleway', footway: 'sidewalk' }, 'I'],
      [{ highway: 'residential', cycleway: 'lane' }, 'II'],
      [{ highway: 'residential', cycleway: 'shared_lane' }, 'III'],
      [{ highway: 'cycleway', is_sidepath: 'yes', foot: 'no' }, 'IV'],
    ]) {
      const f = classifyWay({ ...tags, surface }).facilities[0];
      assert.equal(f.class_like, expected);
      assert.equal(f.surface_state, 'paved');
      assert.equal(f.eligible, true);
    }
  }
});

test('bridge material and short-link intent do not bypass surface or access evidence', () => {
  for (const surface of hard) {
    for (const restriction of [
      { bicycle: 'no' },
      { bicycle: 'dismount' },
      { access: 'private' },
      { 'bicycle:conditional': 'no @ (Su)' },
      { construction: 'yes' },
      { highway: 'steps' },
    ]) {
      assert.ok(
        classifyWay({
          highway: 'cycleway',
          bridge: 'yes',
          surface,
          ...restriction,
        }).facilities.every((f) => !f.eligible),
      );
    }
  }
  for (const surface of ['gravel', 'compacted', 'fine_gravel', 'dirt']) {
    assert.equal(
      classifyWay({
        highway: 'cycleway',
        bridge: 'yes',
        'bridge:material': 'steel',
        surface,
      }).facilities[0].surface_state,
      'unpaved',
    );
  }
  assert.equal(
    classifyWay({ highway: 'cycleway', bridge: 'yes', 'bridge:material': 'steel' })
      .facilities[0].surface_state,
    'unknown',
  );
  assert.equal(
    classifyWay({
      highway: 'footway',
      footway: 'sidewalk',
      bicycle: 'yes',
      surface: 'metal',
    }).facilities[0].class_like,
    null,
  );
});

test('side surface overrides and custom surface policy remain authoritative', () => {
  const f = classifyWay({
    highway: 'residential',
    'cycleway:both': 'lane',
    surface: 'metal',
    'cycleway:left:surface': 'gravel',
  }).facilities;
  assert.equal(f.find((x) => x.side === 'left').surface_state, 'unpaved');
  assert.equal(f.find((x) => x.side === 'right').surface_state, 'paved');
  assert.equal(
    classifyWay({ highway: 'cycleway', surface: 'metal' }, [], {
      paved: ['asphalt'],
      unpaved: [],
    }).facilities[0].surface_state,
    'unknown',
  );
  assert.equal(new Set(DEFAULT_SURFACES.paved).size, DEFAULT_SURFACES.paved.length);
  assert.ok(DEFAULT_SURFACES.paved.every((s) => !DEFAULT_SURFACES.unpaved.includes(s)));
});

test('XML/PBF paved outputs retain hard links and withhold loose, unknown and restricted links', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'bikesy-surface-'));
  try {
    const python = process.env.OVERLAY_PYTHON ?? path.join(here, '.venv/bin/python');
    const cases = [
      ...hard.map((surface, i) => ({
        id: String(100 + i),
        tags: { highway: 'cycleway', footway: 'sidewalk', surface },
      })),
      ...['gravel', 'compacted', 'fine_gravel', 'dirt', 'boardwalk'].map(
        (surface, i) => ({
          id: String(200 + i),
          tags: { highway: 'cycleway', bridge: 'yes', surface },
        }),
      ),
      { id: '300', tags: { highway: 'cycleway', surface: 'metal', bicycle: 'no' } },
      { id: '301', tags: { highway: 'steps', surface: 'metal_grid', bicycle: 'yes' } },
      ...bridges,
    ];
    const escape = (s) =>
      s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    let nextNode = 1;
    const nodes = [],
      ways = [];
    for (const way of cases) {
      const refs = (
        way.geometry?.coordinates ?? [
          [-122.4, 37.7],
          [-122.399, 37.7],
        ]
      ).map(([lon, lat]) => {
        const id = nextNode++;
        nodes.push(`<node id="${id}" lat="${lat}" lon="${lon}"/>`);
        return `<nd ref="${id}"/>`;
      });
      ways.push(
        `<way id="${way.id}">${refs.join('')}${Object.entries(way.tags)
          .map(([k, v]) => `<tag k="${escape(k)}" v="${escape(v)}"/>`)
          .join('')}</way>`,
      );
    }
    const xml = path.join(temp, 'fixture.osm'),
      pbf = path.join(temp, 'fixture.osm.pbf');
    await writeFile(
      xml,
      `<osm version="0.6" generator="synthetic nodes; real bridge tags and coordinates">${nodes.join('')}${ways.join('')}</osm>`,
    );
    const convert = spawnSync(
      python,
      [
        '-c',
        'import osmium,sys\nw=osmium.SimpleWriter(sys.argv[2])\nfor o in osmium.FileProcessor(sys.argv[1]): w.add(o)\nw.close()',
        xml,
        pbf,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(convert.status, 0, convert.stderr);
    const outputs = [];
    for (const [input, name] of [
      [xml, 'xml'],
      [pbf, 'pbf'],
    ]) {
      const output = path.join(temp, name);
      const run = spawnSync(
        process.execPath,
        [
          path.join(here, 'generate.mjs'),
          '--python',
          python,
          '--input',
          input,
          '--output',
          output,
          '--surfaces',
          'paved',
          '--strict-geometry',
        ],
        { encoding: 'utf8' },
      );
      assert.equal(run.status, 0, run.stderr);
      const read = async (layer) =>
        JSON.parse(await readFile(path.join(output, `${layer}.geojson`), 'utf8'));
      const I = await read('class-I'),
        IV = await read('class-IV');
      assert.deepEqual(
        I.features.map((f) => f.properties.osm_way_id),
        ['100', '101', '102', '103', '104'],
      );
      assert.deepEqual(
        IV.features.map((f) => f.properties.osm_way_id),
        bridges.map((w) => w.id),
      );
      const review = new Set(
        (await read('review')).features.map((f) => f.properties.osm_way_id),
      );
      for (const id of ['200', '201', '202', '203', '204', '300', '301'])
        assert.ok(review.has(id), id);
      for (const way of bridges)
        assert.deepEqual(
          IV.features.find((f) => f.properties.osm_way_id === way.id).geometry,
          way.geometry,
        );
      outputs.push({ I, IV });
    }
    assert.deepEqual(outputs[0], outputs[1]);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
