import 'whatwg-fetch';

const config = require('../frontendconfig.json');

// Only fetch air quality info ever 5 minutes
const cacheWindow = 5 * 60 * 60 * 1000;
let dataFetchTime;
let dataResults;

export const getAirQuality = async (lat, lng) => {
  const url = `https://bikesy.com/airquality.php?format=application/json&latitude=${lat}&longitude=${lng}&distance=5&API_KEY=${config.airNowApiKey}`;

  if (dataFetchTime && (dataFetchTime + cacheWindow > Date.now())) {
    return dataResults;
  }

  dataFetchTime = Date.now();

  const response = await fetch(url);

  dataResults = response.json();

  return dataResults;
};
