"use client";

interface DataUsageChartProps {
  used: number;
  total: number;
  unit?: string;
}

export default function DataUsageChart({
  used,
  total,
  unit = "GB",
}: DataUsageChartProps) {
  const percentage = total === 0 ? 0 : Math.round((used / total) * 100);
  const remaining = total - used;
  const getColor = () => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-primary-600";
  };

  const getStatusColor = () => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 50) return "text-orange-600";
    return "text-primary-700";
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-semibold text-gray-900">
            Data Usage Progress
          </label>
          <span className={`text-lg font-bold ${getStatusColor()}`}>
            {percentage}%
          </span>
        </div>
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-sm">
          <div
            className={`h-full ${getColor()} transition-all duration-300 rounded-full`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
            Used
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {used.toFixed(2)}
            <span className="text-sm ml-1">{unit}</span>
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">
            Total
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {total.toFixed(2)}
            <span className="text-sm ml-1">{unit}</span>
          </p>
        </div>

        <div className="bg-primary-50 p-3 rounded-lg">
          <p className="text-xs text-primary-700 uppercase font-semibold tracking-wide">
            Remaining
          </p>
          <p className="text-lg font-bold text-primary-800 mt-1">
            {Math.max(remaining, 0).toFixed(2)}
            <span className="text-sm ml-1">{unit}</span>
          </p>
        </div>
      </div>

      {/* Status Message */}
      {percentage >= 90 && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> You have used {percentage}% of your data plan.
            Consider adding more data soon.
          </p>
        </div>
      )}

      {percentage >= 70 && percentage < 90 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            You have used {percentage}% of your data plan.
          </p>
        </div>
      )}
    </div>
  );
}

