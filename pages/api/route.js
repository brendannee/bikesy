/* global fetch */

import Cors from 'cors'

const cors = Cors({
  methods: ['GET', 'HEAD']
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(request, response, fn) {
  return new Promise((resolve, reject) => {
    fn(request, response, result => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

function getServerUrl(scenario) {
  if (scenario === '1' || scenario === '2' || scenario === '3') {
    return 'http://ec2-54-208-197-111.compute-1.amazonaws.com'
  }

  if (scenario === '4' || scenario === '5' || scenario === '6') {
    return 'http://ec2-54-84-66-250.compute-1.amazonaws.com'
  }

  if (scenario === '7' || scenario === '8' || scenario === '9') {
    return 'http://ec2-34-224-83-87.compute-1.amazonaws.com'
  }
}

const Route = async (request, response) => {
  // Run the CORS middleware
  await runMiddleware(request, response, cors)

  const { lat1, lng1, lat2, lng2, scenario } = request.query

  const server = getServerUrl(scenario)

  if (!server) {
    response.status(400).json({ error: 'invalid scenario' })
  }

  const url = `${server}?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}&scenario=${scenario}`
  const result = await fetch(url).then(apiResponse => apiResponse.json())

  response.json(result)
}

export default Route
