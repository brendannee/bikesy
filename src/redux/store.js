import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';

import search from './slices/search';

export default configureStore({
  reducer: {
    search,
  },
  middleware: (getDefaultMiddlware) => getDefaultMiddlware().concat(logger),
});
