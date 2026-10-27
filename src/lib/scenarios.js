import _ from 'lodash';

// A routing control is one preference select: { key, label, options: [{ text, value }] }.
// Each entry in config.SCENARIOS gives a value for every control key, and the scenario id
// (the SCENARIOS key) is what is stored in the URL, sent to the routing API and tracked.
//
// All helpers take the region config as their first argument so they can be tested with
// synthetic configs. Values are compared as strings, because the options in the region
// configs use numbers while the SCENARIOS tables use strings.

const normalizeControl = (control) => ({
  ...control,
  className: control.className ?? _.kebabCase(control.key),
  options: (control.options ?? []).map((option) => ({
    ...option,
    value: String(option.value),
  })),
});

// Returns the controls to render. Regions without ROUTING_CONTROLS get the legacy
// "Route Type" and "Hill Reluctance" controls built from ROUTE_TYPE_OPTIONS and
// HILL_ROUTING_OPTIONS. Controls without options are left out, so they neither render
// nor take part in matching scenarios.
export function getRoutingControls(config) {
  const controls = config.ROUTING_CONTROLS ?? [
    { key: 'routeType', label: 'Route Type', options: config.ROUTE_TYPE_OPTIONS },
    {
      key: 'hillReluctance',
      label: 'Hill Reluctance',
      options: config.HILL_ROUTING_OPTIONS,
    },
  ];
  return controls.map(normalizeControl).filter((control) => control.options.length > 0);
}

// Returns { [key]: value } for the controls. An unknown scenario (such as a stale link)
// shows the default scenario's values rather than failing.
export function scenarioToSelections(config, scenario) {
  const values = config.SCENARIOS[scenario] ?? config.SCENARIOS[config.DEFAULT_SCENARIO];
  return Object.fromEntries(
    getRoutingControls(config).map((control) => [
      control.key,
      values?.[control.key] == null
        ? control.options[0].value
        : String(values[control.key]),
    ]),
  );
}

// Returns the scenario id for a set of selections, never undefined.
//
// If a scenario matches every selection it is returned (the first one, if several do).
// Otherwise the combination does not exist in SCENARIOS, which happens when a region does
// not define every cell of its option grid. The fallback is:
//   1. Only consider scenarios that match the control the user just changed
//      (`changedKey`), so the control they touched always shows what they picked.
//   2. Of those, take the one matching the most of the other controls.
//   3. Break ties by SCENARIOS order (first defined wins).
// If `changedKey` is omitted or no scenario has that value, rule 1 is skipped.
export function selectionsToScenario(config, selections, changedKey) {
  const controls = getRoutingControls(config);
  const matches = (values, key) =>
    values[key] != null && String(values[key]) === String(selections[key]);

  let candidates = Object.entries(config.SCENARIOS);
  if (changedKey) {
    const changed = candidates.filter(([, values]) => matches(values, changedKey));
    if (changed.length) {
      candidates = changed;
    }
  }

  let bestScenario;
  let bestScore = -1;
  for (const [scenario, values] of candidates) {
    const score = controls.filter((control) => matches(values, control.key)).length;
    if (score > bestScore) {
      bestScenario = scenario;
      bestScore = score;
    }
  }

  return bestScenario ?? config.DEFAULT_SCENARIO;
}

// Returns a list of problems with a region's controls and scenarios, empty if consistent.
// Used by the tests to check the real region configs.
export function validateRoutingControls(config) {
  const problems = [];
  const controls = getRoutingControls(config);
  const keys = controls.map((control) => control.key);
  if (_.uniq(keys).length !== keys.length) {
    problems.push('duplicate control keys');
  }
  if (!config.SCENARIOS[config.DEFAULT_SCENARIO]) {
    problems.push(`DEFAULT_SCENARIO ${config.DEFAULT_SCENARIO} is not in SCENARIOS`);
  }
  for (const control of controls) {
    const values = control.options.map((option) => option.value);
    if (_.uniq(values).length !== values.length) {
      problems.push(`${control.key} has duplicate option values`);
    }
    for (const [scenario, scenarioValues] of Object.entries(config.SCENARIOS)) {
      if (!values.includes(String(scenarioValues[control.key]))) {
        problems.push(`scenario ${scenario} has no valid ${control.key} option`);
      }
    }
    for (const value of values) {
      if (
        !Object.values(config.SCENARIOS).some((s) => String(s[control.key]) === value)
      ) {
        problems.push(`${control.key} option ${value} is not used by any scenario`);
      }
    }
  }
  return problems;
}
