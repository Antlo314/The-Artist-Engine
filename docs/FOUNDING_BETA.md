# Founding Cohort (50 DJs) — Google login + fair-use limits

Closed beta for founding DJs: **Google Sign-In**, **email allowlist**, **daily quotas**, **usage meters**.

## Architecture

```
Vercel (frontend)
  Google OAuth via Supabase Auth
  JWT on every /api/* call

Render (backend)
  Verifies Supabase JWT
  Checks allowlist → founding_member
  Enforces daily quotas before heavy work
  Logs usage_events
```

## 1. Create a free Supabase project

1. https://supabase.com → New project  
2. **Authentication → Providers → Google**  
   - Enable Google  
   - Add OAuth Client ID/Secret from Google Cloud Console  
   - Authorized redirect URI from Supabase Google provider screen  
3. **Authentication → URL configuration**  
   - Site URL: `https://your-frontend.vercel.app`  
   - Redirect URLs: `http://localhost:5173/**`, `https://your-frontend.vercel.app/**`  
4. **SQL Editor** → run `supabase/schema.sql`  
5. Seed allowlist (your 50 emails):

```sql
insert into public.founding_allowlist (email, name, note) values
  ('dj1@gmail.com', 'DJ One', 'cohort-1'),
  ('dj2@gmail.com', 'DJ Two', 'cohort-1');
-- …up to 50
```

Or set env `FOUNDING_EMAILS=a@x.com,b@y.com` (comma-separated) on Render for a quick bootstrap without SQL.

## 2. Environment variables

### Render (backend)

| Variable | Where to find |
|----------|----------------|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` (server only!) |
| `FOUNDING_EMAILS` | Optional comma list of invited emails |
| `ADMIN_EMAILS` | Optional emails that always get admin access |
| `AUTH_REQUIRED` | Default on when Supabase is set; `0` for open local testing |

Optional quota overrides: `QUOTA_MASTER_DAY`, `QUOTA_SCOUT_DAY`, `QUOTA_PITCH_DAY`, `QUOTA_CONTRACT_DAY`, `QUOTA_ORACLE_DAY`, `QUOTA_STEMS_DAY`, `QUOTA_MASTER_CONCURRENT`.

### Vercel (frontend)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | Same Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → `anon` public key |

Local frontend: put the same keys in `frontend/.env`.

## 3. Default daily limits (founding)

| Action | / day |
|--------|------|
| Masters | 15 |
| Venue scouts | 15 |
| Pitches (email/call/DM) | 40 |
| Contract scans | 15 |
| Oracle | 20 |
| Stem splits | 10 |
| Concurrent masters | 1 |

Resets at **00:00 UTC**. UI shows remaining counts in the Engine top bar.

## 4. User flows

| State | What they see |
|-------|----------------|
| Not signed in | `/login` → Continue with Google |
| Signed in, email **not** on allowlist | Waitlist message on `/login` |
| Signed in + allowlisted | Full Engine + Founding Member badge + meters |
| Over quota | Clear 429 with “resets in Xh” — no silent fail |

## 5. Managing the cohort

- **Add DJ:** insert email into `founding_allowlist` (or add to `FOUNDING_EMAILS` + redeploy)  
- **Remove / abuse:** `update app_users set status='suspended', role='suspended' where email='…'`  
- **Raise limits:** env vars on Render, no code change  

## 6. Local open mode

Without Supabase env vars, auth is **off** (dev open mode) so mastering still works offline.  
With Supabase configured but `AUTH_REQUIRED=0`, JWT is optional.

## 7. Security notes

- Never put `service_role` key in the frontend.  
- Protect Render URL once auth is live — all heavy routes require a founding JWT.  
- Google login alone is not enough without the allowlist; both are required.
