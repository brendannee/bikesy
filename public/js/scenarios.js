const _ = require('underscore');

const scenarios = {
  '1': {
    routeType: '3',
    hillReluctance: '1',
  },
  '2': {
    routeType: '3',
    hillReluctance: '2',
  },
  '3': {
    routeType: '3',
    hillReluctance: '3',
  },
  '4': {
    routeType: '2',
    hillReluctance: '1',
  },
  '5': {
    routeType: '2',
    hillReluctance: '2',
  },
  '6': {
    routeType: '2',
    hillReluctance: '3',
  },
  '7': {
    routeType: '1',
    hillReluctance: '1',
  },
  '8': {
    routeType: '1',
    hillReluctance: '2',
  },
  '9': {
    routeType: '1',
    hillReluctance: '3',
  },
};

exports.scenarioToComponents = (scenario) => scenarios[scenario];

exports.componentsToScenario = (components) => _.findKey(scenarios, (scenario) => {
  return _.isMatch(scenario, components);
});
