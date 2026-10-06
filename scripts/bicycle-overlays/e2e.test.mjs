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
