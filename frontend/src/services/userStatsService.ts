import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";
import { BackendApiResponse } from "@/types/api";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  roleDistribution: Array<{
    role: string;
    count: number;
  }>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersPaginatedResponse {
  users: User[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

export const userStatsService = {
async getUserStats(): Promise<UserStats | null> {
    try {
      const response = await apiClient.get<BackendApiResponse<UserStats>>("/admin/users/stats");
      return response.data ?? null;
    } catch (error) {
      logger.error("Failed to fetch user stats", error);
      return null;
    }
  },
async getUsers(params: {
    limit?: number;
    offset?: number;
    search?: string;
    role?: string;
    sort?: string;
    order?: "asc" | "desc";
  }): Promise<UsersPaginatedResponse | null> {
    try {
      const queryParams = new URLSearchParams();

      if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
      if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
      if (params.search) queryParams.append("search", params.search);
      if (params.role) queryParams.append("role", params.role);
      if (params.sort) queryParams.append("sort", params.sort);
      if (params.order) queryParams.append("order", params.order);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/admin/users?${queryString}` : `/admin/users`;

      const response = await apiClient.get<BackendApiResponse<UsersPaginatedResponse>>(endpoint);
      const payload = response.data;

      if (payload?.users && payload.pagination) {
        return {
          users: payload.users,
          pagination: {
            total: payload.pagination.total,
            limit: payload.pagination.limit,
            offset: payload.pagination.offset,
            pages: payload.pagination.pages,
          },
        };
      }
      return null;
    } catch (error) {
      logger.error("Failed to fetch users", error);
      return null;
    }
  },
async getActiveUsersCount(): Promise<number> {
    const stats = await this.getUserStats();
    return stats?.activeUsers ?? 0;
  },
async getTotalUsersCount(): Promise<number> {
    const stats = await this.getUserStats();
    return stats?.totalUsers ?? 0;
  },
async getNewUsersCount(): Promise<number> {
    const stats = await this.getUserStats();
    return stats?.newUsers ?? 0;
  },
};
