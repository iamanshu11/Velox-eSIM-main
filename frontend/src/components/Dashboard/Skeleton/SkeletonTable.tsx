import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 6 }: SkeletonTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="border-b border-gray-200 px-8 py-6 bg-gray-50">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-8 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="animate-pulse">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-8 py-4">
                    <div
                      className={`bg-gray-200 rounded animate-pulse ${
                        colIdx === 0 ? 'w-24 h-4' : colIdx === columns - 1 ? 'w-16 h-8' : 'w-20 h-4'
                      }`}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
