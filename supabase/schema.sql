-- The Artist Engine — Supabase schema (Auth + optional cloud profiles)
-- Run in Supabase SQL Editor. Safe to re-run.

-- Who is invited (optional allowlist)
create table if not exists public.founding_allowlist (
  email text primary key,
  name text,
  note text,
  created_at timestamptz not null default now()
);

-- App profile synced from Google / Supabase login
create table if not exists public.app_users (
  id uuid primary key,
  email text unique not null,
  display_name text,
  avatar_url text,
  role text not null default 'founding_member'
    check (role in ('founding_member', 'waitlisted', 'admin', 'suspended', 'member')),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  plan_id text default 'spark',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Rich artist profile (mirrors Engine SQLite user_profiles)
create table if not exists public.artist_profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  artist_alias text default '',
  one_liner text default '',
  bio text default '',
  home_city text default '',
  primary_genre text default '',
  target_markets text default '',
  agent_name text default '',
  agent_email text default '',
  agent_phone text default '',
  agent_social text default '',
  spotify_url text default '',
  apple_url text default '',
  youtube_url text default '',
  instagram_url text default '',
  other_url text default '',
  stats jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Every billable / abuse-prone action (optional cloud mirror)
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists usage_events_user_action_day_idx
  on public.usage_events (user_id, action, created_at desc);

alter table public.founding_allowlist enable row level security;
alter table public.app_users enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "users read own profile" on public.app_users;
create policy "users read own profile"
  on public.app_users for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users update own profile" on public.app_users;
create policy "users update own profile"
  on public.app_users for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users read own artist profile" on public.artist_profiles;
create policy "users read own artist profile"
  on public.artist_profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users upsert own artist profile" on public.artist_profiles;
create policy "users upsert own artist profile"
  on public.artist_profiles for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users read own usage" on public.usage_events;
create policy "users read own usage"
  on public.usage_events for select
  to authenticated
  using (auth.uid() = user_id);

-- Auto-create app_users row when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.app_users (id, email, display_name, avatar_url, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'founding_member',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.app_users.display_name),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.app_users.avatar_url),
    last_seen_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
