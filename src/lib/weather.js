// Only fetch weather info every 5 minutes
const cacheWindow = 5 * 60 * 60 * 1000;
let weatherFetchTime;
let weatherResults;

export const getWeather = async (lat, lng) => {
  const url = `/api/weather?lat=${lat}&lng=${lng}`;

  if (weatherFetchTime && weatherFetchTime + cacheWindow > Date.now()) {
    return weatherResults;
  }

  weatherFetchTime = Date.now();

  const response = await fetch(url);

  weatherResults = response.json();

  return weatherResults;
};
