function getServerUrl(scenario) {
  if (scenario === '1' || scenario === '2' || scenario === '3') {
    return 'http://ec2-54-208-197-111.compute-1.amazonaws.com'
  } else if (scenario === '4' || scenario === '5' || scenario === '6') {
    return 'http://ec2-54-84-66-250.compute-1.amazonaws.com'
  } else if (scenario === '7' || scenario === '8' || scenario === '9') {
    return 'http://ec2-34-224-83-87.compute-1.amazonaws.com'
  }
}

export default async (request, response) => {
  const { lat1, lng1, lat2, lng2, scenario } = request.query

  const server = getServerUrl(scenario)

  if (!server) {
    res.status(400).json({ error: 'invalid scenario' })
  }

  const url = `${server}?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}&scenario=${scenario}`
  const result = await fetch(url).then(apiResponse => apiResponse.json())

  response.json(result)
}
