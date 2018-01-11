import Keen from 'keen-js';
import ReactGA from 'react-ga';

const config = require('../frontendconfig.json');
const error = require('./error');

const client = new Keen({
  projectId: config.keenProjectId,
  writeKey: config.keenWriteKey,
});

exports.logQuery = (startAddress, endAddress, startLocation, endLocation) => {
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
};

exports.ga = () => {
  ReactGA.initialize('UA-5291794-1');
  ReactGA.pageview(window.location.pathname + window.location.search);
}