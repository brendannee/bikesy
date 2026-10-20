import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';

import search from './slices/search';
import navigation from './slices/navigation';

export default configureStore({
  reducer: {
    search,
    navigation,
  },
  middleware: (getDefaultMiddlware) => getDefaultMiddlware().concat(logger),
});
