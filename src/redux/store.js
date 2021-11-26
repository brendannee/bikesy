import { configureStore } from '@reduxjs/toolkit';
import search from './slices/search';

export default configureStore({
  reducer: {
    search,
  },
});
