# Simple login (name + email + password)

No Google / Clerk required. Accounts live in a SQLite DB on the Render backend.

## User flow

1. Open `/login`
2. **Sign up** with name, email, password → enters Engine
3. Next visit: **Sign in** with email + password (session remembered ~30 days)

## Admin

Seeded automatically on backend boot:

| Field | Default |
|--------|---------|
| Email | `iamwhoiambook@gmail.com` |
| Password | set via `ADMIN_PASSWORD` env (default bootstrap in code — **change after first login**) |

On Render, set (recommended):

```
ADMIN_EMAIL=iamwhoiambook@gmail.com
ADMIN_PASSWORD=your-strong-password
ADMIN_NAME=Admin
```

To force-reset admin password after deploy:

```
ADMIN_RESET=1
```

(then remove `ADMIN_RESET` after one successful boot)

## API

| Method | Path | Body |
|--------|------|------|
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/logout` | Bearer token |
| GET | `/api/me` | Bearer token |
| GET | `/api/admin/users` | Admin Bearer only |

## Storage

- File: `backend/data/users.db` on the server
- **Note:** Render free disk is ephemeral — redeploys can wipe the DB unless you attach a persistent disk. For a durable founding list, add a Render **persistent disk** mounted at `/opt/render/project/src/backend/data` or set `AUTH_DATA_DIR` to that mount.

## Fair-use (non-admin)

Daily caps still apply to members (masters, scouts, pitches, etc.). Admins are unlimited.
