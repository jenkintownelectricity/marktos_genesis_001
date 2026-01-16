/**
 * Sync Engine - Bidirectional sync between IndexedDB and Supabase
 * Handles offline queue, conflict resolution, and batch operations
 */

import { db, SyncQueueItem } from './indexedDB';
import {
  getSupabaseClient,
  isCloudSyncEnabled,
  fetchTenantData,
  upsertTenantData,
  deleteTenantData,
} from '../api/supabaseClient';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  error: string | null;
}

const SYNC_COLLECTIONS = [
  'taxonomy_sources',
  'dna_sequences',
  'projects',
  'project_items',
] as const;

type SyncCollection = (typeof SYNC_COLLECTIONS)[number];

class SyncEngine {
  private status: SyncStatus = 'idle';
  private lastSyncedAt: string | null = null;
  private syncInterval: number | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  getState(): SyncState {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      pendingChanges: 0,
      error: null,
    };
  }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  async startAutoSync(intervalMs: number = 30000) {
    if (!isCloudSyncEnabled()) {
      this.status = 'offline';
      this.notify();
      return;
    }

    this.syncInterval = window.setInterval(() => {
      this.syncAll();
    }, intervalMs);

    // Initial sync
    await this.syncAll();
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncAll(tenantId?: string): Promise<boolean> {
    if (!isCloudSyncEnabled()) {
      return false;
    }

    this.status = 'syncing';
    this.notify();

    try {
      // Process pending offline changes first
      await this.processSyncQueue();

      // Then pull latest from server
      if (tenantId) {
        await this.pullFromServer(tenantId);
      }

      this.status = 'idle';
      this.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (error) {
      this.status = 'error';
      this.notify();
      console.error('Sync failed:', error);
      return false;
    }
  }

  private async processSyncQueue() {
    const pendingItems = await db.getPendingSyncItems();

    for (const item of pendingItems) {
      try {
        await this.processSyncItem(item);
        await db.removeSyncItem(item.id);
      } catch (error) {
        // Increment retry count
        if (item.retries < 3) {
          await db.sync_queue.update(item.id, {
            retries: item.retries + 1,
            error: String(error),
          });
        } else {
          console.error(`Failed to sync item after 3 retries:`, item);
        }
      }
    }
  }

  private async processSyncItem(item: SyncQueueItem) {
    const client = getSupabaseClient();
    if (!client) return;

    switch (item.operation) {
      case 'create':
      case 'update':
        await client.from(item.collection).upsert(item.data);
        break;
      case 'delete':
        await client
          .from(item.collection)
          .delete()
          .eq('id', item.data.id);
        break;
    }
  }

  private async pullFromServer(tenantId: string) {
    for (const collection of SYNC_COLLECTIONS) {
      await this.pullCollection(collection, tenantId);
    }
  }

  private async pullCollection(collection: SyncCollection, tenantId: string) {
    const serverData = await fetchTenantData<{ id: string }>(
      collection,
      tenantId
    );

    // Batch upsert to local DB
    const table = db.table(collection);
    await table.bulkPut(serverData);
  }

  async pushToServer<T extends { id: string }>(
    collection: string,
    tenantId: string,
    data: T | T[]
  ) {
    if (!isCloudSyncEnabled()) {
      // Queue for later sync
      const records = Array.isArray(data) ? data : [data];
      for (const record of records) {
        await db.addToSyncQueue({
          collection,
          operation: 'create',
          data: record as unknown as Record<string, unknown>,
          timestamp: new Date().toISOString(),
          retries: 0,
        });
      }
      return;
    }

    await upsertTenantData(collection, tenantId, data);
  }

  async deleteFromServer(
    collection: string,
    tenantId: string,
    ids: string[]
  ) {
    if (!isCloudSyncEnabled()) {
      for (const id of ids) {
        await db.addToSyncQueue({
          collection,
          operation: 'delete',
          data: { id },
          timestamp: new Date().toISOString(),
          retries: 0,
        });
      }
      return;
    }

    await deleteTenantData(collection, tenantId, ids);
  }

  async forcePull(tenantId: string, collection?: SyncCollection) {
    if (!isCloudSyncEnabled()) return;

    if (collection) {
      await this.pullCollection(collection, tenantId);
    } else {
      await this.pullFromServer(tenantId);
    }
  }

  async forcePush(tenantId: string) {
    await this.processSyncQueue();
  }
}

export const syncEngine = new SyncEngine();
