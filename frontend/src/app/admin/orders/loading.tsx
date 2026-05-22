import Container from "@/components/Container";
import Card from "@/components/Card";
import { CardSkeleton } from "@/components/SkeletonLoader";

export default function AdminOrdersLoading() {
  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Stats Cards Skeleton - 5 columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="overflow-hidden">
          <div className="p-6">
            <CardSkeleton count={10} />
          </div>
        </Card>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
