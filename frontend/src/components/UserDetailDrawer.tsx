"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Calendar, Badge, Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/Button";
import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";
import { useState } from "react";
import { formatDate } from "@/utils/formatters";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDetailDrawerProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function UserDetailDrawer({
  isOpen,
  user,
  onClose,
  onEdit,
  onDelete,
}: UserDetailDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm(`Are you sure you want to delete ${user.email}?`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiClient.delete<any>(`/admin/users/${user.id}`);
      logger.info(`User ${user.email} deleted successfully`);
      onDelete?.(user.id);
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete user";
      setDeleteError(message);
      logger.error("Failed to delete user", err);
    } finally {
      setIsDeleting(false);
    }
  };



  return (
    <AnimatePresence>
      {isOpen && user && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-auto"
          >
            {/* Header */}
            <div className="bg-linear-to-br from-primary-900 to-primary-700 p-6 flex justify-between items-start sticky top-0 z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-primary-100 text-sm mt-1">{user.email}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-primary-900 rounded-full p-2 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Alert */}
              {deleteError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{deleteError}</p>
                </motion.div>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {user.isActive ? "Active" : "Inactive"}
                </div>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    user.emailVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  {user.emailVerified ? "Verified" : "Pending"}
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-2">
                  <Badge className="w-4 h-4" />
                  {user.role}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Email Address
                  </p>
                  <p className="text-sm text-gray-900 font-mono">{user.email}</p>
                </div>

                {/* Full Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Full Name
                  </p>
                  <p className="text-sm text-gray-900">{user.name}</p>
                </div>

                {/* Role */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    User Role
                  </p>
                  <p className="text-sm text-gray-900 capitalize">{user.role}</p>
                </div>

                {/* Created Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Calendar className="inline-block w-3 h-3 mr-1" />
                    Created On
                  </p>
                  <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                </div>

                {/* Last Updated */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
                </div>

                {/* Account Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Account Status
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Active Account</span>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          user.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Email Verified</span>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          user.emailVerified ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onEdit?.(user)}
                  className="w-full inline-flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit User
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete User"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

