export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-56 animate-pulse rounded-xl bg-gray-200" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 border-b border-gray-200 pb-6">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
