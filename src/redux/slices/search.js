import { createSlice } from '@reduxjs/toolkit';

export const searchSlice = createSlice({
  name: 'search',
  initialState: {
    startAddress: null,
    endAddress: null,
    startLocation: null,
    endLocation: null,
    distance: null,
    directions: null,
  },
  reducers: {
    setStartAddress: (state, action) => {
      state.startAddress = action.payload;
    },
    setEndAddress: (state, action) => {
      state.endAddress = action.payload;
    },
    setStartLocation: (state, action) => {
      state.startLocation = action.payload;
    },
    setEndLocation: (state, action) => {
      state.endLocation = action.payload;
    },
    setDistance: (state, action) => {
      state.distance = action.payload;
    },
    setDirections: (state, action) => {
      state.directions = action.payload;
    },
    setElevationProfile: (state, action) => {
      state.elevationProfile = action.payload;
    },
    setPath: (state, action) => {
      state.path = action.payload;
    },
    clearPath: (state) => ({
      ...state,
      path: null,
      directions: null,
      elevationProfile: null,
    }),
    clearMarkers: (state) => ({
      ...state,
      startLocation: null,
      endLocation: null,
      startAddress: null,
      endAddress: null,
    }),
    clearRoute: (state) => ({
      ...state,
      startLocation: null,
      endLocation: null,
      startAddress: null,
      endAddress: null,
      path: null,
      directions: null,
      elevationProfile: null,
    }),
  },
});

export const {
  setStartAddress,
  setEndAddress,
  setStartLocation,
  setEndLocation,
  setDistance,
  setDirections,
  setElevationProfile,
  setPath,
  clearPath,
  clearMarkers,
  clearRoute,
} = searchSlice.actions;

export default searchSlice.reducer;
