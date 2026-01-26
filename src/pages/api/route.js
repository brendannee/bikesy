import appConfig from 'appConfig';
import Cors from 'cors';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(request, res, fn) {
  return new Promise((resolve, reject) => {
    fn(request, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

function getServerUrl(scenario) {
  return appConfig.SCENARIOS[scenario].server;
}

const Route = async (request, response) => {
  // Run the CORS middleware
  await runMiddleware(request, response, cors);

  const { lat1, lng1, lat2, lng2, scenario } = request.query;

  const server = getServerUrl(scenario);

  if (!server) {
    response.status(400).json({ error: 'invalid scenario' });
  }

  const url = `${server}?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}&scenario=${scenario}`;
  const result = await fetch(url).then((apiResponse) => apiResponse.json());

  response.json(result);
};

export default Route;
