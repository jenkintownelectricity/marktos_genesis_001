/**
 * IndexedDB Service - Dexie-based offline storage
 * Implements LDS.json schema for offline-first architecture
 */

import Dexie, { Table } from 'dexie';
import type {
  DNASequence,
  TaxonomySource,
  User,
  Tenant,
  AuditLogEntry,
} from '@/types';

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  specifications?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  project_id: string;
  dna_sequence_id: string;
  quantity: number;
  notes?: string;
  order: number;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
  error?: string;
}

export class SpecExplorerDB extends Dexie {
  tenants!: Table<Tenant>;
  users!: Table<User>;
  taxonomy_sources!: Table<TaxonomySource>;
  dna_sequences!: Table<DNASequence>;
  projects!: Table<Project>;
  project_items!: Table<ProjectItem>;
  audit_logs!: Table<AuditLogEntry>;
  sync_queue!: Table<SyncQueueItem>;

  constructor() {
    super('SpecExplorerDB');

    this.version(1).stores({
      tenants: 'id, slug, created_at',
      users: 'id, tenant_id, email',
      taxonomy_sources: 'id, tenant_id, manufacturer, product_category',
      dna_sequences: 'id, tenant_id, source_id, rating, crit_temp_c, thickness_mm, max_section_factor, *searchable_text',
      projects: 'id, tenant_id, status, created_at',
      project_items: 'id, project_id',
      audit_logs: 'id, tenant_id, created_at, action',
      sync_queue: 'id, collection, timestamp',
    });
  }

  // Tenant-scoped queries
  async getSequencesByTenant(tenantId: string) {
    return this.dna_sequences.where('tenant_id').equals(tenantId).toArray();
  }

  async getSequencesBySource(sourceId: string) {
    return this.dna_sequences.where('source_id').equals(sourceId).toArray();
  }

  async getProjectsByTenant(tenantId: string) {
    return this.projects.where('tenant_id').equals(tenantId).toArray();
  }

  async getTaxonomySourcesByTenant(tenantId: string) {
    return this.taxonomy_sources.where('tenant_id').equals(tenantId).toArray();
  }

  // Filtered queries for DNA sequences
  async filterSequences(
    tenantId: string,
    filters: {
      ratings?: string[];
      temperatures?: number[];
      thicknesses?: number[];
      exposures?: string[];
      sourceId?: string;
      search?: string;
    }
  ) {
    let collection = this.dna_sequences.where('tenant_id').equals(tenantId);

    const results = await collection.toArray();

    return results.filter((seq) => {
      if (filters.ratings?.length && !filters.ratings.includes(seq.data.rating || '')) {
        return false;
      }
      if (filters.temperatures?.length && !filters.temperatures.includes(seq.data.crit_temp_C || 0)) {
        return false;
      }
      if (filters.thicknesses?.length && !filters.thicknesses.includes(seq.data.thickness_mm || 0)) {
        return false;
      }
      if (filters.exposures?.length && !filters.exposures.includes(seq.data.exposure || '')) {
        return false;
      }
      if (filters.sourceId && seq.id.indexOf(filters.sourceId) === -1) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchText = seq.searchable_text?.toLowerCase() || seq.id.toLowerCase();
        if (!searchText.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>) {
    const id = crypto.randomUUID();
    await this.sync_queue.add({ ...item, id });
    return id;
  }

  async getPendingSyncItems() {
    return this.sync_queue.orderBy('timestamp').toArray();
  }

  async removeSyncItem(id: string) {
    await this.sync_queue.delete(id);
  }

  async clearSyncQueue() {
    await this.sync_queue.clear();
  }

  // Bulk operations
  async bulkImportSequences(sequences: DNASequence[], tenantId: string, sourceId: string) {
    const enrichedSequences = sequences.map((seq) => ({
      ...seq,
      tenant_id: tenantId,
      source_id: sourceId,
      searchable_text: this.generateSearchableText(seq),
      created_at: seq.created_at || new Date().toISOString(),
    }));

    await this.dna_sequences.bulkPut(enrichedSequences as unknown as DNASequence[]);
    return enrichedSequences.length;
  }

  private generateSearchableText(seq: DNASequence): string {
    const parts = [
      seq.id,
      seq.data.rating,
      seq.data.crit_temp_C?.toString(),
      seq.data.thickness_mm?.toString(),
      seq.data.max_section_factor?.toString(),
      seq.data.exposure,
      seq.data.fixing,
      seq.meta?.manufacturer,
      seq.meta?.product_name,
      seq.meta?.system,
    ].filter(Boolean);
    return parts.join(' ').toLowerCase();
  }

  // Statistics
  async getStats(tenantId: string) {
    const [sources, sequences, projects] = await Promise.all([
      this.taxonomy_sources.where('tenant_id').equals(tenantId).count(),
      this.dna_sequences.where('tenant_id').equals(tenantId).count(),
      this.projects.where('tenant_id').equals(tenantId).count(),
    ]);

    return {
      total_taxonomy_sources: sources,
      total_dna_sequences: sequences,
      total_projects: projects,
    };
  }

  // Clear all data (for logout or reset)
  async clearAllData() {
    await Promise.all([
      this.tenants.clear(),
      this.users.clear(),
      this.taxonomy_sources.clear(),
      this.dna_sequences.clear(),
      this.projects.clear(),
      this.project_items.clear(),
      this.audit_logs.clear(),
      this.sync_queue.clear(),
    ]);
  }

  // Export data for backup
  async exportData(tenantId: string) {
    const [sources, sequences, projects, items] = await Promise.all([
      this.getTaxonomySourcesByTenant(tenantId),
      this.getSequencesByTenant(tenantId),
      this.getProjectsByTenant(tenantId),
      this.project_items.toArray(),
    ]);

    return {
      exported_at: new Date().toISOString(),
      tenant_id: tenantId,
      taxonomy_sources: sources,
      dna_sequences: sequences,
      projects,
      project_items: items.filter((i) =>
        projects.some((p) => p.id === i.project_id)
      ),
    };
  }
}

// Singleton instance
export const db = new SpecExplorerDB();

// Initialize database
export async function initDB() {
  try {
    await db.open();
    console.log('SpecExplorer IndexedDB initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    return false;
  }
}
