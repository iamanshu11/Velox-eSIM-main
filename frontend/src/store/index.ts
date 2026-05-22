import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import planReducer from './slices/planSlice';
import wishlistReducer from './slices/wishlistSlice';
import apiSlice from './slices/apiSlice';
import './slices/esimSlice';
import './slices/analyticsSlice';
import './slices/ordersSlice';
import './slices/settingsSlice';
import './slices/webhooksSlice';
import './slices/walletSlice';
import './slices/credentialsSlice';
import './slices/autoRenewalSlice';
import './slices/billingSlice';
import './slices/referralSlice';
import './slices/autoEmailSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    plan: planReducer,
    wishlist: wishlistReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user'],
      },
    }).concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
