/**
 * LDS.json (Lightning Data Service) Type Definitions
 * Defines the schema for offline-first, multi-tenant data storage
 */

export type SyncStrategy = 'server-wins' | 'client-wins' | 'last-write-wins' | 'append-only' | 'merge';

export type FieldType =
  | 'uuid'
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'timestamp'
  | 'json'
  | 'enum';

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: unknown;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  format?: 'email' | 'url' | 'phone' | 'date';
  values?: string[]; // For enum type
}

export interface SyncConfig {
  strategy: SyncStrategy;
  conflict?: 'merge' | 'overwrite' | 'reject';
  batch_size?: number;
}

export interface CollectionDefinition {
  primaryKey: string;
  foreignKeys?: Record<string, string>;
  fields: Record<string, FieldDefinition>;
  indexes?: string[];
  sync?: SyncConfig;
}

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    key_derivation: string;
    iterations: number;
  };
  row_level_security: boolean;
  tenant_isolation: 'strict' | 'shared' | 'none';
}

export interface LDSSchema {
  $schema: string;
  version: string;
  collections: Record<string, CollectionDefinition>;
  security: SecurityConfig;
}

export interface LDSSyncState {
  collection: string;
  last_synced_at: string;
  local_version: number;
  server_version: number;
  pending_changes: number;
  status: 'synced' | 'pending' | 'conflict' | 'error';
}

export interface LDSTransaction {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
  retries: number;
}

export interface LDSConflict {
  id: string;
  collection: string;
  local_data: Record<string, unknown>;
  server_data: Record<string, unknown>;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
  merged_data?: Record<string, unknown>;
}
