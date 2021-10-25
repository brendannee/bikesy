import appConfig from 'appConfig';

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
  const lowEstimate = miles / appConfig.BIKESY_HIGH_BIKE_SPEED_MPH;
  const highEstimate = miles / appConfig.BIKESY_LOW_BIKE_SPEED_MPH;

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
  let totalElevGain = 0;
  profile.forEach((p, idx) => {
    if (idx < profile.length - 1 && profile[idx][1] < profile[idx + 1][1]) {
      totalElevGain += profile[idx + 1][1] - profile[idx][1];
    }
  });

  return totalElevGain;
}

export function formatElevation(feet) {
  return `${feet.toFixed()} feet`;
}
