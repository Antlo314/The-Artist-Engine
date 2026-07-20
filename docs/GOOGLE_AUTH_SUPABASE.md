# Google Auth via Supabase (recommended)

Google login is **not fully “already on”** until you flip Google in the Supabase dashboard and put keys in env. The app is **wired** for it.

## How it works

1. Frontend uses Supabase JS → `signInWithOAuth({ provider: 'google' })`
2. User signs in with Google on Supabase’s OAuth flow
3. Browser returns to `/login` with a Supabase session
4. Frontend POSTs `access_token` → `POST /api/auth/supabase`
5. Backend validates token with Supabase Auth API, creates/links Engine user + profile, returns Engine session token

Email/password still works. Direct Google GIS (`VITE_GOOGLE_CLIENT_ID`) is optional fallback.

## One-time Supabase setup

### 1. Enable Google provider

Supabase Dashboard → **Authentication** → **Providers** → **Google** → Enable

You need a Google Cloud OAuth **Web client**:

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials  
2. Create **OAuth client ID** (Web application)  
3. Authorized JavaScript origins:
   - `http://localhost:5173`
   - your production domain (e.g. `https://your-app.vercel.app`)
4. Authorized redirect URIs (copy from Supabase Google provider screen), typically:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

Paste **Client ID** + **Client Secret** into Supabase Google provider settings. Save.

### 2. Redirect URLs

Supabase → Authentication → **URL configuration**:

- Site URL: `http://localhost:5173` (prod: your live URL)
- Redirect allow list:
  - `http://localhost:5173/login`
  - `https://your-production-domain/login`

### 3. Env vars

**Frontend** (`frontend/.env` or Vercel):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Backend** (Render / local `backend/.env`):

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
# optional but recommended for app_users sync:
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Restart frontend + backend after setting env.

### 4. SQL (optional, richer cloud profile)

Run `supabase/schema.sql` in the SQL Editor (updated with plans/profiles). Engine still uses SQLite on the API host for billing/CRM; Supabase holds Auth + optional `app_users`.

## Verify

1. Open `/login` — should show “via Supabase Auth” under Google  
2. Click **Continue with Google**  
3. Land back in `/engine` signed in  
4. `GET /api/auth/providers` → `{ "supabase": true, "preferred": "supabase" }`

## Demo users (rich data)

Admin → **CRM Ops** → **Seed demo artists**

| Email | Plan | Notes |
|-------|------|--------|
| nova.blake@example.com | Pro + promo | Full bio, 4 leads, LA R&B |
| dj.kiln@example.com | Creator | Techno, Berlin, booked lead |
| sierra.waves@example.com | Spark + promo | Indie folk, 2 leads |

Password for all: **`DemoArtist1!`**
