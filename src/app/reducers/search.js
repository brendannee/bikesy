import { createSlice } from '@reduxjs/toolkit';

// const waypoint = {
//   address: '123 Fake St',
//   latlng: [123.123, 581.18281],
// };

const initialState = {
  waypoints: null,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    addWaypoint: (state, action) => {
      state.waypoints = [...state.waypoints, action.payload];
    },
    clearWaypoints: (state) => {
      state.waypoints = [];
    },
  },
});

export const { addWaypoint, clearWaypoints } = searchSlice.actions;

export default searchSlice.reducer;
