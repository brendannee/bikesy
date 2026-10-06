#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile, open, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { classifyWay, DEFAULT_SURFACES, RULES_VERSION } from './rules.mjs';
import { indexRelations, compareIds } from './relations.mjs';
import { outputGeometry } from './geometry.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HELP = `Generate reviewable bicycle overlays from local .osm or .osm.pbf.
Usage: node scripts/bicycle-overlays/generate.mjs --input FILE --output NEW_DIRECTORY [options]
  --python FILE             default: tool-local .venv/bin/python
  --surfaces all|paved       default: all; debug/review always retain all surfaces
  --path-policy practical|strict  default: practical inferred Class I paths
  --surface-config FILE     JSON object with disjoint paved/unpaved string arrays
  --simplify-meters NUMBER   optional local metric RDP; default: preserve every point
  --precision INTEGER       optional 0–7 decimal places; default: preserve precision
  --max-features INTEGER     default: 250000 candidate ways (hard failure)
  --max-relations INTEGER    default: 50000 (hard failure)
  --max-memberships INTEGER default: 1000000 (hard failure)
  --strict-geometry         fail on candidate ways with missing/degenerate geometry
  --help
The output directory must not exist. No map assets, input data, or services are changed.
Requires Node >=22 and the locally pinned Python requirements. Right-hand traffic defaults.
`;

function options(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (['--help', '--strict-geometry'].includes(flag)) {
      values[flag] = true;
      continue;
    }
    if (
      ![
        '--input',
        '--output',
        '--python',
        '--surfaces',
        '--path-policy',
        '--surface-config',
        '--simplify-meters',
        '--precision',
        '--max-features',
        '--max-relations',
        '--max-memberships',
      ].includes(flag)
    )
      throw new Error(`Unknown argument: ${flag}`);
    if (!argv[i + 1] || argv[i + 1].startsWith('--'))
      throw new Error(`Missing value for ${flag}`);
    values[flag] = argv[++i];
  }
  if (values['--help']) return { help: true };
  if (!values['--input'] || !values['--output'])
    throw new Error('--input and --output are required.');
  const input = path.resolve(values['--input']);
  if (!/\.(osm|osm\.pbf)$/i.test(input))
    throw new Error('Input must end in .osm or .osm.pbf.');
  const numeric = (key, fallback, minimum, integer = false) => {
    const value = values[key] === undefined ? fallback : Number(values[key]);
    if (
      !Number.isFinite(value) ||
      value < minimum ||
      (integer && !Number.isInteger(value))
    )
      throw new Error(`Invalid ${key}`);
    return value;
  };
  const precision =
    values['--precision'] === undefined ? undefined : numeric('--precision', 7, 0, true);
  if (precision > 7) throw new Error('--precision must be 0–7.');
  const surfaces = values['--surfaces'] ?? 'all';
  const pathPolicy = values['--path-policy'] ?? 'practical';
  if (!['practical', 'strict'].includes(pathPolicy))
    throw new Error('--path-policy must be practical or strict.');
  if (!['all', 'paved'].includes(surfaces))
    throw new Error('--surfaces must be all or paved.');
  return {
    input,
    output: path.resolve(values['--output']),
    python: path.resolve(values['--python'] ?? path.join(HERE, '.venv/bin/python')),
    surfaces,
    pathPolicy,
    surfaceConfig: values['--surface-config'],
    simplify: numeric('--simplify-meters', 0, 0),
    precision,
    maxFeatures: numeric('--max-features', 250000, 1, true),
    maxRelations: numeric('--max-relations', 50000, 1, true),
    maxMemberships: numeric('--max-memberships', 1000000, 1, true),
    strict: !!values['--strict-geometry'],
  };
}

const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, stable(value[k])]),
        )
      : value;
const json = (value) => JSON.stringify(stable(value));
async function shaFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function readOsm(config, mode, callback) {
  const child = spawn(
    config.python,
    [path.join(HERE, 'read_osm.py'), config.input, mode],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stderr = '';
  child.stderr.on('data', (d) => {
    stderr = (stderr + d).slice(-16000);
  });
  const completion = new Promise((resolve) => {
    child.once('error', (error) => resolve({ error }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  let metrics;
  try {
    for await (const line of createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    })) {
      const record = JSON.parse(line);
      if (record.type === 'reader_stats') metrics = record;
      else callback(record);
    }
  } catch (error) {
    child.kill('SIGTERM');
    await completion;
    throw error;
  }
  const status = await completion;
  if (status.error || status.code !== 0 || !metrics)
    throw new Error(
      `OSM reader failed (${status.error?.message ?? status.signal ?? status.code}): ${stderr.trim()}`,
    );
  return metrics;
}

function lean(record, facilities) {
  return {
    type: 'Feature',
    id: `way/${record.id}`,
    geometry: record.geometry,
    properties: {
      osm_way_id: record.id,
      name: record.tags.name ?? null,
      highway: record.tags.highway ?? null,
      source_timestamp: record.timestamp,
      geometry_role: [
        'cycleway',
        'path',
        'footway',
        'pedestrian',
        'bridleway',
        'steps',
        'track',
      ].includes(record.tags.highway)
        ? 'mapped_path'
        : 'road_centerline',
      official_class: false,
      facilities,
      route_ids: record.classification.routes
        .map((r) => r.id)
        .filter((id, i, ids) => ids.indexOf(id) === i),
      networks: [
        ...new Set(record.classification.routes.map((r) => r.network).filter(Boolean)),
      ].sort(),
    },
  };
}

async function writeCollection(file, records, select) {
  const handle = await open(file, 'wx');
  let count = 0;
  try {
    await handle.write(
      '{"type":"FeatureCollection","attribution":"© OpenStreetMap contributors","license":"https://opendatacommons.org/licenses/odbl/1-0/","features":[\n',
    );
    for (const record of records) {
      const feature = select(record);
      if (!feature) continue;
      await handle.write(`${count++ ? ',\n' : ''}${json(feature)}`);
    }
    await handle.write('\n]}\n');
  } finally {
    await handle.close();
  }
  return count;
}

async function main() {
  const config = options(process.argv.slice(2));
  if (config.help) {
    console.log(HELP);
    return;
  }
  const started = performance.now();
  const inputStat = await stat(config.input);
  if (!inputStat.isFile()) throw new Error('Input is not a regular file.');
  const surfaces = config.surfaceConfig
    ? JSON.parse(await readFile(config.surfaceConfig, 'utf8'))
    : DEFAULT_SURFACES;
  if (
    !['paved', 'unpaved'].every(
      (k) =>
        Array.isArray(surfaces[k]) && surfaces[k].every((s) => typeof s === 'string'),
    ) ||
    surfaces.paved.some((s) => surfaces.unpaved.includes(s))
  )
    throw new Error('Surface config needs disjoint paved/unpaved string arrays.');
  await mkdir(path.dirname(config.output), { recursive: true });
  await mkdir(config.output); // EEXIST is intentional: never replace existing output/assets.
  const marker = path.join(config.output, 'INCOMPLETE.json');
  await writeFile(marker, json({ status: 'incomplete', input: config.input }) + '\n', {
    flag: 'wx',
  });
  const counts = {};
  const warnings = {};
  const warningSamples = {};
  const warn = (code, id, amount = 1) => {
    warnings[code] = (warnings[code] ?? 0) + amount;
    if (id && (warningSamples[code]?.length ?? 0) < 5)
      (warningSamples[code] ??= []).push(id);
  };
  const relations = [];
  let rawMembers = 0;
  console.error('Reading bicycle route relations…');
  const relationMetrics = await readOsm(config, 'relations', (r) => {
    if (relations.length >= config.maxRelations)
      throw new Error(`Relations exceed ${config.maxRelations}.`);
    rawMembers += r.members.length;
    if (rawMembers > config.maxMemberships)
      throw new Error(`Raw relation members exceed ${config.maxMemberships}.`);
    relations.push(r);
  });
  const routeIndex = indexRelations(relations, { maxMemberships: config.maxMemberships });
  for (const [code, amount] of Object.entries(routeIndex.warnings))
    warn(code, null, amount);
  const candidates = new Map();
  let seen = 0;
  console.error(`Reading ways with coordinates (${relations.length} bicycle relations)…`);
  const wayMetrics = await readOsm(config, 'ways', (record) => {
    seen++;
    const classification = classifyWay(
      record.tags,
      routeIndex.ways.get(record.id) ?? [],
      surfaces,
      { pathPolicy: config.pathPolicy },
    );
    if (!classification.candidate) return;
    const prior = candidates.get(record.id);
    if (prior) {
      if (
        prior.version !== record.version ||
        json(prior.tags) !== json(record.tags) ||
        json(prior.coordinates) !== json(record.coordinates)
      )
        throw new Error(
          `Conflicting duplicate way ${record.id}; supply a single current snapshot.`,
        );
      warn('duplicate_way_deduplicated', record.id);
      return;
    }
    if (candidates.size >= config.maxFeatures)
      throw new Error(`Candidate ways exceed ${config.maxFeatures}.`);
    const geometry = outputGeometry(record.coordinates, config);
    if (!geometry) {
      warn(
        record.missing_nodes ? 'missing_node_geometry' : 'degenerate_geometry',
        record.id,
      );
      if (config.strict)
        throw new Error(`Way ${record.id} has missing or degenerate geometry.`);
    }
    for (const code of classification.warnings) warn(code, record.id);
    for (const facility of classification.facilities)
      for (const code of facility.warnings) warn(code, record.id);
    candidates.set(record.id, { ...record, classification, geometry });
  });
  const records = [...candidates.values()].sort((a, b) => compareIds(a.id, b.id));
  const visible = (r) =>
    r.classification.facilities.filter(
      (f) => f.eligible && (config.surfaces === 'all' || f.surface_state === 'paved'),
    );
  const compact = (f) => {
    const { access, warnings: facilityWarnings, ...rest } = f;
    return {
      ...rest,
      access: { forward: access.forward.status, backward: access.backward.status },
      warnings: facilityWarnings,
    };
  };
  for (const klass of ['I', 'II', 'III', 'IV']) {
    counts[`class-${klass}`] = await writeCollection(
      path.join(config.output, `class-${klass}.geojson`),
      records,
      (r) => {
        const selected = visible(r).filter((f) => f.class_like === klass);
        return r.geometry && selected.length ? lean(r, selected.map(compact)) : null;
      },
    );
  }
  for (const [name, select] of Object.entries({
    'legacy-accessible-paths': (r) =>
      visible(r).filter(
        (f) =>
          f.class_like === 'I' ||
          (r.tags.highway === 'cycleway' && f.kind === 'roadside_cycleway') ||
          (['path', 'footway', 'track', 'bridleway', 'pedestrian'].includes(
            r.tags.highway,
          ) &&
            ['yes', 'designated'].includes(r.tags.bicycle) &&
            ['bicycle_accessible_path', 'bicycle_accessible_sidewalk'].includes(f.kind)),
      ),
    'lanes-and-protected-tracks': (r) =>
      visible(r).filter((f) => ['II', 'IV'].includes(f.class_like)),
    'path-candidates': (r) => visible(r).filter((f) => f.path_candidate),
    'other-facilities': (r) => visible(r).filter((f) => f.class_like === null),
    unpaved: (r) =>
      r.classification.facilities.filter((f) => f.surface_state === 'unpaved'),
    'unknown-surface': (r) =>
      r.classification.facilities.filter((f) => f.surface_state === 'unknown'),
    'restricted-or-inactive': (r) =>
      r.classification.facilities.filter((f) => !f.eligible),
  })) {
    counts[name] = await writeCollection(
      path.join(config.output, `${name}.geojson`),
      records,
      (r) => {
        const selected = select(r);
        return r.geometry && selected.length ? lean(r, selected.map(compact)) : null;
      },
    );
  }
  counts['route-network'] = await writeCollection(
    path.join(config.output, 'route-network.geojson'),
    records,
    (r) =>
      r.geometry && r.classification.routes.length
        ? {
            ...lean(r, []),
            properties: {
              ...lean(r, []).properties,
              routes: r.classification.routes,
              access: r.classification.access,
              conditional: r.classification.conditional,
              inactive: r.classification.inactive,
              review_only: true,
            },
          }
        : null,
  );
  counts.review = await writeCollection(
    path.join(config.output, 'review.geojson'),
    records,
    (r) =>
      r.geometry &&
      (r.classification.warnings.length ||
        r.classification.references.length ||
        r.classification.facilities.some(
          (f) =>
            f.review_required ||
            !f.eligible ||
            (config.surfaces === 'paved' && f.surface_state !== 'paved'),
        ))
        ? {
            ...lean(r, r.classification.facilities.map(compact)),
            properties: {
              ...lean(r, r.classification.facilities.map(compact)).properties,
              warnings: r.classification.warnings,
              references: r.classification.references,
              conditional: r.classification.conditional,
              review_only: true,
            },
          }
        : null,
  );
  const debug = await open(path.join(config.output, 'debug.jsonl'), 'wx');
  try {
    for (const { coordinates, type, ...record } of records)
      await debug.write(json(record) + '\n');
  } finally {
    await debug.close();
  }
  const finalStat = await stat(config.input);
  if (finalStat.size !== inputStat.size || finalStat.mtimeMs !== inputStat.mtimeMs)
    throw new Error('Input changed during generation; output remains incomplete.');
  const report = {
    status: 'complete',
    rules_version: RULES_VERSION,
    node_version: process.version,
    input: {
      path: config.input,
      bytes: inputStat.size,
      sha256: await shaFile(config.input),
    },
    options: config,
    surface_config: surfaces,
    generator_sha256: Object.fromEntries(
      await Promise.all(
        [
          'generate.mjs',
          'rules.mjs',
          'relations.mjs',
          'geometry.mjs',
          'read_osm.py',
          'requirements.txt',
        ].map(async (f) => [f, await shaFile(path.join(HERE, f))]),
      ),
    ),
    counts: {
      input_candidate_highway_ways: seen,
      bicycle_relations: relations.length,
      expanded_memberships: routeIndex.expandedMemberships,
      candidate_ways: records.length,
      missing_geometry: records.filter((r) => !r.geometry).length,
      ...counts,
    },
    warnings,
    warning_samples: warningSamples,
    runtime_seconds: Number(((performance.now() - started) / 1000).toFixed(3)),
    node_peak_rss_bytes: process.resourceUsage().maxRSS * 1024,
    reader_metrics: [relationMetrics, wayMetrics],
    attribution: '© OpenStreetMap contributors',
    license: 'https://opendatacommons.org/licenses/odbl/1-0/',
    source_urls: [
      'https://wiki.openstreetmap.org/wiki/Key:cycleway',
      'https://wiki.openstreetmap.org/wiki/Key:cycleway:lane',
      'https://wiki.openstreetmap.org/wiki/Key:cycleway:separation',
      'https://wiki.openstreetmap.org/wiki/Key:access',
      'https://wiki.openstreetmap.org/wiki/Conditional_restrictions',
      'https://wiki.openstreetmap.org/wiki/Cycle_routes',
      'https://wiki.openstreetmap.org/wiki/Key:is_sidepath',
      'https://wiki.openstreetmap.org/wiki/Key:surface',
      'https://dot.ca.gov/-/media/dot-media/programs/design/documents/chp1000-a11y.pdf',
    ],
    limitations: [
      'Inferred facility classes, not official California classifications or a safety rating.',
      'Unspecified access is not a legal access determination; conditional restrictions are not evaluated.',
      'No spatial deduplication: cycleway=separate only suppresses that road-side facility.',
      'Bicycle relations only; missing/out-of-extract nested members cannot be recovered.',
      'Right-hand traffic assumptions; side is relative to OSM way direction.',
      'Optional simplification/rounding is for display; intermediate junction topology is not guaranteed.',
      'Review, route-network, unpaved and unknown-surface layers may include restricted/inactive facilities; filter eligible before any map use.',
    ],
  };
  await writeFile(
    path.join(config.output, 'report.json'),
    JSON.stringify(stable(report), null, 2) + '\n',
    { flag: 'wx' },
  );
  const { unlink } = await import('node:fs/promises');
  await unlink(marker);
  console.log(
    JSON.stringify(
      {
        output: config.output,
        seconds: report.runtime_seconds,
        counts: report.counts,
        warnings,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`Overlay generation failed: ${error.message}`);
  process.exitCode = 1;
});
