const _ = require('lodash');

const scenarios = {
  1: {
    routeType: '3',
    hillReluctance: '1',
  },
  2: {
    routeType: '3',
    hillReluctance: '2',
  },
  3: {
    routeType: '3',
    hillReluctance: '3',
  },
  4: {
    routeType: '2',
    hillReluctance: '1',
  },
  5: {
    routeType: '2',
    hillReluctance: '2',
  },
  6: {
    routeType: '2',
    hillReluctance: '3',
  },
  7: {
    routeType: '1',
    hillReluctance: '1',
  },
  8: {
    routeType: '1',
    hillReluctance: '2',
  },
  9: {
    routeType: '1',
    hillReluctance: '3',
  },
};

export function scenarioToComponents(scenario) {
  return scenarios[scenario];
}

export function componentsToScenario(components) {
  return _.findKey(scenarios, (scenario) => _.isMatch(scenario, components));
}
