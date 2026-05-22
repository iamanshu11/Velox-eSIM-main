import { apiSlice } from './apiSlice';
import type { Settings, ProfitMargin } from '@/types';

export const settingsSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<Settings, void>({
      query: () => '/settings',
      transformResponse: (response: any) => response.data,
      providesTags: ['Settings'],
    }),

    updateSettings: builder.mutation<Settings, Partial<Settings>>({
      query: (data) => ({
        url: '/settings',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Settings'],
    }),

    getProfitMargin: builder.query<ProfitMargin, void>({
      query: () => '/settings/profit-margin',
      transformResponse: (response: any) => response.data,
      providesTags: ['Settings'],
    }),

    updateProfitMargin: builder.mutation<ProfitMargin, Partial<ProfitMargin>>({
      query: (data) => ({
        url: '/settings/profit-margin',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetProfitMarginQuery,
  useUpdateProfitMarginMutation,
} = settingsSlice;
