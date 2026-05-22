import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const TableSkeleton: React.FC<SkeletonProps> = ({ count = 5 }) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-linear-to-r from-slate-200 to-slate-100 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: count }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
              {[1, 2, 3, 4, 5, 6].map((colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-linear-to-r from-slate-100 to-slate-50 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="h-8 bg-linear-to-r from-slate-200 to-slate-100 rounded animate-pulse mb-4" />
        <div className="h-4 bg-linear-to-r from-slate-100 to-slate-50 rounded animate-pulse mb-3" />
        <div className="h-10 bg-linear-to-r from-slate-200 to-slate-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

interface GridSkeletonProps {
  columns?: number;
  count?: number;
  height?: string;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  columns = 3,
  count = 12,
  height = 'h-32',
}) => {
  const gridColsClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'md:grid-cols-2'
        : columns === 3
          ? 'md:grid-cols-3'
          : columns === 4
            ? 'md:grid-cols-4'
            : columns === 5
              ? 'md:grid-cols-5'
              : 'md:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className={`${height} bg-linear-to-r from-slate-200 to-slate-100 animate-pulse`} />
          <div className="p-4">
            <div className="h-4 bg-linear-to-r from-slate-100 to-slate-50 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TextSkeleton: React.FC<SkeletonProps> = ({ className = '', count = 3 }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
    ))}
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i}>
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/4" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    ))}
    <div className="h-10 bg-primary-200 rounded animate-pulse" />
  </div>
);

interface SkeletonLoaderProps {
  type: 'table' | 'card' | 'grid' | 'text' | 'form';
  count?: number;
  columns?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  count,
  columns,
  className,
}) => {
  switch (type) {
    case 'table':
      return <TableSkeleton count={count} />;
    case 'card':
      return <CardSkeleton count={count} />;
    case 'grid':
      return <GridSkeleton columns={columns} count={count} height={className} />;
    case 'text':
      return <TextSkeleton count={count} className={className} />;
    case 'form':
      return <FormSkeleton />;
    default:
      return null;
  }
};

export default SkeletonLoader;

