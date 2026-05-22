"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useToast } from "@/components/ToastProvider";
import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    role: user?.role || "CUSTOMER",
    isActive: user?.isActive ?? true,
    emailVerified: user?.emailVerified ?? false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        await apiClient.put<any>(`/admin/users/${user.id}`, formData);

        addToast("User updated successfully", "success");
        logger.info("User updated successfully");

        setTimeout(() => {
          onSuccess();
          onClose();
          setFormData({
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
          });
        }, 500);
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to update user";
        setError(message);
        addToast(message, "error");
        logger.error("Failed to update user", err);
      } finally {
        setLoading(false);
      }
    },
    [user, formData, onClose, onSuccess, addToast]
  );

  return (
    <AnimatePresence>
      {isOpen && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-br from-primary-900 to-primary-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                <p className="text-primary-100 text-sm mt-1">{user.email}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-primary-900 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter user name"
                  disabled={loading}
                />
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleChange("isActive", e.target.checked)
                    }
                    disabled={loading}
                    className="w-5 h-5 rounded border-gray-300 text-primary-700 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>

              {/* Email Verified */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.emailVerified}
                    onChange={(e) =>
                      handleChange("emailVerified", e.target.checked)
                    }
                    disabled={loading}
                    className="w-5 h-5 rounded border-gray-300 text-primary-700 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Email Verified
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

