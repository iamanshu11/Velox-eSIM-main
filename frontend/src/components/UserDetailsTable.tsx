"use client";

import { useUsers } from "@/hooks/useUserStats";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, Trash2, Lock, Unlock, Mail, ArrowRight } from "lucide-react";
import SendEmailModal from "@/components/SendEmailModal";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";

interface UserDetailsTableProps {
  initialLimit?: number;
  showHeader?: boolean;
  compact?: boolean;
  onUserUpdate?: () => void;
}

type SortField = "email" | "createdAt" | "role" | "isActive";
type SortOrder = "asc" | "desc";

export default function UserDetailsTable({
  initialLimit = 10,
  showHeader = true,
  compact = false,
  onUserUpdate,
}: UserDetailsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);

  const offset = currentPage * initialLimit;

  const { data, loading, error, refetch } = useUsers({
    limit: initialLimit,
    offset,
    search: searchTerm || undefined,
    role: roleFilter || undefined,
    sort: sortField,
    order: sortOrder,
  });

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(0);
  }, [sortField, sortOrder]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  }, []);

  const handleRoleFilter = useCallback((value: string) => {
    setRoleFilter(value);
    setCurrentPage(0);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!data?.users) return;
    
    if (selectedUsers.size === data.users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(data.users.map(u => u.id)));
    }
  }, [data?.users, selectedUsers]);

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const handleRowClick = useCallback((userId: string) => {
    router.push(`/admin/users/${userId}`);
  }, [router]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Delete ${selectedUsers.size} user(s)? This will deactivate their accounts.`)) {
      return;
    }

    setBulkLoading(true);
    try {
      await apiClient.post<any>("/admin/users/bulk/delete", {
        userIds: Array.from(selectedUsers),
      });

      logger.info(`Bulk deleted ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      refetch();
      onUserUpdate?.();
    } catch (err: any) {
      logger.error("Failed to bulk delete users", err);
      alert("Failed to delete users. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedUsers, refetch, onUserUpdate]);

  const handleBulkStatusChange = useCallback(async (newStatus: boolean) => {
    if (selectedUsers.size === 0) return;

    setBulkLoading(true);
    try {
      await apiClient.post<any>("/admin/users/bulk/update", {
        userIds: Array.from(selectedUsers),
        updates: { isActive: newStatus },
      });

      logger.info(`Bulk updated ${selectedUsers.size} users to ${newStatus ? 'active' : 'inactive'}`);
      setSelectedUsers(new Set());
      refetch();
      onUserUpdate?.();
    } catch (err: any) {
      logger.error("Failed to bulk update users", err);
      alert("Failed to update users. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedUsers, refetch, onUserUpdate]);

  const roleOptions = useMemo(() => {
    if (!data?.users) return ["CUSTOMER", "ADMIN"];
    const roles = new Set(data.users.map(u => u.role));
    return Array.from(roles);
  }, [data?.users]);

  const totalPages = data?.pagination?.pages || 1;
  const isLastPage = currentPage >= totalPages - 1;
  const isFirstPage = currentPage === 0;
  const allSelected = data?.users && data.users.length > 0 && selectedUsers.size === data.users.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return (
      <ArrowUpDown
        className={`w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""}`}
      />
    );
  };

  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-4" /></td>
      {[...Array(compact ? 3 : 5)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  );

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      {showHeader && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <p className="text-gray-600 mt-1">
            Total: {data?.pagination?.total || 0} users
          </p>
        </div>
      )}

      {/* Bulk Actions Toolbar - Fixed Height to Prevent Layout Shift */}
      <div className="h-16">
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between h-full"
          >
            <p className="text-sm font-medium text-primary-900">
              {selectedUsers.size} user(s) selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSendEmail(true)}
                disabled={bulkLoading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button
                onClick={() => handleBulkStatusChange(true)}
              disabled={bulkLoading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Unlock className="w-4 h-4" />
              Activate
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              disabled={bulkLoading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lock className="w-4 h-4" />
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-12">
                  <input
                    type="checkbox"
                    disabled
                    checked={false}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Role
                </th>
                {!compact && (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Verified
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>Error loading users: {error}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
            >
              Retry
            </button>
          </div>
        ) : data?.users && data.users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No users found matching your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-12">
                  <input
                    type="checkbox"
                    checked={Boolean(allSelected)}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-700 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort("email")}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center gap-2">
                    Email
                    <SortIcon field="email" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("role")}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Role
                    <SortIcon field="role" />
                  </div>
                </th>
                {!compact && (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Verified
                    </th>
                  </>
                )}
                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Joined
                    <SortIcon field="createdAt" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.users?.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${selectedUsers.has(user.id) ? 'bg-primary-50' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleSelectUser(user.id);
                        }}
                        onClick={(event) => event.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-primary-700 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.email}
                      </p>
                      {user.name && (
                        <p className="text-xs text-gray-500">{user.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-primary-100 text-primary-900"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  {!compact && (
                    <>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.emailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {user.emailVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                    <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRowClick(user.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer"
                      aria-label={`View details for ${user.email}`}
                    >
                      View
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && !loading && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages} •{" "}
            {data.pagination.total} total users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={isFirstPage}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={isLastPage}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>

    {showSendEmail && (
      <SendEmailModal
        userIds={Array.from(selectedUsers)}
        onClose={() => setShowSendEmail(false)}
      />
    )}
    </>
  );
}

