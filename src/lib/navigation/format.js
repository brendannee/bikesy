// Display and voice formatting for the navigation UI. Imperial units, like Bikesy.
// Banner and voice text come from Valhalla (via the backend's `nav_route`); this
// module only formats numbers and shapes Ferrostar's trip state for display.

const FEET_PER_METER = 3.28084;
const MPH_PER_MPS = 2.23694;

export function formatDistance(meters, { spoken = false } = {}) {
  const feet = meters * FEET_PER_METER;
  if (feet < 528) {
    // Under 0.1 mi: feet, rounded so the number doesn't flicker.
    const step = feet < 100 ? 10 : feet < 300 ? 25 : 50;
    const rounded = Math.max(step, Math.round(feet / step) * step);
    return spoken ? `${rounded} feet` : `${rounded} ft`;
  }
  const miles = feet / 5280;
  const value = miles < 10 ? miles.toFixed(1) : Math.round(miles).toString();
  if (spoken) {
    return `${value === '1.0' ? '1' : value} ${value === '1.0' ? 'mile' : 'miles'}`;
  }
  return `${value} mi`;
}

export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function formatClock(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Metres per second -> "12.3 mph".
export function formatSpeed(metersPerSecond) {
  return `${(metersPerSecond * MPH_PER_MPS).toFixed(1)} mph`;
}

// --- Banner and step list -----------------------------------------------------

// Valhalla ends generic instructions with a period ("Bear left.", "Continue on the
// cycleway.") but not street names ("Sussex Avenue"). Drop it so banners are uniform.
export function bannerText(text) {
  return (text ?? '').replace(/\.$/, '');
}

// Show a "Then" strip under the banner when the following maneuver comes quickly
// after this one.
export const THEN_WITHIN_METERS = 150;

// navigating: TripState.Navigating. Returns the following maneuver's primary visual
// instruction ({ text, maneuverType, maneuverModifier }), or null if there is no
// "Then" strip to show.
export function thenInstruction(navigating) {
  const current = navigating?.visualInstruction?.primaryContent;
  const next = navigating?.remainingSteps?.[1];
  const then = next?.visualInstructions?.[0]?.primaryContent;
  if (!then || !current || current.maneuverType === 'arrive') return null;
  return next.distance < THEN_WITHIN_METERS ? then : null;
}

// Rows for a list of Ferrostar steps (route.steps for the preview, or
// navigating.remainingSteps while riding). A step starts with its maneuver, whose
// type/modifier lives in the previous step's banner. While riding (`upcoming`),
// skip the step we're already on. Zero-length steps are dropped, except arrival.
//
// Returns [{ type, modifier, text, distance, unnamed }] where `distance` is meters
// (0 for arrival; format it with formatDistance) and `unnamed` marks steps on ways
// with no name in OpenStreetMap.
export function stepList(steps, { upcoming = false } = {}) {
  const rows = [];
  for (let i = upcoming ? 1 : 0; i < steps.length; i++) {
    const s = steps[i];
    const last = i === steps.length - 1;
    if (!s.distance && !last) continue;
    const banner = steps[i - 1]?.visualInstructions?.[0]?.primaryContent;
    const type = i === 0 ? 'depart' : banner?.maneuverType;
    rows.push({
      type,
      modifier: banner?.maneuverModifier,
      text: s.instruction,
      distance: s.distance,
      unnamed: !s.roadName && type !== 'arrive',
    });
  }
  return rows;
}
