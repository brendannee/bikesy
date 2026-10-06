export const RULES_VERSION = '1.2.1';
export const DEFAULT_SURFACES = {
  paved: [
    'paved',
    'asphalt',
    'concrete',
    'concrete:lanes',
    'concrete:plates',
    'paving_stones',
    'sett',
    'cobblestone',
    'unhewn_cobblestone',
  ],
  unpaved: [
    'unpaved',
    'compacted',
    'fine_gravel',
    'gravel',
    'pebblestone',
    'ground',
    'dirt',
    'earth',
    'grass',
    'grass_paver',
    'sand',
    'mud',
    'rock',
    'clay',
    'woodchips',
    'snow',
    'ice',
    'salt',
  ],
};
const ROADS = new Set([
  'residential',
  'living_street',
  'tertiary',
  'tertiary_link',
  'secondary',
  'secondary_link',
  'primary',
  'primary_link',
  'unclassified',
  'service',
  'road',
  'trunk',
  'trunk_link',
]);
const YES = new Set(['yes', 'designated', 'official']);
const DIRECT_KINDS = {
  lane: ['lane', 'II', 'medium'],
  track: ['protected_track', 'IV', 'medium'],
  shared_lane: ['shared_lane', 'III', 'medium'],
  share_busway: ['shared_bus_lane', null, 'medium'],
};
const scoped = (tags, side, suffix) => {
  const keys =
    side === 'left' || side === 'right'
      ? [`cycleway:${side}:${suffix}`, `cycleway:both:${suffix}`, `cycleway:${suffix}`]
      : [`cycleway:${suffix}`];
  const key = keys.find((k) => tags[k] !== undefined);
  return { key: key ?? null, value: key ? tags[key] : undefined };
};

function accessFor(tags, direction) {
  const key = [
    `bicycle:${direction}`,
    'bicycle',
    `vehicle:${direction}`,
    'vehicle',
    `access:${direction}`,
    'access',
  ].find((k) => tags[k] !== undefined);
  const value = key ? tags[key] : null;
  const status =
    value === null
      ? 'unspecified'
      : YES.has(value)
        ? 'allowed'
        : value === 'permissive'
          ? 'permissive'
          : value === 'dismount'
            ? 'dismount'
            : ['no', 'private', 'use_sidepath'].includes(value)
              ? value
              : [
                    'destination',
                    'customers',
                    'delivery',
                    'permit',
                    'agricultural',
                    'forestry',
                  ].includes(value)
                ? 'limited'
                : 'uncertain';
  return { status, value, key: key ?? null };
}

function directionInfo(tags, side, value) {
  const directionTag = scoped(tags, side, 'oneway');
  if (directionTag.value !== undefined) {
    return {
      directions:
        directionTag.value === 'no'
          ? ['forward', 'backward']
          : directionTag.value === '-1'
            ? ['backward']
            : directionTag.value === 'yes' || directionTag.value === '1'
              ? ['forward']
              : [],
      direction_source: directionTag.key,
    };
  }
  const reverseRoad = tags.oneway === '-1';
  if (value.startsWith('opposite_'))
    return {
      directions: [reverseRoad ? 'forward' : 'backward'],
      direction_source: 'legacy_opposite',
    };
  if (side === 'way') {
    const key = tags['oneway:bicycle'] !== undefined ? 'oneway:bicycle' : 'oneway';
    const v = tags[key];
    return {
      directions:
        v === '-1'
          ? ['backward']
          : v === 'yes' || v === '1'
            ? ['forward']
            : v && v !== 'no'
              ? []
              : ['forward', 'backward'],
      direction_source: v ? key : 'two_way_default',
    };
  }
  if (side === 'unspecified')
    return { directions: [], direction_source: 'unspecified_side' };
  if (tags.oneway === 'yes' || tags.oneway === '1' || reverseRoad)
    return {
      directions: [reverseRoad ? 'backward' : 'forward'],
      direction_source: 'road_oneway_default',
    };
  return {
    directions: [side === 'right' ? 'forward' : 'backward'],
    direction_source: 'right_hand_traffic_default',
  };
}

// Practical display candidate, deliberately separate from strict Class I inference.
export function inferPathCandidate(tags, facility) {
  const supported =
    tags.highway === 'cycleway' ||
    (['path', 'footway'].includes(tags.highway) && tags.bicycle === 'designated');
  if (
    !supported ||
    facility.side !== 'way' ||
    facility.class_like === 'IV' ||
    (tags.footway === 'sidewalk' && tags.highway !== 'cycleway') ||
    ['crossing', 'traffic_island'].includes(tags.footway) ||
    ['sidewalk', 'crossing', 'traffic_island'].includes(tags.path) ||
    ['track', 'crossing', 'link', 'traffic_island', 'separate'].includes(tags.cycleway)
  )
    return null;
  const context =
    tags.is_sidepath === 'no'
      ? 'tagged_independent'
      : tags.is_sidepath === 'yes'
        ? 'tagged_roadside_shared_or_unresolved'
        : 'independence_unverified';
  return {
    label: 'Inferred bicycle path candidate',
    confidence: 'medium',
    evidence: [
      'highway',
      ...(tags.highway !== 'cycleway' ? ['bicycle'] : []),
      ...(tags.is_sidepath ? ['is_sidepath'] : []),
    ],
    road_context: context,
    ...(tags.footway === 'sidewalk' ? { sidewalk_context: true } : {}),
    independence_confidence: tags.is_sidepath === 'no' ? 'medium' : 'low',
    official_class: false,
    review_required: true,
  };
}

export function classifyWay(
  tags,
  routes = [],
  surfaces = DEFAULT_SURFACES,
  { pathPolicy = 'practical' } = {},
) {
  const warnings = new Set();
  const facilities = [];
  const references = [];
  const lifecycleStates = [
    'proposed',
    'construction',
    'disused',
    'abandoned',
    'razed',
    'demolished',
  ];
  const highway = lifecycleStates.includes(tags.highway)
    ? (tags[tags.highway] ?? tags.highway)
    : (tags.highway ??
      lifecycleStates.map((state) => tags[`${state}:highway`]).find(Boolean));
  const access = {
    forward: accessFor(tags, 'forward'),
    backward: accessFor(tags, 'backward'),
  };
  const conditional = Object.fromEntries(
    Object.entries(tags).filter(
      ([k]) =>
        /^(bicycle|vehicle|access|oneway|cycleway)(:|$)/.test(k) &&
        k.includes(':conditional'),
    ),
  );
  const inactive = lifecycleStates.some(
    (v) =>
      tags.highway === v ||
      tags[v] === 'yes' ||
      tags[`${v}:highway`] !== undefined ||
      Object.keys(tags).some((key) => key.startsWith(`${v}:cycleway`)),
  );
  if (Object.keys(conditional).length)
    warnings.add('conditional_access_or_facility_unevaluated');
  if (inactive) warnings.add('inactive_lifecycle');
  if (tags.area === 'yes') warnings.add('area_not_linear_facility');
  if (
    tags['cycleway:lanes'] ||
    tags['bicycle:lanes'] ||
    Object.keys(tags).some((k) => /^cycleway:(left|right|both):lanes/.test(k))
  )
    warnings.add('per_lane_arrays_not_interpreted');
  if (tags['cycleway:forward'] || tags['cycleway:backward'])
    warnings.add('directional_cycleway_values_require_review');

  const add = (kind, classLike, confidence, side, evidence, rawValue = '') => {
    const surfaceAttr =
      side === 'way'
        ? { key: tags.surface === undefined ? null : 'surface', value: tags.surface }
        : scoped(tags, side, 'surface');
    const surface = surfaceAttr.value ?? tags.surface ?? null;
    const surfaceSource =
      surfaceAttr.key ?? (tags.surface === undefined ? null : 'surface');
    const surfaceState =
      surface === null
        ? 'unknown'
        : surfaces.paved.includes(surface)
          ? 'paved'
          : surfaces.unpaved.includes(surface)
            ? 'unpaved'
            : 'unknown';
    const direction = directionInfo(tags, side, rawValue);
    const checks = direction.directions.length
      ? direction.directions.map((d) => access[d])
      : Object.values(access);
    const usable = checks.some((a) =>
      ['allowed', 'unspecified', 'permissive'].includes(a.status),
    );
    const fWarnings = [];
    if (!direction.directions.length) fWarnings.push('facility_direction_unknown');
    if (checks.some((a) => !['allowed', 'unspecified'].includes(a.status)))
      fWarnings.push('access_qualification');
    if (surfaceState === 'unknown') fWarnings.push('surface_unknown');
    const subtype = scoped(tags, side, 'lane');
    const buffer = scoped(tags, side, 'buffer');
    const separation = scoped(tags, side, 'separation');
    if (kind === 'lane' && subtype.value === 'advisory') {
      fWarnings.push('advisory_lane_not_exclusive');
      confidence = 'low';
    }
    if (
      kind === 'lane' &&
      separation.value &&
      !['no', 'none', 'painted_buffer'].includes(separation.value)
    ) {
      fWarnings.push('lane_with_physical_separation_conflict');
      confidence = 'low';
    }
    if (tags.segregated)
      fWarnings.push('segregated_describes_pedestrian_separation_only');
    const blocked =
      !usable ||
      inactive ||
      tags.area === 'yes' ||
      highway === 'steps' ||
      ['motorway', 'motorway_link'].includes(highway) ||
      tags.motorroad === 'yes';
    if (['motorway', 'motorway_link'].includes(highway) || tags.motorroad === 'yes')
      fWarnings.push('motorroad_requires_manual_access_review');
    const conditionalReview = Object.keys(conditional).length > 0;
    facilities.push({
      kind,
      class_like: classLike,
      official_class: false,
      confidence,
      side,
      ...direction,
      permitted_directions: direction.directions.filter((d) =>
        ['allowed', 'unspecified', 'permissive'].includes(access[d].status),
      ),
      evidence,
      surface,
      surface_state: surfaceState,
      surface_source: surfaceSource,
      subtype: subtype.value ?? null,
      buffer: buffer.value ?? null,
      separation: separation.value ?? null,
      access,
      eligible: !blocked && !conditionalReview,
      review_required: confidence === 'low' || conditionalReview || fWarnings.length > 0,
      warnings: fWarnings.sort(),
    });
    const facility = facilities.at(-1);
    const pathCandidate = inferPathCandidate(tags, facility);
    if (pathCandidate) {
      facility.path_candidate = pathCandidate;
      facility.review_required = true;
      if (pathPolicy === 'practical') {
        facility.class_like = 'I';
        facility.kind = 'inferred_bicycle_path';
        facility.confidence = pathCandidate.independence_confidence;
      }
    }
  };

  // A separately mapped way requires context: bicycle access alone is not Class I.
  if (
    ['cycleway', 'path', 'footway', 'pedestrian', 'bridleway', 'steps', 'track'].includes(
      highway,
    )
  ) {
    if (highway === 'cycleway' || tags.bicycle || tags['ramp:bicycle'] || routes.length) {
      if (highway === 'steps') add('steps', null, 'high', 'way', ['highway']);
      else if (
        (tags.footway === 'sidewalk' && highway !== 'cycleway') ||
        tags.path === 'sidewalk'
      )
        add(
          'bicycle_accessible_sidewalk',
          null,
          'low',
          'way',
          ['highway', tags.footway ? 'footway' : 'path', 'bicycle'].filter(
            (k) => tags[k],
          ),
        );
      else if (
        tags.is_sidepath === 'no' &&
        (highway === 'cycleway' || tags.bicycle === 'designated')
      )
        add('independent_bikeway', 'I', 'medium', 'way', [
          'highway',
          'is_sidepath',
          ...(tags.bicycle ? ['bicycle'] : []),
        ]);
      else if (
        highway === 'cycleway' &&
        (tags.cycleway === 'track' || (tags.is_sidepath === 'yes' && tags.foot === 'no'))
      )
        add('roadside_cycleway', 'IV', 'medium', 'way', [
          'highway',
          ...(tags.cycleway === 'track' ? ['cycleway'] : ['is_sidepath', 'foot']),
        ]);
      else
        add(
          highway === 'cycleway'
            ? 'separate_cycleway_context_unknown'
            : 'bicycle_accessible_path',
          null,
          'low',
          'way',
          [
            'highway',
            ...(tags.bicycle ? ['bicycle'] : []),
            ...(tags.is_sidepath ? ['is_sidepath'] : []),
          ],
        );
    }
  } else {
    const sideKeys = ['cycleway:left', 'cycleway:right', 'cycleway:both'];
    const explicitSides = sideKeys.some((k) => tags[k] !== undefined);
    const values = explicitSides
      ? ['left', 'right'].map((side) => {
          const key = [`cycleway:${side}`, 'cycleway:both', 'cycleway'].find(
            (k) => tags[k] !== undefined,
          );
          return [side, key, key ? tags[key] : undefined];
        })
      : [['unspecified', 'cycleway', tags.cycleway]];
    // If the generic fallback is ambiguous on just one side, retain that uncertainty.
    for (const [side, key, raw] of values) {
      if (!raw || raw === 'no' || raw === 'none') continue;
      if (raw === 'separate') {
        references.push({ side, evidence: key, kind: 'separately_mapped_reference' });
        continue;
      }
      let value = raw;
      if (value === 'shared_busway') {
        value = 'share_busway';
        warnings.add('noncanonical_shared_busway_alias');
      }
      if (value.startsWith('opposite')) {
        warnings.add('deprecated_opposite_value');
        if (value === 'opposite') {
          references.push({ side, evidence: key, kind: 'contraflow_access_only' });
          continue;
        }
        value = value.slice('opposite_'.length);
      }
      const mapping = DIRECT_KINDS[value];
      if (mapping) add(...mapping, side, [key], raw);
      else {
        warnings.add(`unclassified_cycleway_value:${value}`);
        references.push({ side, evidence: key, kind: 'unclassified_value', value });
      }
    }
  }

  const activeRoutes = routes.filter(
    (r) =>
      !r.inactive &&
      !r.conditional_path &&
      !['proposed', 'construction', 'disused', 'abandoned'].includes(r.state) &&
      !Object.keys(r.conditional ?? {}).length,
  );
  if (
    ROADS.has(highway) &&
    facilities.length === 0 &&
    references.every((r) => r.kind === 'unclassified_value')
  ) {
    if (tags.bicycle_road === 'yes' || tags.cyclestreet === 'yes')
      add('bicycle_priority_street', 'III', 'medium', 'way', [
        tags.bicycle_road === 'yes' ? 'bicycle_road' : 'cyclestreet',
      ]);
    else if (
      tags.lcn === 'yes' ||
      tags.rcn === 'yes' ||
      tags.ncn === 'yes' ||
      tags.icn === 'yes' ||
      activeRoutes.length
    ) {
      add('route_network_road', 'III', 'low', 'way', [
        activeRoutes.length
          ? 'route_relation_membership'
          : ['lcn', 'rcn', 'ncn', 'icn'].find((k) => tags[k] === 'yes'),
      ]);
      warnings.add('route_membership_does_not_prove_signage');
    }
  }
  const candidate =
    facilities.length > 0 ||
    references.length > 0 ||
    routes.length > 0 ||
    Object.keys(tags).some((k) => k.startsWith('cycleway'));
  return {
    candidate,
    facilities,
    references,
    routes,
    access,
    conditional,
    inactive,
    warnings: [...warnings].sort(),
  };
}
