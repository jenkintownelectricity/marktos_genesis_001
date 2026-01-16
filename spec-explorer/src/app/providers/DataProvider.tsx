import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { DNASequence, TaxonomySource, TaxonomyFilters, TaxonomyFile } from '@/types';
import { db } from '@/data/db/indexedDB';
import { useTenantContext } from './TenantProvider';

interface DataContextType {
  // Data
  sources: TaxonomySource[];
  sequences: DNASequence[];
  filteredSequences: DNASequence[];

  // Filters
  filters: TaxonomyFilters;
  setFilters: (filters: TaxonomyFilters) => void;
  clearFilters: () => void;

  // Actions
  importTaxonomy: (file: TaxonomyFile) => Promise<void>;
  deleteSource: (sourceId: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { current: tenant } = useTenantContext();
  const [filters, setFiltersState] = useState<TaxonomyFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = tenant?.id || 'local';

  // Live queries with Dexie
  const sources = useLiveQuery(
    () => db.getTaxonomySourcesByTenant(tenantId),
    [tenantId],
    []
  );

  const sequences = useLiveQuery(
    () => db.getSequencesByTenant(tenantId),
    [tenantId],
    []
  );

  // Filter sequences
  const filteredSequences = useLiveQuery(
    () => db.filterSequences(tenantId, {
      ratings: filters.ratings,
      temperatures: filters.temperatures,
      thicknesses: filters.thicknesses,
      exposures: filters.exposures,
      search: filters.search,
    }),
    [tenantId, filters],
    []
  );

  const setFilters = useCallback((newFilters: TaxonomyFilters) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const importTaxonomy = useCallback(async (file: TaxonomyFile) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create taxonomy source
      const source: TaxonomySource = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        name: file.meta.system || 'Imported Taxonomy',
        manufacturer: file.meta.system?.split(' ')[0] || 'Unknown',
        version: file.version || '1.0.0',
        product_category: 'fire_protection',
        meta: file.meta,
        created_at: new Date().toISOString(),
      };

      await db.taxonomy_sources.add(source);

      // Import sequences
      await db.bulkImportSequences(file.dna_sequences, tenantId, source.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  const deleteSource = useCallback(async (sourceId: string) => {
    setIsLoading(true);
    try {
      // Delete all sequences for this source
      const toDelete = await db.dna_sequences
        .where('source_id')
        .equals(sourceId)
        .toArray();

      await db.dna_sequences.bulkDelete(toDelete.map((s) => s.id));
      await db.taxonomy_sources.delete(sourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    // Dexie live queries handle this automatically
  }, []);

  return (
    <DataContext.Provider
      value={{
        sources: sources || [],
        sequences: sequences || [],
        filteredSequences: filteredSequences || [],
        filters,
        setFilters,
        clearFilters,
        importTaxonomy,
        deleteSource,
        refreshData,
        isLoading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
}
