import Keen from 'keen-js';
import ReactGA from 'react-ga';

const config = require('../frontendconfig.json');
const error = require('./error');

const client = new Keen({
  projectId: config.keenProjectId,
  writeKey: config.keenWriteKey,
});

export function logQuery(startAddress, endAddress, startLocation, endLocation) {
  const queryEvent = {
    startAddress,
    endAddress,
    startLocation,
    endLocation,
    referrer: document.referrer,
    keen: {
      timestamp: new Date().toISOString()
    }
  };

  client.addEvent("queries", queryEvent, (err) => {
    if (err) {
      // Fail silently
      console.log(err);
    }
  });
}

export function ga() {
  ReactGA.initialize(config.googleAnalyticsId);
  ReactGA.pageview(window.location.pathname + window.location.search);
}
