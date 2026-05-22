import { apiSlice } from './apiSlice';

export interface Credentials {
  accessCode: string;
  secretKey: string;
  isConfigured: boolean;
}

export interface CredentialsPayload {
  accessCode: string;
  secretKey: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const credentialsSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCredentialsStatus: builder.query<Credentials, void>({
      query: () => '/admin/credentials/status',
      transformResponse: (response: ApiResponse<Credentials>) => response.data,
      providesTags: ['Auth'],
      keepUnusedDataFor: 600,
    }),

    setCredentials: builder.mutation<Credentials, CredentialsPayload>({
      query: (data) => ({
        url: '/admin/credentials',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Credentials>) => response.data,
      invalidatesTags: ['Auth'],
    }),

    verifyCredentials: builder.mutation<{ valid: boolean }, void>({
      query: () => ({
        url: '/admin/credentials/verify',
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<{ valid: boolean }>) => response.data,
    }),
  }),
});

export const {
  useGetCredentialsStatusQuery,
  useSetCredentialsMutation,
  useVerifyCredentialsMutation,
} = credentialsSlice;
