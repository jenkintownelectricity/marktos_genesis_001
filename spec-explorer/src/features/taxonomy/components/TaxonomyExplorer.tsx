import { useState, useMemo } from 'react';
import { useDataContext } from '@/app/providers/DataProvider';
import { FilterPanel } from './FilterPanel';
import { SearchBar } from './SearchBar';
import { DataGrid } from './DataGrid';
import { DetailView } from './DetailView';
import { DNASequence, TaxonomyFile } from '@/types';
import { Modal } from '@/shared/components/Modal';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export function TaxonomyExplorer() {
  const {
    sources,
    filteredSequences,
    filters,
    setFilters,
    clearFilters,
    importTaxonomy,
    isLoading,
  } = useDataContext();

  const [selectedSequence, setSelectedSequence] = useState<DNASequence | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // Extract unique filter values from sequences
  const filterOptions = useMemo(() => {
    const ratings = new Set<string>();
    const temperatures = new Set<number>();
    const thicknesses = new Set<number>();
    const exposures = new Set<string>();

    filteredSequences.forEach((seq) => {
      if (seq.data.rating) ratings.add(seq.data.rating);
      if (seq.data.crit_temp_C) temperatures.add(seq.data.crit_temp_C);
      if (seq.data.thickness_mm) thicknesses.add(seq.data.thickness_mm);
      if (seq.data.exposure) exposures.add(seq.data.exposure);
    });

    return {
      ratings: Array.from(ratings).sort(),
      temperatures: Array.from(temperatures).sort((a, b) => a - b),
      thicknesses: Array.from(thicknesses).sort((a, b) => a - b),
      exposures: Array.from(exposures).sort(),
    };
  }, [filteredSequences]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as TaxonomyFile;
      await importTaxonomy(data);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_sequences: filteredSequences.length,
      filters_applied: filters,
      sequences: filteredSequences,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec-explorer-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxonomy Explorer</h1>
          <p className="text-sm text-gray-500">
            {filteredSequences.length.toLocaleString()} DNA sequences
            {sources.length > 0 && ` from ${sources.length} sources`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Import */}
          <label className="btn-secondary cursor-pointer">
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={filteredSequences.length === 0}
            className="btn-secondary"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export
          </button>

          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={filters.search || ''}
        onChange={(search) => setFilters({ search })}
      />

      {/* Main Content */}
      <div className="flex-1 flex mt-4 gap-6 overflow-hidden">
        {/* Filters Panel */}
        {showFilters && (
          <FilterPanel
            options={filterOptions}
            selected={filters}
            onChange={setFilters}
            onClear={clearFilters}
          />
        )}

        {/* Data Grid */}
        <div className="flex-1 overflow-hidden">
          {isLoading || isImporting ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredSequences.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500">No sequences found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Import a taxonomy file to get started
                </p>
              </div>
            </div>
          ) : (
            <DataGrid
              data={filteredSequences}
              onSelect={setSelectedSequence}
            />
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedSequence}
        onClose={() => setSelectedSequence(null)}
        title="DNA Sequence Details"
        size="lg"
      >
        {selectedSequence && (
          <DetailView sequence={selectedSequence} />
        )}
      </Modal>
    </div>
  );
}
