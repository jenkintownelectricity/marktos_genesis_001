import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { syncEngine, SyncState } from '@/data/db/syncEngine';
import { isCloudSyncEnabled } from '@/data/api/supabaseClient';
import { useTenantContext } from './TenantProvider';

interface SyncContextType extends SyncState {
  sync: () => Promise<void>;
  isCloudEnabled: boolean;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { current: tenant } = useTenantContext();
  const [state, setState] = useState<SyncState>(syncEngine.getState());
  const isCloudEnabled = isCloudSyncEnabled();

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(setState);

    if (isCloudEnabled && tenant?.id) {
      syncEngine.startAutoSync(60000); // Sync every minute
    }

    return () => {
      unsubscribe();
      syncEngine.stopAutoSync();
    };
  }, [isCloudEnabled, tenant?.id]);

  const sync = async () => {
    if (tenant?.id) {
      await syncEngine.syncAll(tenant.id);
    }
  };

  return (
    <SyncContext.Provider value={{ ...state, sync, isCloudEnabled }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}
