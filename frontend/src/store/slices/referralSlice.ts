import { apiSlice } from './apiSlice';
import type { ReferralCode, ReferralUsage, ReferralStats, CreateReferralCodeInput } from '@/services/referralService';
import type { PaginatedResponse } from '@/types';

export const referralSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyReferralCodes: builder.query<
      PaginatedResponse<ReferralCode>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/wallet/referral/my-codes?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Referral'],
    }),

    getReferralStats: builder.query<ReferralStats, void>({
      query: () => '/wallet/referral/stats',
      transformResponse: (response: any) => response.data,
      providesTags: ['Referral'],
    }),

    getReferralCodeByCode: builder.query<ReferralCode, string>({
      query: (code) => `/wallet/referral/code/${code}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Referral'],
    }),

    getReferralCodeUsages: builder.query<
      PaginatedResponse<ReferralUsage>,
      { codeId: string; page?: number; limit?: number }
    >({
      query: ({ codeId, page = 1, limit = 10 }) =>
        `/wallet/referral/code/${codeId}/usages?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Referral'],
    }),

    createReferralCode: builder.mutation<ReferralCode, CreateReferralCodeInput>({
      query: (data) => ({
        url: '/wallet/referral/create-code',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Referral'],
    }),

    useReferralCode: builder.mutation<ReferralUsage, string>({
      query: (code) => ({
        url: '/wallet/referral/use-code',
        method: 'POST',
        body: { code },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Referral'],
    }),

    deactivateReferralCode: builder.mutation<ReferralCode, string>({
      query: (codeId) => ({
        url: `/wallet/referral/code/${codeId}/deactivate`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Referral'],
    }),

    reactivateReferralCode: builder.mutation<ReferralCode, string>({
      query: (codeId) => ({
        url: `/wallet/referral/code/${codeId}/reactivate`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Referral'],
    }),
  }),
});

export const {
  useGetMyReferralCodesQuery,
  useGetReferralStatsQuery,
  useGetReferralCodeByCodeQuery,
  useGetReferralCodeUsagesQuery,
  useCreateReferralCodeMutation,
  useUseReferralCodeMutation,
  useDeactivateReferralCodeMutation,
  useReactivateReferralCodeMutation,
} = referralSlice;

export default referralSlice;
