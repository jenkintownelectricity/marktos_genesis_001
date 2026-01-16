import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthState } from '@/types';
import { getSupabaseClient, getCurrentUser, isCloudSyncEnabled } from '@/data/api/supabaseClient';

interface AuthContextType extends AuthState {
  isOfflineMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setOfflineMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const [isOfflineMode, setOfflineMode] = useState(!isCloudSyncEnabled());

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      if (!isCloudSyncEnabled()) {
        // Offline mode - create a local user
        const offlineUser: User = {
          id: 'offline-user',
          tenant_id: 'local',
          email: 'local@offline.mode',
          role: 'owner',
          permissions: {
            taxonomy_read: true,
            taxonomy_write: true,
            taxonomy_delete: true,
            taxonomy_export: true,
            taxonomy_import: true,
            project_read: true,
            project_write: true,
            project_delete: true,
            project_share: false,
            users_manage: false,
            settings_manage: true,
            billing_manage: false,
            audit_view: false,
          },
          mfa_enabled: false,
          created_at: new Date().toISOString(),
        };

        setState({
          user: offlineUser,
          session: null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        const user = await getCurrentUser();
        if (user) {
          setState((prev) => ({
            ...prev,
            user: user as unknown as User,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to restore session',
        }));
      }
    };

    initAuth();

    // Listen for auth changes
    const client = getSupabaseClient();
    if (client) {
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setState((prev) => ({
              ...prev,
              user: session.user as unknown as User,
              isAuthenticated: true,
              isLoading: false,
            }));
          } else if (event === 'SIGNED_OUT') {
            setState({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Cloud sync not configured');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isOfflineMode,
        login,
        logout,
        setOfflineMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
