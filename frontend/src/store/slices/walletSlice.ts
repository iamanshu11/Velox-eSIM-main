import { apiSlice } from './apiSlice';

export interface Wallet {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  transactionType: 'TOP_UP' | 'ESIM_PURCHASE' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  failureReason?: string;
  createdAt: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  status: string;
}

export interface TopUpConfirmResponse {
  balance: number;
  amount: number;
  currency: string;
}

export const walletSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWalletBalance: builder.query<Wallet, void>({
      query: () => '/wallet/balance',
      transformResponse: (response: any) => {
        if (response?.data && typeof response.data === 'object') {
          return response.data;
        }
        if (response?.balance !== undefined) {
          return response;
        }
        return { balance: 0, currency: 'USD' };
      },
      providesTags: ['Wallet'],
    }),

    getTransactionHistory: builder.query<
      TransactionHistoryResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) =>
        `/wallet/transactions?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => {
        if (response?.data) {
          return response.data;
        }
        return response ?? { transactions: [], pagination: {} };
      },
      providesTags: ['Wallet'],
    }),

    initiateTopUp: builder.mutation<PaymentIntent, number>({
      query: (amount) => ({
        url: '/wallet/top-up/initiate',
        method: 'POST',
        body: { amount },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Wallet'],
    }),

    confirmTopUp: builder.mutation<TopUpConfirmResponse, string>({
      query: (paymentIntentId) => ({
        url: '/wallet/top-up/confirm',
        method: 'POST',
        body: { paymentIntentId },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Wallet'],
    }),
  }),
});

export const {
  useGetWalletBalanceQuery,
  useGetTransactionHistoryQuery,
  useInitiateTopUpMutation,
  useConfirmTopUpMutation,
} = walletSlice;

export default walletSlice;
