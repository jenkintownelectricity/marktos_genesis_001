/**
 * Supabase Client - Optional cloud sync integration
 * Multi-tenant with Row Level Security
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured - running in offline-only mode');
    return null;
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabase;
}

export function isCloudSyncEnabled(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

export async function testConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('tenants').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Auth helpers
export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync not configured');

  return client.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync not configured');

  return client.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;

  return client.auth.signOut();
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function getSession() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { session } } = await client.auth.getSession();
  return session;
}

// Database helpers with tenant isolation
export async function fetchTenantData<T>(
  table: string,
  tenantId: string,
  options?: { select?: string; filters?: Record<string, unknown> }
): Promise<T[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from(table)
    .select(options?.select || '*')
    .eq('tenant_id', tenantId);

  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}

export async function upsertTenantData<T extends { id: string }>(
  table: string,
  tenantId: string,
  data: T | T[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const records = Array.isArray(data) ? data : [data];
  const enriched = records.map((r) => ({ ...r, tenant_id: tenantId }));

  const { error } = await client.from(table).upsert(enriched);
  if (error) throw error;
}

export async function deleteTenantData(
  table: string,
  tenantId: string,
  ids: string[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from(table)
    .delete()
    .eq('tenant_id', tenantId)
    .in('id', ids);

  if (error) throw error;
}
