# Quick sign-in with Clerk (Founding access)

Simple path: **Clerk handles Google login + remembering the user**.  
Backend still enforces fair-use daily quotas when auth is on.

## 1. Create a Clerk app (2 minutes)

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com) → sign up  
2. **Create application** → name it `Artist Engine`  
3. Enable **Google** (and optionally Email) on the social connections screen  
4. Copy:
   - **Publishable key** → frontend  
   - **Secret key** → backend  
5. Under **API Keys** / **JWT**, note your Frontend API URL  
   (looks like `https://verb-noun-00.clerk.accounts.dev`)

That’s it for Google — **no Google Cloud OAuth client** required for the default Clerk setup.

## 2. Environment variables

### Vercel (frontend)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Render (backend)

```
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER=https://YOUR-SUBDOMAIN.clerk.accounts.dev
```

`CLERK_JWT_ISSUER` must match the Frontend API URL from Clerk (no trailing slash).

Optional:

```
FOUNDING_EMAILS=you@gmail.com,dj2@gmail.com
ADMIN_EMAILS=you@gmail.com
AUTH_REQUIRED=1
```

- If **`FOUNDING_EMAILS` is empty**: any signed-in Clerk user can use the Engine.  
- If set: only those emails get in (others see waitlist).

You can **remove** the old Supabase auth vars from the login path (`SUPABASE_JWT_SECRET` etc.).  
Supabase is optional now (only if you still want remote usage logs).

## 3. Allowed origins in Clerk

**Clerk Dashboard → Configure → Domains / Paths**

Add:

- `http://localhost:5173`
- `https://your-app.vercel.app`

## 4. What users experience

1. Click **Founding Login** / go to `/login`  
2. **Continue with Google** (Clerk UI)  
3. Redirect to `/engine`  
4. Next visit: still signed in (Clerk session)  
5. Top bar shows **Member** + usage meters + Clerk avatar menu (sign out)

Profile fields used in pitches are auto-filled from Google name/email into `localStorage` once.

## 5. Daily fair-use (default)

| Action | / day |
|--------|------|
| Masters | 15 |
| Scouts | 15 |
| Pitches | 40 |
| Contracts | 15 |
| Oracle | 20 |
| Stems | 10 |

## 6. Local open mode

Without `VITE_CLERK_PUBLISHABLE_KEY`, the site stays open (no login) for local API work.
