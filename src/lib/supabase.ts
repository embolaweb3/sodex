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

// Server-only client — authenticated writes (service role key, never sent to client)
export function createServerClient() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/*
  Required Supabase table — run once in your project's SQL editor:

  create table public.indexes (
    id            text primary key,
    wallet_address text not null,
    name          text not null,
    ticker        text not null,
    thesis        text not null,
    description   text,
    category      text,
    tags          text[],
    risk_level    text,
    constituents  jsonb not null default '[]',
    performance   jsonb,
    reasoning     text,
    warnings      text[],
    backtest      jsonb,
    is_public     boolean default true,
    followers     integer default 0,
    methodology_hash text,
    created_at    timestamptz default now(),
    updated_at    timestamptz default now()
  );

  alter table public.indexes enable row level security;

  -- Anyone can read public indexes
  create policy "public_read"  on public.indexes for select using (is_public = true);
  -- Anyone can insert (wallet address validated server-side)
  create policy "public_insert" on public.indexes for insert with check (true);
  -- Owner can update
  create policy "owner_update" on public.indexes for update using (true);
*/
