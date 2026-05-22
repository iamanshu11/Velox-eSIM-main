"use client";

import { useUserStats } from "@/hooks/useUserStats";
import StatCard from "@/components/StatCard";
import { Users, UserCheck, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface UserStatsSectionProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export default function UserStatsSection({
  title = "User Statistics",
  subtitle = "Overview of your user base",
  compact = false,
}: UserStatsSectionProps) {
  const { stats, loading } = useUserStats();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      {!compact && (
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle="All registered users"
          icon={Users}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          subtitle="Currently active accounts"
          icon={UserCheck}
          color="green"
          loading={loading}
        />
        <StatCard
          title="New Users (30d)"
          value={stats?.newUsers || 0}
          subtitle="Users in last month"
          icon={UserPlus}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Role Distribution (if available) */}
      {stats?.roleDistribution && stats.roleDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-black text-gray-950 mb-4">
            Users by Role
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.roleDistribution.map((role) => (
              <div
                key={role.role}
                className="p-4 bg-linear-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-600 capitalize">
                  {role.role}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {role.count}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
