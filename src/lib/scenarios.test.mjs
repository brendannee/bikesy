import assert from 'node:assert/strict';
import { test } from 'node:test';
import _ from 'lodash';
import defaults from '../appConfig/defaults.js';
import sf from '../appConfig/sf.js';
import contracosta from '../appConfig/contracosta.js';
import tahoe from '../appConfig/tahoe.js';
import {
  getRoutingControls,
  scenarioToSelections,
  selectionsToScenario,
  validateRoutingControls,
} from './scenarios.js';

// Same merge as src/appConfig/index.js.
const region = (config) => ({ ...defaults, ...config });
const sfConfig = region(sf);
const contraCostaConfig = region(contracosta);
const tahoeConfig = region(tahoe);

// The mapping used before the controls were config-driven.
const legacyComponentsToScenario = (config, components) =>
  _.findKey(config.SCENARIOS, (scenario) => _.isMatch(scenario, components));

const options = (...values) =>
  values.map((value) => ({ text: `Option ${value}`, value }));

// A 2x3 grid: scenarios 1-6, with "speed" varying fastest. Scenario numbering matches
// how a region would plausibly list them, and includes ids with two digits.
const grid2x3 = {
  ...defaults,
  ROUTING_CONTROLS: [
    { key: 'surface', label: 'Surface', options: options('paved', 'dirt') },
    { key: 'speed', label: 'Speed', options: options('slow', 'medium', 'fast') },
  ],
  DEFAULT_SCENARIO: '2',
  SCENARIOS: {
    1: { surface: 'paved', speed: 'slow' },
    2: { surface: 'paved', speed: 'medium' },
    3: { surface: 'paved', speed: 'fast' },
    10: { surface: 'dirt', speed: 'slow' },
    11: { surface: 'dirt', speed: 'medium' },
    12: { surface: 'dirt', speed: 'fast' },
  },
};

test('regions without ROUTING_CONTROLS get the legacy controls with their labels', () => {
  for (const config of [sfConfig, contraCostaConfig]) {
    const controls = getRoutingControls(config);
    assert.deepEqual(
      controls.map(({ key, label, className }) => ({ key, label, className })),
      [
        { key: 'routeType', label: 'Route Type', className: 'route-type' },
        { key: 'hillReluctance', label: 'Hill Reluctance', className: 'hill-reluctance' },
      ],
    );
    assert.deepEqual(
      controls[0].options.map((option) => [option.text, option.value]),
      [
        ['Mostly bike paths & lanes', '1'],
        ['A reasonable route', '2'],
        ['A more direct route', '3'],
      ],
    );
    assert.deepEqual(
      controls[1].options.map((option) => [option.text, option.value]),
      [
        ['Avoid at all costs', '1'],
        ['A reasonable route', '2'],
        ['Bring on the Hills!', '3'],
      ],
    );
  }
});

test('every SF selection maps to the same scenario as the old two-select code', () => {
  for (const config of [sfConfig, contraCostaConfig]) {
    assert.deepEqual(validateRoutingControls(config), []);
    for (const routeType of ['1', '2', '3']) {
      for (const hillReluctance of ['1', '2', '3']) {
        const expected = legacyComponentsToScenario(config, {
          routeType,
          hillReluctance,
        });
        assert.ok(expected);
        const selections = { routeType, hillReluctance };
        assert.equal(selectionsToScenario(config, selections, 'routeType'), expected);
        assert.equal(
          selectionsToScenario(config, selections, 'hillReluctance'),
          expected,
        );
        assert.equal(selectionsToScenario(config, selections), expected);
      }
    }
  }
});

test('SF scenarios round-trip through the selections and match the 3x3 layout', () => {
  for (let scenario = 1; scenario <= 9; scenario++) {
    const selections = scenarioToSelections(sfConfig, String(scenario));
    assert.deepEqual(selections, {
      routeType: String(3 - Math.floor((scenario - 1) / 3)),
      hillReluctance: String(((scenario - 1) % 3) + 1),
    });
    for (const key of ['routeType', 'hillReluctance']) {
      assert.equal(selectionsToScenario(sfConfig, selections, key), String(scenario));
    }
  }
});

test('changing one SF select from every scenario gives the same scenario as before', () => {
  for (let scenario = 1; scenario <= 9; scenario++) {
    const before = scenarioToSelections(sfConfig, String(scenario));
    for (const [key, values] of [
      ['routeType', ['1', '2', '3']],
      ['hillReluctance', ['1', '2', '3']],
    ]) {
      for (const value of values) {
        const selections = { ...before, [key]: value };
        assert.equal(
          selectionsToScenario(sfConfig, selections, key),
          legacyComponentsToScenario(sfConfig, selections),
        );
      }
    }
  }
});

test('Tahoe has one route type select with scenarios 1 and 2', () => {
  assert.deepEqual(validateRoutingControls(tahoeConfig), []);
  const controls = getRoutingControls(tahoeConfig);
  assert.deepEqual(
    controls.map((control) => [control.key, control.label, control.className]),
    [['routeType', 'Route Type', 'route-type']],
  );
  assert.deepEqual(
    controls[0].options.map((option) => [option.text, option.value]),
    [
      ['Mostly bike paths & lanes', '1'],
      ['A more direct route', '2'],
    ],
  );
  assert.equal(tahoeConfig.DEFAULT_SCENARIO, '1');
  for (const scenario of ['1', '2']) {
    const selections = scenarioToSelections(tahoeConfig, scenario);
    assert.deepEqual(selections, { routeType: scenario });
    assert.equal(selectionsToScenario(tahoeConfig, selections, 'routeType'), scenario);
  }
});

test('a 2x3 config renders both controls and maps every cell to its scenario', () => {
  assert.deepEqual(validateRoutingControls(grid2x3), []);
  assert.deepEqual(
    getRoutingControls(grid2x3).map((control) => [control.key, control.className]),
    [
      ['surface', 'surface'],
      ['speed', 'speed'],
    ],
  );
  for (const [scenario, values] of Object.entries(grid2x3.SCENARIOS)) {
    assert.deepEqual(scenarioToSelections(grid2x3, scenario), values);
    for (const key of ['surface', 'speed']) {
      assert.equal(selectionsToScenario(grid2x3, values, key), scenario);
    }
  }
  // Changing one control keeps the other.
  assert.equal(
    selectionsToScenario(grid2x3, { surface: 'dirt', speed: 'fast' }, 'surface'),
    '12',
  );
});

test('a single select works, with numeric option values', () => {
  const config = {
    ...defaults,
    ROUTING_CONTROLS: [
      { key: 'riding', label: 'What are you riding?', options: options(1, 2, 3, 4) },
    ],
    DEFAULT_SCENARIO: '3',
    SCENARIOS: { 1: { riding: 1 }, 2: { riding: 2 }, 3: { riding: 3 }, 4: { riding: 4 } },
  };
  assert.deepEqual(validateRoutingControls(config), []);
  assert.deepEqual(scenarioToSelections(config, '4'), { riding: '4' });
  assert.equal(selectionsToScenario(config, { riding: '2' }, 'riding'), '2');
});

test('controls without options are hidden and ignored when matching', () => {
  const config = {
    ...grid2x3,
    ROUTING_CONTROLS: [
      ...grid2x3.ROUTING_CONTROLS,
      { key: 'empty', label: 'Empty', options: [] },
    ],
  };
  assert.deepEqual(
    getRoutingControls(config).map((control) => control.key),
    ['surface', 'speed'],
  );
  assert.deepEqual(scenarioToSelections(config, '11'), {
    surface: 'dirt',
    speed: 'medium',
  });
  assert.equal(
    selectionsToScenario(config, { surface: 'dirt', speed: 'medium' }, 'speed'),
    '11',
  );
});

test('a combination with no scenario falls back to the one matching the most controls', () => {
  // Sparse grid: the paved/fast and dirt/slow cells do not exist.
  const sparse = {
    ...grid2x3,
    DEFAULT_SCENARIO: '1',
    SCENARIOS: {
      1: { surface: 'paved', speed: 'slow' },
      2: { surface: 'paved', speed: 'medium' },
      11: { surface: 'dirt', speed: 'medium' },
      12: { surface: 'dirt', speed: 'fast' },
    },
  };
  const pick = (selections, changedKey) =>
    selectionsToScenario(sparse, selections, changedKey);

  // The changed control always wins: choosing "fast" from paved/medium lands on dirt/fast.
  assert.equal(pick({ surface: 'paved', speed: 'fast' }, 'speed'), '12');
  // Choosing "paved" from dirt/fast keeps "fast" if possible, but there is no such cell;
  // both paved scenarios match one control and the first defined one wins.
  assert.equal(pick({ surface: 'paved', speed: 'fast' }, 'surface'), '1');
  // From dirt/medium, choosing "slow" has only paved/slow.
  assert.equal(pick({ surface: 'dirt', speed: 'slow' }, 'speed'), '1');
  // Choosing "dirt" from paved/slow: dirt/medium and dirt/fast both match one control.
  assert.equal(pick({ surface: 'dirt', speed: 'slow' }, 'surface'), '11');
  // Without a changed control, the best overall match is used and ties go to the first.
  assert.equal(pick({ surface: 'paved', speed: 'fast' }), '1');
  // A value no scenario has ignores the changed control rather than failing.
  assert.equal(pick({ surface: 'paved', speed: 'warp' }, 'speed'), '1');
  // Never undefined, even with nothing to match.
  assert.equal(selectionsToScenario({ ...sparse, SCENARIOS: {} }, {}, 'speed'), '1');
});

test('an unknown scenario shows the default scenario instead of failing', () => {
  assert.deepEqual(
    scenarioToSelections(sfConfig, '99'),
    scenarioToSelections(sfConfig, '5'),
  );
  assert.deepEqual(
    scenarioToSelections(sfConfig, undefined),
    scenarioToSelections(sfConfig, '5'),
  );
});

test('validateRoutingControls reports inconsistent configs', () => {
  const broken = {
    ...grid2x3,
    DEFAULT_SCENARIO: '7',
    SCENARIOS: { ...grid2x3.SCENARIOS, 3: { surface: 'paved', speed: 'warp' } },
  };
  assert.deepEqual(validateRoutingControls(broken), [
    'DEFAULT_SCENARIO 7 is not in SCENARIOS',
    'scenario 3 has no valid speed option',
  ]);
});
