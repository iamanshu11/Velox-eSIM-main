import React from 'react';

export interface FilterFieldConfig {
  id: string;
  type: 'search' | 'select' | 'checkbox';
  label?: string;
  placeholder?: string;
  value: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  fields: FilterFieldConfig[];
  onClearAll?: () => void;
  showClearButton?: boolean;
}
export function FilterBar({ fields, onClearAll, showClearButton = true }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className={`grid gap-4 ${
        fields.length === 1 ? 'grid-cols-1' :
        fields.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        fields.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {fields.map((field) => (
          <div key={field.id}>
            {field.label && (
              <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
            )}

            {field.type === 'search' && (
              <input
                type="text"
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            )}

            {field.type === 'select' && (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value === 'true'}
                  onChange={(e) => field.onChange(e.target.checked ? 'true' : 'false')}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            )}
          </div>
        ))}

        {/* Clear Filters Button */}
        {showClearButton && onClearAll && (
          <div className="flex items-end">
            <button
              onClick={onClearAll}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

