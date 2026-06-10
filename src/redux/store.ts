import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
