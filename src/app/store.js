import { configureStore } from '@reduxjs/toolkit';

// import searchSlice from './reducers/search';
import { searchApi } from './services/search';

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [searchApi.reducerPath]: searchApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(searchApi.middleware),
});
