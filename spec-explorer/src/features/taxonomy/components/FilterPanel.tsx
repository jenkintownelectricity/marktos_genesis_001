import { TaxonomyFilters } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOptions {
  ratings: string[];
  temperatures: number[];
  thicknesses: number[];
  exposures: string[];
}

interface FilterPanelProps {
  options: FilterOptions;
  selected: TaxonomyFilters;
  onChange: (filters: TaxonomyFilters) => void;
  onClear: () => void;
}

export function FilterPanel({ options, selected, onChange, onClear }: FilterPanelProps) {
  const hasFilters =
    (selected.ratings?.length || 0) > 0 ||
    (selected.temperatures?.length || 0) > 0 ||
    (selected.thicknesses?.length || 0) > 0 ||
    (selected.exposures?.length || 0) > 0;

  const toggleFilter = <T extends string | number>(
    key: keyof TaxonomyFilters,
    value: T,
    current: T[] | undefined
  ) => {
    const arr = current || [];
    const newArr = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onChange({ [key]: newArr.length > 0 ? newArr : undefined });
  };

  return (
    <div className="w-64 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Fire Ratings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Fire Rating</h4>
        <div className="flex flex-wrap gap-2">
          {options.ratings.map((rating) => (
            <button
              key={rating}
              onClick={() => toggleFilter('ratings', rating, selected.ratings)}
              className={`rating-badge rating-${rating} cursor-pointer
                         ${selected.ratings?.includes(rating) ? 'ring-2 ring-offset-1 ring-primary-500' : ''}`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* Temperatures */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Critical Temp (C)</h4>
        <div className="flex flex-wrap gap-2">
          {options.temperatures.map((temp) => (
            <button
              key={temp}
              onClick={() => toggleFilter('temperatures', temp, selected.temperatures)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors
                         ${selected.temperatures?.includes(temp)
                           ? 'bg-primary-100 border-primary-500 text-primary-700'
                           : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {temp}
            </button>
          ))}
        </div>
      </div>

      {/* Thicknesses */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Thickness (mm)</h4>
        <div className="flex flex-wrap gap-2">
          {options.thicknesses.map((thickness) => (
            <button
              key={thickness}
              onClick={() => toggleFilter('thicknesses', thickness, selected.thicknesses)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors
                         ${selected.thicknesses?.includes(thickness)
                           ? 'bg-primary-100 border-primary-500 text-primary-700'
                           : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {thickness}
            </button>
          ))}
        </div>
      </div>

      {/* Exposures */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Exposure</h4>
        <div className="flex flex-wrap gap-2">
          {options.exposures.map((exposure) => (
            <button
              key={exposure}
              onClick={() => toggleFilter('exposures', exposure, selected.exposures)}
              className={`px-3 py-1 text-xs rounded-md border transition-colors
                         ${selected.exposures?.includes(exposure)
                           ? 'bg-primary-100 border-primary-500 text-primary-700'
                           : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {exposure === '3S' ? '3-Sided' : '4-Sided'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasFilters && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Active</h4>
          <div className="flex flex-wrap gap-1">
            {selected.ratings?.map((r) => (
              <span
                key={r}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100"
              >
                {r}
                <XMarkIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => toggleFilter('ratings', r, selected.ratings)}
                />
              </span>
            ))}
            {selected.temperatures?.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100"
              >
                {t}C
                <XMarkIcon
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => toggleFilter('temperatures', t, selected.temperatures)}
                />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
