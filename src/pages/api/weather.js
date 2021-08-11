const Weather = async (request, response) => {
  const { lat, lng } = request.query;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${process.env.OPEN_WEATHER_MAP_API_KEY}`;
  const result = await fetch(url).then((weatherResponse) => weatherResponse.json());

  response.json(result);
};

export default Weather;
