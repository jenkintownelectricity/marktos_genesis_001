/**
 * Multi-Tenant Type Definitions
 * Supports SaaS deployment with tenant isolation
 */

export type TenantPlan = 'free' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  // Branding
  logo_url?: string;
  primary_color?: string;

  // Features
  max_users: number;
  max_projects: number;
  max_taxonomy_sources: number;
  cloud_sync_enabled: boolean;
  api_access_enabled: boolean;

  // Security
  mfa_required: boolean;
  password_min_length: number;
  session_timeout_minutes: number;
  allowed_domains?: string[];

  // Data retention
  audit_log_retention_days: number;
  backup_enabled: boolean;
}

export const DEFAULT_TENANT_SETTINGS: Record<TenantPlan, TenantSettings> = {
  free: {
    max_users: 2,
    max_projects: 5,
    max_taxonomy_sources: 3,
    cloud_sync_enabled: false,
    api_access_enabled: false,
    mfa_required: false,
    password_min_length: 8,
    session_timeout_minutes: 60,
    audit_log_retention_days: 30,
    backup_enabled: false,
  },
  pro: {
    max_users: 10,
    max_projects: 50,
    max_taxonomy_sources: 20,
    cloud_sync_enabled: true,
    api_access_enabled: true,
    mfa_required: false,
    password_min_length: 10,
    session_timeout_minutes: 120,
    audit_log_retention_days: 90,
    backup_enabled: true,
  },
  enterprise: {
    max_users: -1, // Unlimited
    max_projects: -1,
    max_taxonomy_sources: -1,
    cloud_sync_enabled: true,
    api_access_enabled: true,
    mfa_required: true,
    password_min_length: 12,
    session_timeout_minutes: 480,
    audit_log_retention_days: 365,
    backup_enabled: true,
  },
};

export interface TenantInvite {
  id: string;
  tenant_id: string;
  email: string;
  role: import('./auth.types').UserRole;
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface TenantStats {
  total_users: number;
  total_projects: number;
  total_taxonomy_sources: number;
  total_dna_sequences: number;
  storage_used_bytes: number;
  last_activity: string;
}

export interface TenantState {
  current: Tenant | null;
  stats: TenantStats | null;
  isLoading: boolean;
  error: string | null;
}
