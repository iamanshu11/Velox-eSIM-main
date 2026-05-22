import { CardSkeleton } from "@/components/SkeletonLoader";

export default function ESIMsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />

      {/* Stats Cards Skeleton - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <CardSkeleton count={10} />
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
