import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function hasSupabase(): boolean {
  return Boolean(url && anonKey);
}

// Browser client — public reads (anon key)
export const supabase = url && anonKey
  ? createClient(url, anonKey)
  : null;

// Server-only client
export function createServerClient() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

