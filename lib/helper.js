const config = require('../frontendconfig.json')

export function metersToMiles(meters) {
  return meters * 0.000621371
}

export function metersToFeet(meters) {
  return meters * 3.28084
}

function milesToFeet(miles) {
  return miles * 5280
}

function hoursToMinutes(hours) {
  return hours * 60
}

export function formatDistance(miles) {
  if (miles < 0.189393939) {
    return `${Math.round(milesToFeet(miles) / 10) * 10} feet`
  }

  return `${(Math.round(miles * 10) / 10).toFixed(1)} miles`
}

export function formatDistanceShort(miles) {
  if (miles < 0.189393939) {
    return `${Math.round(milesToFeet(miles) / 10) * 10}ft`
  }

  return `${(Math.round(miles * 10) / 10).toFixed(1)}mi`
}

export function formatTime(miles) {
  const lowEstimate = miles / config.highBikeSpeedMph
  const highEstimate = miles / config.lowBikeSpeedMph

  return highEstimate < 1 ? `${hoursToMinutes(lowEstimate).toFixed()} to ${hoursToMinutes(highEstimate).toFixed()} min` : `${lowEstimate.toFixed(1)} to ${highEstimate.toFixed(1)} hours`
}

export function getElevationGain(elevationProfile) {
  let totalElevGain = 0
  for (const [index, point] of elevationProfile.entries()) {
    if (index < elevationProfile.length - 1 && point.elevation < elevationProfile[index + 1].elevation) {
      totalElevGain += elevationProfile[index + 1].elevation - point.elevation
    }
  }

  return totalElevGain
}

export function formatElevation(feet) {
  return `${feet.toFixed()} feet`
}

/* Handle any missing elevations */
export function cleanElevationProfile(elevationProfile) {
  const profile = []

  for (const [index, point] of elevationProfile.entries()) {
    if (point.elevation !== -1) {
      profile.push(point)
      continue
    }

    // If first point in profile, find first valid elevation and use it
    if (profile.length === 0) {
      const nextPoint = elevationProfile.find(p => p !== -1)
      profile.push({
        ...point,
        elevation: nextPoint.elevation
      })
      continue
    }

    // If last point in profile, use the last valid elevation
    if (index === elevationProfile.length - 1) {
      const previousPoint = profile[profile.length - 1]
      profile.push({
        ...point,
        elevation: previousPoint.elevation
      })
      continue
    }

    // Else use an average of the next and previous points weighted by distance
    const previousPoint = profile[profile.length - 1]
    const nextPoint = elevationProfile.slice(index).find(p => p !== -1)

    // If no remaining  points in profile have elevations, use the last valid elevation
    if (!nextPoint) {
      profile.push({
        ...point,
        elevation: previousPoint.elevation
      })
      continue
    }

    profile.push({
      ...point,
      elevation: previousPoint.elevation
    })
  }

  return profile
}
