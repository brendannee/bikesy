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

export function getElevationGain(profile) {
  let totalElevGain = 0
  profile.forEach((p, idx) => {
    if (idx < profile.length - 1 && profile[idx][1] < profile[idx + 1][1]) {
      totalElevGain += profile[idx + 1][1] - profile[idx][1]
    }
  })

  return totalElevGain
}

export function formatElevation(feet) {
  return `${feet.toFixed()} feet`
}
