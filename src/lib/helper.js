export function metersToMiles(meters) {
  return meters * 0.000621371;
}

export function metersToFeet(meters) {
  return meters * 3.28084;
}

function hoursToMinutes(hours) {
  return hours * 60;
}

export function formatDistance(miles) {
  return `${miles.toFixed(1)} miles`;
}

export function formatTime(miles) {
  const lowEstimate = miles / process.env.NEXT_PUBLIC_BIKESY_HIGH_BIKE_SPEED_MPH || 10;
  const highEstimate = miles / process.env.NEXT_PUBLIC_BIKESY_LOW_BIKE_SPEED_MPH || 7.5;

  let formattedTime;
  if (highEstimate < 1) {
    formattedTime = `${hoursToMinutes(lowEstimate).toFixed()} to ${hoursToMinutes(
      highEstimate
    ).toFixed()} min`;
  } else {
    formattedTime = `${lowEstimate.toFixed(1)} to ${highEstimate.toFixed(1)} hours`;
  }

  return formattedTime;
}

export function getElevationGain(profile) {
  // Compute the sum of all the positive elevation gain segments along the route
  // profile is a list of objects with "elevation" and "distance" properties, each corresponding to a path segment
  let totalElevGain = 0;
  for (let idx = 0; idx < profile.length - 1; idx++) {
    const elevationStep = profile[idx + 1]['elevation'] - profile[idx]['elevation'];
    if (elevationStep > 0) {
      totalElevGain += elevationStep;
    }
  }
  return totalElevGain;
}

export function formatElevation(feet) {
  return `${feet.toFixed()} feet`;
}
