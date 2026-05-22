import { apiClient } from "@/lib/apiClient";
import type {
  ApiResponse,
  Location,
  DataPackage,
  ESimProfile,
  DashboardSummary,
  AccountInfo,
} from "@/types";

export const esimAccessApi = {

  validateCredentials: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<ApiResponse<boolean>>(
        "/esims/validate-credentials"
      );
      return response?.data ?? false;
    } catch (error) {
      return false;
    }
  },


  getBalance: async (): Promise<number> => {
    try {
      const response = await apiClient.get<ApiResponse<number>>("/esims/balance");
      return response?.data ?? 0;
    } catch (error) {
      return 0;
    }
  },

  getDashboardAccount: async (): Promise<{
    balance: number;
    accountInfo: AccountInfo;
  }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ balance: number; accountInfo: AccountInfo }>
      >("/esims/dashboard/account");
      return response?.data ?? { balance: 0, accountInfo: {} as AccountInfo };
    } catch (error) {
      return { balance: 0, accountInfo: {} as AccountInfo };
    }
  },


  getCountries: async (): Promise<Location[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Location[]>>(
        "/esims/countries"
      );
      return response?.data ?? [];
    } catch (error) {
      return [];
    }
  },

  getPackages: async (): Promise<DataPackage[]> => {
    try {
      const response = await apiClient.get<ApiResponse<DataPackage[]>>(
        "/esims/packages"
      );
      return response?.data ?? [];
    } catch (error) {
      return [];
    }
  },

  purchase: async (payload: { amount: number; packageInfoList: Array<{ packageCode: string; count: number; price?: number }> }) => {
    try {
      const response = await apiClient.post<any>(`/esims/purchase`, payload);
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },

  createOrderAdmin: async (payload: { amount?: number; packageInfoList: Array<{ packageCode: string; count: number; price?: number }> }) => {
    try {
      const response = await apiClient.post<any>(`/esims/order`, payload);
      return response?.data ?? response;
    } catch (error) {
      throw error;
    }
  },


  getESIMAccessOrders: async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ esimList: ESimProfile[]; total: number }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ esimList: ESimProfile[] }>
      >(`/esims/esimaccess/orders?page=${page}&pageSize=${pageSize}`);
      const data = response?.data;
      return {
        esimList: data?.esimList ?? [],
        total: data?.esimList?.length ?? 0,
      };
    } catch (error) {
      return { esimList: [], total: 0 };
    }
  },

  getAllProfiles: async (
    pageSize: number = 50
  ): Promise<{ esimList: ESimProfile[]; total: number }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{ esimList: ESimProfile[] }>
      >(`/esims/dashboard/profiles?pageSize=${pageSize}`);
      const data = response?.data;
      return {
        esimList: data?.esimList ?? [],
        total: data?.esimList?.length ?? 0,
      };
    } catch (error) {
      return { esimList: [], total: 0 };
    }
  },

  getProfileByOrderNo: async (orderNo: string): Promise<ESimProfile[]> => {
    try {
      const response = await apiClient.get<ApiResponse<ESimProfile[]>>(
        `/esims/profiles/${orderNo}`
      );
      return response?.data ?? [];
    } catch (error) {
      return [];
    }
  },


  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      const response = await apiClient.get<ApiResponse<DashboardSummary>>(
        "/esims/dashboard/summary"
      );
      return response?.data ?? {
        balance: 0,
        recentOrders: [],
        countriesCount: 0,
      };
    } catch (error) {
      return {
        balance: 0,
        recentOrders: [],
        countriesCount: 0,
      };
    }
  },
};
