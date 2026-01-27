import appConfig from 'appConfig';
const _ = require('lodash');

export function scenarioToComponents(scenario) {
  return appConfig.SCENARIOS[scenario];
}

export function componentsToScenario(components) {
  return _.findKey(appConfig.SCENARIOS, (scenario) => _.isMatch(scenario, components));
}
