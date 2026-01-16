import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Tenant, TenantState, TenantStats } from '@/types';
import { useAuthContext } from './AuthProvider';
import { db } from '@/data/db/indexedDB';

interface TenantContextType extends TenantState {
  switchTenant: (tenantId: string) => Promise<void>;
  updateSettings: (settings: Partial<Tenant['settings']>) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | null>(null);

// Default local tenant for offline mode
const LOCAL_TENANT: Tenant = {
  id: 'local',
  name: 'Local Workspace',
  slug: 'local',
  plan: 'free',
  settings: {
    max_users: 1,
    max_projects: -1,
    max_taxonomy_sources: -1,
    cloud_sync_enabled: false,
    api_access_enabled: false,
    mfa_required: false,
    password_min_length: 8,
    session_timeout_minutes: 0,
    audit_log_retention_days: 30,
    backup_enabled: false,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isOfflineMode } = useAuthContext();
  const [state, setState] = useState<TenantState>({
    current: null,
    stats: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadTenant = async () => {
      if (isOfflineMode || !user?.tenant_id) {
        // Use local tenant
        const stats = await db.getStats('local');
        setState({
          current: LOCAL_TENANT,
          stats: {
            ...stats,
            total_users: 1,
            storage_used_bytes: 0,
            last_activity: new Date().toISOString(),
          },
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        // Load tenant from Supabase
        const tenant = await db.tenants.get(user.tenant_id);
        const stats = await db.getStats(user.tenant_id);

        setState({
          current: tenant || LOCAL_TENANT,
          stats: {
            ...stats,
            total_users: 1,
            storage_used_bytes: 0,
            last_activity: new Date().toISOString(),
          },
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          current: LOCAL_TENANT,
          isLoading: false,
          error: 'Failed to load tenant',
        }));
      }
    };

    loadTenant();
  }, [user, isOfflineMode]);

  const switchTenant = async (tenantId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const tenant = await db.tenants.get(tenantId);
      const stats = await db.getStats(tenantId);

      setState({
        current: tenant || LOCAL_TENANT,
        stats: stats as TenantStats,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to switch tenant',
      }));
    }
  };

  const updateSettings = async (settings: Partial<Tenant['settings']>) => {
    if (!state.current) return;

    const updated = {
      ...state.current,
      settings: { ...state.current.settings, ...settings },
      updated_at: new Date().toISOString(),
    };

    await db.tenants.put(updated);
    setState((prev) => ({ ...prev, current: updated }));
  };

  return (
    <TenantContext.Provider
      value={{
        ...state,
        switchTenant,
        updateSettings,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  return context;
}
