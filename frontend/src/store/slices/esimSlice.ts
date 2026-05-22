import type {
  DashboardSummary,
  DataPackage,
  ESimProfile,
  Location,
  Order
} from '@/types';
import { apiSlice } from './apiSlice';

export const esimSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    validateCredentials: builder.query<boolean, void>({
      query: () => '/esims/validate-credentials',
      transformResponse: (response: any) => response.data ?? false,
    }),

    getBalance: builder.query<number, void>({
      query: () => '/esims/balance',
      transformResponse: (response: any) => response.data ?? 0,
      providesTags: ['eSIM'],
    }),

    getDashboardAccount: builder.query<any, void>({
      query: () => '/esims/dashboard/account',
      transformResponse: (response: any) => response.data,
      providesTags: ['eSIM'],
      keepUnusedDataFor: 600,
    }),

    getCountries: builder.query<Location[], void>({
      query: () => '/esims/countries',
      transformResponse: (response: any) => response.data ?? [],
      keepUnusedDataFor: 300,
    }),

    getCountriesAutocomplete: builder.query<Location[], void>({
      query: () => '/esims/countries/autocomplete',
      transformResponse: (response: any) => response.data ?? [],
      keepUnusedDataFor: 300,
    }),

    getPopularPackages: builder.query<any[], void>({
      query: () => '/esims/popular?limit=12',
      transformResponse: (response: any) => {
        const packages = response.data ?? [];
        return packages.map((pkg: any) => ({
          ...pkg,
          volumeGB: pkg.volume ? Math.round((pkg.volume / (1024 * 1024 * 1024)) * 100) / 100 : 0,
        }));
      },
      keepUnusedDataFor: 300,
    }),

    getGlobalPackages: builder.query<any[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const [gl139Res, gl120Res] = await Promise.all([
          fetchWithBQ('/esims/packages?locationCode=GL-139&limit=20'),
          fetchWithBQ('/esims/packages?locationCode=GL-120&limit=20'),
        ]);

        if (gl139Res.error && gl120Res.error) {
          return { error: gl139Res.error || gl120Res.error };
        }

        const packages139 = Array.isArray((gl139Res.data as any)?.data?.packages)
          ? (gl139Res.data as any).data.packages
          : [];
        const packages120 = Array.isArray((gl120Res.data as any)?.data?.packages)
          ? (gl120Res.data as any).data.packages
          : [];

        const merged = [...packages139, ...packages120];
        
        const uniquePackages: DataPackage[] = Array.from(
          new Map(merged.map((pkg: any) => {
          const volumeInGB = pkg.volume ? Math.round((pkg.volume / (1024 * 1024 * 1024)) * 100) / 100 : 0;
            return [pkg.packageCode, {
              ...pkg,
              volumeGB: volumeInGB,
            }];
          })).values(),
        );

        return { data: uniquePackages };
      },
      keepUnusedDataFor: 300,
    }),

    getRegionalPackages: builder.query<Record<string, any[]>, void>({
      query: () => '/esims/by-region?limit=100',
      transformResponse: (response: any) => {
        const data = response.data ?? {};
        const converted: Record<string, any[]> = {};
        for (const region in data) {
          converted[region] = Array.isArray(data[region]) 
            ? data[region].map((pkg: any) => ({
                ...pkg,
                volumeGB: pkg.volume ? Math.round((pkg.volume / (1024 * 1024 * 1024)) * 100) / 100 : 0,
              }))
            : [];
        }
        return converted;
      },
      keepUnusedDataFor: 300,
    }),

    getPackages: builder.query<DataPackage[], void>({
      query: () => '/esims/packages',
      transformResponse: (response: any) => {
        const packages = response.data?.packages ?? [];
        return packages.map((pkg: any) => ({
          ...pkg,
          volumeGB: pkg.volume ? Math.round((pkg.volume / (1024 * 1024 * 1024)) * 100) / 100 : 0,
        }));
      },
      keepUnusedDataFor: 300,
    }),

    getESIMAccessOrders: builder.query<
      { esimList: ESimProfile[]; total: number },
      { page?: number; pageSize?: number }
    >({
      query: ({ page = 1, pageSize = 20 }) =>
        `/esims/esimaccess/orders?page=${page}&pageSize=${pageSize}`,
      transformResponse: (response: any) => ({
        esimList: response.data?.esimList ?? [],
        total: response.data?.esimList?.length ?? 0,
      }),
      providesTags: ['eSIM'],
    }),

    getAllProfiles: builder.query<
      { esimList: ESimProfile[]; total: number },
      { pageSize?: number }
    >({
      query: ({ pageSize = 50 }) =>
        `/esims/dashboard/profiles?pageSize=${pageSize}`,
      transformResponse: (response: any) => ({
        esimList: response.data?.esimList ?? [],
        total: response.data?.esimList?.length ?? 0,
      }),
      providesTags: ['eSIM'],
    }),

    getProfileByOrderNo: builder.query<ESimProfile[], string>({
      query: (orderNo) => `/esims/profiles/${orderNo}`,
      transformResponse: (response: any) => response.data ?? [],
      providesTags: ['eSIM'],
    }),

    getUserMyESIMs: builder.query<
      { esims: Order[]; pagination: any },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 12 }) =>
        `/esims/my-esims?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        return {
          esims: data?.orders ?? data?.esims ?? [],
          pagination: data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 },
        };
      },
      providesTags: ['eSIM'],
    }),

    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/esims/dashboard/summary',
      transformResponse: (response: any) => response.data,
      providesTags: ['eSIM'],
    }),

    cancelUserESIM: builder.mutation<{ message: string; data: any }, string>({
      query: (esimTranNo) => ({
        url: `/esims/${esimTranNo}/cancel-self`,
        method: 'POST',
      }),
      invalidatesTags: ['eSIM'],
    }),
  }),
});

export const {
  useValidateCredentialsQuery,
  useGetBalanceQuery,
  useGetDashboardAccountQuery,
  useGetCountriesQuery,
  useGetCountriesAutocompleteQuery,
  useGetPopularPackagesQuery,
  useGetGlobalPackagesQuery,
  useGetRegionalPackagesQuery,
  useGetPackagesQuery,
  useGetESIMAccessOrdersQuery,
  useGetAllProfilesQuery,
  useGetProfileByOrderNoQuery,
  useGetUserMyESIMsQuery,
  useGetDashboardSummaryQuery,
  useCancelUserESIMMutation,
} = esimSlice;
