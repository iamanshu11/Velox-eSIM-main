import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";
import type { Order, ApiResponse, PaginatedResponse } from "@/types";

export const orderService = {
  createOrder: async (data: {
    items: { planId: string; quantity: number }[];
    shippingAddress?: string;
    billingAddress?: string;
  }): Promise<Order> => {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        "/orders",
        data,
      );
      logger.debug("[OrderService] Order created successfully");
      return (response as any).data?.data ?? ({} as Order);
    } catch (error) {
      logger.error("[OrderService] createOrder error", error);
      throw error;
    }
  },

  getOrderById: async (id: string): Promise<Order> => {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
      return (response as any).data?.data ?? ({} as Order);
    } catch (error) {
      logger.error("[OrderService] getOrderById error", error);
      throw error;
    }
  },

  getUserOrders: async (
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Order>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>(
        `/orders/user/my-orders?page=${page}&limit=${limit}`,
      );
      return response;
    } catch (error) {
      logger.error("[OrderService] getUserOrders error", error);
      throw error;
    }
  },

  getAllOrders: async (
    page: number = 1,
    limit: number = 10,
    filters?: { status?: string },
  ): Promise<PaginatedResponse<Order>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filters?.status) params.append("status", filters.status);

      const response = await apiClient.get<PaginatedResponse<Order>>(
        `/orders?${params.toString()}`,
      );
      return response;
    } catch (error) {
      logger.error("[OrderService] getAllOrders error", error);
      throw error;
    }
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    try {
      const response = await apiClient.patch<ApiResponse<Order>>(
        `/orders/${id}/status`,
        { status },
      );
      logger.debug("[OrderService] Order status updated successfully");
      return (response as any).data?.data ?? ({} as Order);
    } catch (error) {
      logger.error("[OrderService] updateOrderStatus error", error);
      throw error;
    }
  },

  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        `/orders/${id}/cancel`,
        { reason },
      );
      logger.debug("[OrderService] Order cancelled successfully");
      return (response as any).data?.data ?? ({} as Order);
    } catch (error) {
      logger.error("[OrderService] cancelOrder error", error);
      throw error;
    }
  },
};

export default orderService;
