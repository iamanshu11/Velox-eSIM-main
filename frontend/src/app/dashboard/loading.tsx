import { GridSkeleton, CardSkeleton } from "@/components/SkeletonLoader";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome Section Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-100 p-8 lg:p-12 border border-gray-200">
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>

      {/* Stats Grid Skeleton - 4 columns */}
      <GridSkeleton columns={4} count={4} height="h-32" />

      {/* Quick Actions Grid Skeleton - 4 columns */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
        <GridSkeleton columns={4} count={4} height="h-20" />
      </div>

      {/* Recent Activity Skeleton */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
        <CardSkeleton count={6} />
      </div>
    </div>
  );
}
