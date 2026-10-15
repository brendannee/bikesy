import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const python = process.env.OVERLAY_PYTHON ?? path.join(here, '.venv/bin/python');
const fixture = path.join(here, 'fixtures/modern-tags.osm');
const run = (input, output, args = []) =>
  spawnSync(
    process.execPath,
    [
      path.join(here, 'generate.mjs'),
      '--python',
      python,
      '--input',
      input,
      '--output',
      output,
      ...args,
    ],
    { encoding: 'utf8' },
  );

test('XML/PBF produce identical deterministic layers; review retains suppressed features', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'bikesy-overlays-'));
  try {
    const pbf = path.join(temp, 'fixture.osm.pbf');
    const convert = spawnSync(
      python,
      [
        '-c',
        'import osmium,sys\nw=osmium.SimpleWriter(sys.argv[2])\nfor o in osmium.FileProcessor(sys.argv[1]): w.add(o)\nw.close()',
        fixture,
        pbf,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(convert.status, 0, convert.stderr);
    const xmlOut = path.join(temp, 'xml'),
      pbfOut = path.join(temp, 'pbf');
    for (const [input, output] of [
      [fixture, xmlOut],
      [pbf, pbfOut],
    ]) {
      const result = run(input, output, ['--surfaces', 'paved']);
      assert.equal(result.status, 0, result.stderr);
      await assert.rejects(stat(path.join(output, 'INCOMPLETE.json')), {
        code: 'ENOENT',
      });
    }
    for (const file of (await readdir(xmlOut)).filter(
      (f) => f.endsWith('.geojson') || f === 'debug.jsonl',
    )) {
      assert.equal(
        await readFile(path.join(xmlOut, file), 'utf8'),
        await readFile(path.join(pbfOut, file), 'utf8'),
        file,
      );
    }
    const read = async (name) =>
      JSON.parse(await readFile(path.join(xmlOut, `${name}.geojson`), 'utf8'));
    assert.equal((await read('class-I')).features.length, 3);
    const strictClassOutput = path.join(temp, 'strict-classes');
    assert.equal(run(fixture, strictClassOutput, ['--path-policy', 'strict']).status, 0);
    assert.equal(
      JSON.parse(await readFile(path.join(strictClassOutput, 'class-I.geojson'), 'utf8'))
        .features.length,
      1,
    );
    assert.equal((await read('class-IV')).features.length, 2);
    const paths = (await read('path-candidates')).features;
    assert.deepEqual(
      paths.map((f) => f.properties.osm_way_id),
      ['103', '117', '118'],
    );
    assert.ok(
      paths.every((f) =>
        f.properties.facilities.every((p) => p.path_candidate && p.class_like !== 'IV'),
      ),
    );
    const allOutput = path.join(temp, 'all-surfaces');
    assert.equal(run(fixture, allOutput).status, 0);
    const allPaths = JSON.parse(
      await readFile(path.join(allOutput, 'path-candidates.geojson'), 'utf8'),
    ).features;
    assert.deepEqual(
      allPaths.map((f) => f.properties.osm_way_id),
      ['103', '111', '117', '118'],
    );
    assert.equal((await read('unpaved')).features.length, 2);
    const legacyPaths = JSON.parse(
      await readFile(path.join(allOutput, 'legacy-accessible-paths.geojson'), 'utf8'),
    ).features;
    assert.ok(legacyPaths.some((f) => f.properties.osm_way_id === '122'));
    assert.ok(!legacyPaths.some((f) => f.properties.osm_way_id === '121'));
    assert.equal((await read('route-network')).features.length, 3);
    assert.equal((await read('class-III')).features.length, 0); // Route fallback is unknown surface.
    const debug = (await readFile(path.join(xmlOut, 'debug.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse);
    assert.equal(debug.find((r) => r.id === '115').geometry, null);
    assert.equal(debug.find((r) => r.id === '115').missing_nodes, 1);
    assert.equal(debug.find((r) => r.id === '102').classification.facilities.length, 0);
    assert.equal(debug.find((r) => r.id === '101').classification.routes.length, 2);
    const report = JSON.parse(await readFile(path.join(xmlOut, 'report.json'), 'utf8'));
    assert.equal(report.warnings.missing_node_geometry, 1);
    assert.equal(report.input.sha256.length, 64);
    const existing = run(fixture, xmlOut);
    assert.notEqual(existing.status, 0);
    assert.match(existing.stderr, /EEXIST/);
    const strict = run(fixture, path.join(temp, 'strict'), ['--strict-geometry']);
    assert.notEqual(strict.status, 0);
    assert.match(strict.stderr, /missing or degenerate/);
    const bounded = run(fixture, path.join(temp, 'bounded'), ['--max-features', '1']);
    assert.notEqual(bounded.status, 0);
    await stat(path.join(temp, 'bounded/INCOMPLETE.json'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('Fort Mason cycleways with sidewalk context survive XML and PBF into Class I and compatibility outputs', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'bikesy-fort-mason-'));
  try {
    const xml = path.join(here, 'fixtures/fort-mason.osm');
    const pbf = path.join(temp, 'fort-mason.osm.pbf');
    const conversion = spawnSync(
      python,
      [
        '-c',
        'import osmium,sys\nw=osmium.SimpleWriter(sys.argv[2])\nfor o in osmium.FileProcessor(sys.argv[1]): w.add(o)\nw.close()',
        xml,
        pbf,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(conversion.status, 0, conversion.stderr);
    const outputs = [path.join(temp, 'xml'), path.join(temp, 'pbf')];
    for (const [input, output] of [
      [xml, outputs[0]],
      [pbf, outputs[1]],
    ]) {
      const result = run(input, output, ['--surfaces', 'paved']);
      assert.equal(result.status, 0, result.stderr);
      for (const name of ['class-I', 'legacy-accessible-paths', 'path-candidates']) {
        const features = JSON.parse(
          await readFile(path.join(output, name + '.geojson'), 'utf8'),
        ).features;
        assert.deepEqual(
          features.map((f) => f.properties.osm_way_id),
          ['302293975', '302293980', '858625772'],
        );
        assert.ok(
          features.every(
            (f) =>
              f.properties.facilities[0].eligible &&
              f.properties.facilities[0].path_candidate.sidewalk_context,
          ),
        );
      }
    }
    assert.equal(
      await readFile(path.join(outputs[0], 'class-I.geojson'), 'utf8'),
      await readFile(path.join(outputs[1], 'class-I.geojson'), 'utf8'),
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('per-class pavement, bbox and route fallback options', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'bikesy-overlays-'));
  const layer = async (dir, name) =>
    JSON.parse(await readFile(path.join(temp, dir, `${name}.geojson`), 'utf8')).features;
  const surfaces = (features, klass) =>
    features.flatMap((f) =>
      f.properties.facilities
        .filter((x) => x.class_like === klass)
        .map((x) => x.surface_state),
    );
  try {
    for (const [dir, args] of [
      ['all', ['--surfaces', 'all']],
      ['paved-I', ['--surfaces', 'all', '--paved-classes', 'I']],
      ['far', ['--bbox', '0,0,1,1']],
      ['tags', ['--route-fallback', 'tags']],
    ]) {
      const result = run(fixture, path.join(temp, dir), args);
      assert.equal(result.status, 0, result.stderr);
    }
    // Class I keeps only paved facilities; other classes match an unrestricted run.
    const allI = surfaces(await layer('all', 'class-I'), 'I');
    const pavedI = surfaces(await layer('paved-I', 'class-I'), 'I');
    assert.ok(
      allI.some((s) => s !== 'paved'),
      'fixture needs a non-paved Class I path',
    );
    assert.ok(pavedI.length && pavedI.every((s) => s === 'paved'));
    for (const name of ['class-II', 'class-III', 'class-IV'])
      assert.deepEqual(await layer('paved-I', name), await layer('all', name), name);
    // Every fixture way is outside the bbox; the report counts them.
    assert.equal((await layer('far', 'class-II')).length, 0);
    const report = JSON.parse(
      await readFile(path.join(temp, 'far', 'report.json'), 'utf8'),
    );
    assert.ok(report.counts.outside_bbox > 0);
    // Only the way with a missing node remains: without coordinates it cannot be placed.
    assert.equal(report.counts.candidate_ways, report.counts.missing_geometry);
    // No relation-only route roads with `tags`.
    for (const f of await layer('tags', 'class-III'))
      for (const x of f.properties.facilities)
        assert.notDeepEqual(x.evidence, ['route_relation_membership']);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('invalid generator option values are rejected', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'bikesy-overlays-'));
  try {
    for (const args of [
      ['--route-fallback', 'some'],
      ['--paved-classes', 'V'],
      ['--surfaces', 'paved', '--paved-classes', 'I'],
      ['--bbox', '1,1,0,0'],
    ]) {
      const result = run(fixture, path.join(temp, args.join('_')), args);
      assert.notEqual(result.status, 0, args.join(' '));
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('--region applies app config options and SEARCH_BOUNDS; flags take precedence', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'bikesy-overlays-'));
  const report = async (dir) =>
    JSON.parse(await readFile(path.join(temp, dir, 'report.json'), 'utf8'));
  try {
    for (const [dir, args] of [
      ['plain', []],
      ['sf', ['--region', 'sf']],
      ['tahoe', ['--region', 'tahoe']],
      [
        'tahoe-override',
        ['--region', 'tahoe', '--route-fallback', 'all', '--bbox', '-123,37,-122,38'],
      ],
    ]) {
      const result = run(fixture, path.join(temp, dir), args);
      assert.equal(result.status, 0, result.stderr);
    }
    // The fixture is in San Francisco: SF bounds keep every way.
    const sf = await report('sf');
    assert.equal(sf.options.region, 'sf');
    assert.deepEqual(sf.options.bbox, [-122.8, 37.3064, -121.637, 38.0534]);
    assert.equal(sf.counts.outside_bbox, 0);
    assert.equal(sf.options.routeFallback, 'all');
    assert.equal(
      await readFile(path.join(temp, 'sf', 'class-II.geojson'), 'utf8'),
      await readFile(path.join(temp, 'plain', 'class-II.geojson'), 'utf8'),
    );
    // Tahoe options apply, and its bounds exclude the San Francisco fixture.
    const tahoe = await report('tahoe');
    assert.deepEqual(tahoe.options.pavedClasses, ['I']);
    assert.equal(tahoe.options.routeFallback, 'tags');
    assert.ok(tahoe.counts.outside_bbox > 0);
    // Command-line flags override the region's settings.
    const override = await report('tahoe-override');
    assert.equal(override.options.routeFallback, 'all');
    assert.deepEqual(override.options.pavedClasses, ['I']);
    assert.equal(override.counts.outside_bbox, 0);
    for (const name of ['../tahoe', 'nowhere']) {
      const result = run(fixture, path.join(temp, `bad-${name.length}`), [
        '--region',
        name,
      ]);
      assert.notEqual(result.status, 0, name);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
