"use client";

import UserStatsSection from "@/components/UserStatsSection";
import UserDetailsTable from "@/components/UserDetailsTable";
import { UserStatsSkeletonLoader } from "@/components/SkeletonLoaders";
import { EditUserModal } from "@/components/EditUserModal";
import { CreateUserForm } from "@/components/CreateUserForm";
import { UserDetailDrawer } from "@/components/UserDetailDrawer";
import { motion } from "framer-motion";
import { useUserStats } from "@/hooks/useUserStats";
import { Download, Plus, Users } from "lucide-react";
import Button from "@/components/Button";
import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function AdminUsersPage() {
  const { loading, error, refetch } = useUserStats();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailDrawer(false);
    setShowEditModal(true);
  };

  const handleDeleteUser = () => {
    refetch();
  };

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleEditSuccess = () => {
    refetch();
  };

  const handleExportUsers = async () => {
    try {
      const response = await apiClient.get<{ data: { users: User[] } }>(
        '/admin/users?limit=1000&offset=0'
      );
      const users: User[] = response?.data?.users || [];

      if (users.length === 0) {
        alert('No users to export.');
        return;
      }

      const headers = ['ID', 'Name', 'Email', 'Role', 'Active', 'Email Verified', 'Created At'];
      const rows = users.map((u) => [
        u.id,
        u.name || '',
        u.email,
        u.role,
        u.isActive ? 'Yes' : 'No',
        u.emailVerified ? 'Yes' : 'No',
        new Date(u.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export users. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-primary-900 to-primary-700 rounded-xl p-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-950">User Management</h1>
                <p className="text-gray-600 text-sm mt-1">Manage, view, and administer all user accounts</p>
              </div>
            </div>
            <div className="hidden sm:flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleExportUsers}
                ariaLabel="Export users to CSV"
                className="inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCreateModal(true)}
                ariaLabel="Create new user"
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          {loading ? (
            <UserStatsSkeletonLoader />
          ) : (
            <div>
              <UserStatsSection />
            </div>
          )}
        </motion.div>

        {/* User List Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Users</h2>
              <p className="text-gray-600 text-sm">Search, filter, and manage user accounts</p>
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-800 text-sm font-medium">Error loading users. Please try again.</p>
              </motion.div>
            )}

            <UserDetailsTable onUserUpdate={refetch} />
          </div>
        </motion.div>

        {/* Mobile Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sm:hidden flex gap-3 mt-8 fixed bottom-4 left-4 right-4 z-50"
        >
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportUsers}
            ariaLabel="Export users to CSV"
            className="flex-1 inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            ariaLabel="Create new user"
            className="flex-1 inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </motion.div>
      </div>

      {/* Modals & Drawers */}
      <CreateUserForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={showEditModal}
            user={selectedUser}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />

          <UserDetailDrawer
            isOpen={showDetailDrawer}
            user={selectedUser}
            onClose={() => setShowDetailDrawer(false)}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        </>
      )}
    </main>
  );
}
