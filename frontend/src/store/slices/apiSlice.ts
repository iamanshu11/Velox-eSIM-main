import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  keepUnusedDataFor: 300,
  tagTypes: [
    'Auth',
    'Orders',
    'eSIM',
    'Analytics',
    'Settings',
    'Webhooks',
    'Uploads',
    'Wallet',
    'AutoRenewal',
    'Billing',
    'Referral',
    'AutoEmailTemplate',
    'AutoEmailSchedule',
    'AutoEmailAnalytics',
    'AutoEmailAbTest',
    'AutoEmailSegment',
    'AutoEmailDeliveryReport',
    'User',
    'BlogPost',
    'BlogCategory',
  ],
  endpoints: () => ({}),
});

export default apiSlice;
