"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { X, AlertCircle, Eye, EyeOff } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useToast } from "@/components/ToastProvider";
import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserForm({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserFormProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    []
  );

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    if (!formData.password) {
      return "Password is required";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await apiClient.post<any>("/admin/users", {
          email: formData.email,
          name: formData.name || formData.email.split("@")[0],
          password: formData.password,
          role: formData.role,
        });

        addToast("User created successfully", "success");
        logger.info("User created successfully");

        setTimeout(() => {
          onSuccess();
          onClose();
          setFormData({
            email: "",
            name: "",
            password: "",
            confirmPassword: "",
            role: "CUSTOMER",
          });
        }, 500);
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to create user";
        setError(message);
        addToast(message, "error");
        logger.error("Failed to create user", err);
      } finally {
        setLoading(false);
      }
    },
    [formData, onClose, onSuccess, addToast]
  );

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      role: "CUSTOMER",
    });
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetForm}
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
            <div className="bg-linear-to-br from-green-600 to-green-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Create User</h2>
                <p className="text-green-100 text-sm mt-1">
                  Add a new user to your system
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-white hover:bg-green-800 rounded-full p-2 transition-colors"
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

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading}
                />
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter full name"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Min 8 characters"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder="Re-enter password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={resetForm}
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
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
