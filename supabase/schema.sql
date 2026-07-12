-- The Artist Engine — Founding Cohort schema
-- Run this in Supabase SQL Editor (Project → SQL → New query).

-- Who is invited (50 DJs). Manage here or via FOUNDING_EMAILS env.
create table if not exists public.founding_allowlist (
  email text primary key,
  name text,
  note text,
  created_at timestamptz not null default now()
);

-- App profile synced from Google login
create table if not exists public.app_users (
  id uuid primary key,
  email text unique not null,
  display_name text,
  avatar_url text,
  role text not null default 'waitlisted'
    check (role in ('founding_member', 'waitlisted', 'admin', 'suspended')),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Every billable / abuse-prone action
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists usage_events_user_action_day_idx
  on public.usage_events (user_id, action, created_at desc);

-- Service role (backend) only — clients never write these tables directly.
alter table public.founding_allowlist enable row level security;
alter table public.app_users enable row level security;
alter table public.usage_events enable row level security;

-- Authenticated users can read their own profile + own usage counts.
create policy "users read own profile"
  on public.app_users for select
  to authenticated
  using (auth.uid() = id);

create policy "users read own usage"
  on public.usage_events for select
  to authenticated
  using (auth.uid() = user_id);

-- Seed example (replace with your 50 emails):
-- insert into public.founding_allowlist (email, name, note) values
--   ('dj1@gmail.com', 'DJ One', 'cohort-1'),
--   ('dj2@gmail.com', 'DJ Two', 'cohort-1');
