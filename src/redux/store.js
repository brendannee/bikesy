import { configureStore } from '@reduxjs/toolkit';

import search from './slices/search';
import navigation from './slices/navigation';

export default configureStore({
  reducer: {
    search,
    navigation,
  },
});
