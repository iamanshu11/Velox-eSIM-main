import { GridSkeleton, CardSkeleton } from "@/components/SkeletonLoader";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-10 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      </div>

      {/* Stats Cards Skeleton - 4 columns */}
      <GridSkeleton columns={4} count={4} height="h-32" />

      {/* eSIM Data Skeleton */}
      <div className="space-y-6">
        {/* Account Info Skeleton */}
        <GridSkeleton columns={3} count={3} height="h-24" />

        {/* Profiles Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
          <CardSkeleton count={5} />
        </div>

        {/* Locations Grid Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
          <GridSkeleton columns={3} count={6} height="h-20" />
        </div>
      </div>

      {/* Recent Orders Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
        <CardSkeleton count={5} />
      </div>
    </div>
  );
}
