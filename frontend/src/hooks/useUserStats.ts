"use client";

import { useEffect, useState } from "react";
import { userStatsService, UserStats, UsersPaginatedResponse } from "@/services/userStatsService";

export interface UseUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseUsersReturn {
  data: UsersPaginatedResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
export function useUserStats(): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userStatsService.getUserStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
export function useUsers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
  sort?: string;
  order?: "asc" | "desc";
}): UseUsersReturn {
  const [data, setData] = useState<UsersPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await userStatsService.getUsers(params || {});
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [params?.search, params?.role, params?.offset, params?.sort, params?.order]);

  return {
    data,
    loading,
    error,
    refetch: fetchUsers,
  };
}
