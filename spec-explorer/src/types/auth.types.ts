/**
 * Authentication & Authorization Type Definitions
 * Enterprise-grade security with MFA and RBAC
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
  permissions: UserPermissions;
  mfa_enabled: boolean;
  last_login?: string;
  created_at: string;
}

export interface UserPermissions {
  // Taxonomy permissions
  taxonomy_read: boolean;
  taxonomy_write: boolean;
  taxonomy_delete: boolean;
  taxonomy_export: boolean;
  taxonomy_import: boolean;

  // Project permissions
  project_read: boolean;
  project_write: boolean;
  project_delete: boolean;
  project_share: boolean;

  // Admin permissions
  users_manage: boolean;
  settings_manage: boolean;
  billing_manage: boolean;
  audit_view: boolean;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  owner: {
    taxonomy_read: true,
    taxonomy_write: true,
    taxonomy_delete: true,
    taxonomy_export: true,
    taxonomy_import: true,
    project_read: true,
    project_write: true,
    project_delete: true,
    project_share: true,
    users_manage: true,
    settings_manage: true,
    billing_manage: true,
    audit_view: true,
  },
  admin: {
    taxonomy_read: true,
    taxonomy_write: true,
    taxonomy_delete: true,
    taxonomy_export: true,
    taxonomy_import: true,
    project_read: true,
    project_write: true,
    project_delete: true,
    project_share: true,
    users_manage: true,
    settings_manage: true,
    billing_manage: false,
    audit_view: true,
  },
  editor: {
    taxonomy_read: true,
    taxonomy_write: true,
    taxonomy_delete: false,
    taxonomy_export: true,
    taxonomy_import: true,
    project_read: true,
    project_write: true,
    project_delete: false,
    project_share: false,
    users_manage: false,
    settings_manage: false,
    billing_manage: false,
    audit_view: false,
  },
  viewer: {
    taxonomy_read: true,
    taxonomy_write: false,
    taxonomy_delete: false,
    taxonomy_export: true,
    taxonomy_import: false,
    project_read: true,
    project_write: false,
    project_delete: false,
    project_share: false,
    users_manage: false,
    settings_manage: false,
    billing_manage: false,
    audit_view: false,
  },
};

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfa_code?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  tenant_name?: string;
}

export interface MFASetupData {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  user_email?: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'password_changed'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'taxonomy_created'
  | 'taxonomy_updated'
  | 'taxonomy_deleted'
  | 'taxonomy_imported'
  | 'taxonomy_exported'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'settings_updated';
