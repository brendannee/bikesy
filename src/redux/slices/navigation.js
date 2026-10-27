import { createSlice } from '@reduxjs/toolkit';

// What the navigation screens show. The ride itself (Ferrostar session, GPS watch,
// timers) lives in a RideController (lib/navigation/controller.js), which publishes
// display-ready values here with updateNavigation.
const initialState = {
  // idle | starting | navigating | rerouting | arrived
  status: 'idle',
  // Why the last Start ride failed, shown on the planning screen.
  error: null,
  // Next turn: { type, modifier, distance, text, then }
  banner: null,
  offRoute: false,
  // { arrival, timeLeft, distanceLeft }
  trip: null,
  // Upcoming steps: [{ type, modifier, text, distance, unnamed }]
  steps: [],
  // False once the rider pans the map; Recenter turns it back on.
  following: true,
  muted: false,
  // { text, ms, id }
  toast: null,
  // ?sim=1 controls: { speedKmh, paused }
  sim: null,
  // At arrival: { distance, time, speed, note }
  summary: null,
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    startNavigation: (state) => ({
      ...initialState,
      muted: state.muted,
      status: 'starting',
    }),
    updateNavigation: (state, action) => ({ ...state, ...action.payload }),
    endNavigation: (state, action) => ({
      ...initialState,
      muted: state.muted,
      error: action.payload?.error ?? null,
    }),
    dismissNavigationError: (state) => {
      state.error = null;
    },
    setMuted: (state, action) => {
      state.muted = action.payload;
    },
  },
});

// While riding or looking at the arrival card, navigation has the whole screen.
export const isNavigating = (status) =>
  status === 'navigating' || status === 'rerouting' || status === 'arrived';

export const {
  startNavigation,
  updateNavigation,
  endNavigation,
  dismissNavigationError,
  setMuted,
} = navigationSlice.actions;

export default navigationSlice.reducer;
