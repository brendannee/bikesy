const AirQuality = async (request, response) => {
  const { lat, lng } = request.query;
  const url = `http://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${lat}&longitude=${lng}&distance=5&API_KEY=${process.env.AIRNOW_API_KEY}`;
  const result = await fetch(url).then((airNowResponse) =>
    airNowResponse.json()
  );

  response.json(result);
};

export default AirQuality;
