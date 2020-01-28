import ReactGA from 'react-ga';

const config = require('../frontendconfig.json');
const error = require('./error');

export function logQuery(startAddress, endAddress, startLocation, endLocation) {
  
}

export function ga() {
  ReactGA.initialize(config.googleAnalyticsId);
  ReactGA.pageview(window.location.pathname + window.location.search);
}
