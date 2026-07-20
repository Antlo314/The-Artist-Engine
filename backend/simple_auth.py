"""
Simple name + email + password auth.

Users stored in SQLite on the backend. Session tokens keep them logged in.
Admin is seeded from ADMIN_EMAIL / ADMIN_PASSWORD env (never commit passwords).
"""

from __future__ import annotations

import os
import sqlite3
import secrets
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Optional
from collections import defaultdict

from fastapi import Header, HTTPException

try:
    import bcrypt
except ImportError:
    bcrypt = None  # type: ignore

# ---------------------------------------------------------------------------
# Paths + limits
# ---------------------------------------------------------------------------

DATA_DIR = Path(os.getenv("AUTH_DATA_DIR", Path(__file__).resolve().parent / "data"))
DB_PATH = DATA_DIR / "users.db"

DAILY_LIMITS: dict[str, int] = {
    "master": int(os.getenv("QUOTA_MASTER_DAY", "15")),
    "scout": int(os.getenv("QUOTA_SCOUT_DAY", "15")),
    "pitch": int(os.getenv("QUOTA_PITCH_DAY", "40")),
    "contract": int(os.getenv("QUOTA_CONTRACT_DAY", "15")),
    "oracle": int(os.getenv("QUOTA_ORACLE_DAY", "20")),
    "stems": int(os.getenv("QUOTA_STEMS_DAY", "10")),
}
MAX_CONCURRENT_MASTERS = int(os.getenv("QUOTA_MASTER_CONCURRENT", "1"))

SESSION_DAYS = int(os.getenv("SESSION_DAYS", "30"))

_db_lock = threading.Lock()
_mem_usage: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
_mem_lock = threading.Lock()
_active_masters: dict[str, int] = defaultdict(int)


@dataclass
class AppUser:
    id: str
    email: str
    display_name: str = ""
    avatar_url: str = ""
    role: str = "member"  # member | admin
    status: str = "active"
    plan_id: str = "spark"
    promo_multiplier: int = 1
    promo_expires_at: Optional[float] = None
    auth_provider: str = "password"
    cohort_tags: str = ""
    stripe_customer_id: str = ""

    @property
    def is_allowed(self) -> bool:
        return self.status == "active" and self.role in ("member", "admin", "founding_member")

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


def auth_configured() -> bool:
    return True  # always available


def auth_required() -> bool:
    flag = os.getenv("AUTH_REQUIRED", "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return False
    return True


def _conn() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    """Create tables + seed admin from env if missing."""
    with _db_lock:
        con = _conn()
        try:
            con.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'member',
                    status TEXT NOT NULL DEFAULT 'active',
                    created_at TEXT NOT NULL,
                    last_login_at TEXT
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS usage_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    meta TEXT DEFAULT '{}'
                );
                CREATE INDEX IF NOT EXISTS idx_usage_user_action
                    ON usage_events(user_id, action, created_at);
                """
            )
            con.commit()
            _seed_admin(con)
        finally:
            con.close()
    # Billing / plan columns + tables (safe re-run)
    try:
        from billing import ensure_user_billing_columns, init_billing_tables

        ensure_user_billing_columns()
        init_billing_tables()
    except Exception as e:
        print(f"[AUTH] Billing init deferred: {e}")
    try:
        from user_profiles import init_profile_tables

        init_profile_tables()
    except Exception as e:
        print(f"[AUTH] Profile tables deferred: {e}")


def _hash_password(password: str) -> str:
    if bcrypt is None:
        raise RuntimeError("bcrypt is not installed")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, password_hash: str) -> bool:
    if bcrypt is None:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def _seed_admin(con: sqlite3.Connection) -> None:
    # Defaults match the founding operator account; override with ADMIN_* env on Render.
    email = (os.getenv("ADMIN_EMAIL") or "iamwhoiambook@gmail.com").strip().lower()
    password = (os.getenv("ADMIN_PASSWORD") or "Sk8basket!").strip()
    name = (os.getenv("ADMIN_NAME") or "Admin").strip() or "Admin"

    row = con.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if row:
        if os.getenv("ADMIN_RESET", "").strip().lower() in ("1", "true", "yes"):
            con.execute(
                "UPDATE users SET password_hash = ?, role = 'admin', name = ? WHERE email = ?",
                (_hash_password(password), name, email),
            )
            con.commit()
            print(f"[AUTH] Admin password reset for {email}")
        else:
            con.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
            con.commit()
        return

    uid = secrets.token_hex(16)
    now = datetime.now(timezone.utc).isoformat()
    con.execute(
        "INSERT INTO users (id, email, name, password_hash, role, status, created_at) VALUES (?,?,?,?,?,?,?)",
        (uid, email, name, _hash_password(password), "admin", "active", now),
    )
    con.commit()
    print(f"[AUTH] Admin account created: {email}")


def _row_get(row: sqlite3.Row, key: str, default: Any = None) -> Any:
    try:
        keys = row.keys()
        if key not in keys:
            return default
        val = row[key]
        return default if val is None else val
    except Exception:
        return default


def _row_user(row: sqlite3.Row) -> AppUser:
    role = row["role"] if row["role"] != "founding_member" else "member"
    return AppUser(
        id=row["id"],
        email=row["email"],
        display_name=row["name"],
        avatar_url="",
        role=role,
        status=row["status"],
        plan_id=str(_row_get(row, "plan_id", "spark") or "spark"),
        promo_multiplier=int(_row_get(row, "promo_multiplier", 1) or 1),
        promo_expires_at=_row_get(row, "promo_expires_at"),
        auth_provider=str(_row_get(row, "auth_provider", "password") or "password"),
        cohort_tags=str(_row_get(row, "cohort_tags", "") or ""),
        stripe_customer_id=str(_row_get(row, "stripe_customer_id", "") or ""),
    )


def register_user(name: str, email: str, password: str) -> tuple[AppUser, str]:
    name = (name or "").strip()
    email = (email or "").strip().lower()
    password = password or ""

    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters.")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Enter a valid email.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    with _db_lock:
        con = _conn()
        try:
            exists = con.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if exists:
                raise HTTPException(status_code=409, detail="That email is already registered. Sign in instead.")
            uid = secrets.token_hex(16)
            now = datetime.now(timezone.utc).isoformat()
            con.execute(
                "INSERT INTO users (id, email, name, password_hash, role, status, created_at, plan_id, auth_provider) VALUES (?,?,?,?,?,?,?,?,?)",
                (uid, email, name, _hash_password(password), "member", "active", now, "spark", "password"),
            )
            token = _create_session(con, uid)
            con.commit()
            user = AppUser(id=uid, email=email, display_name=name, role="member", status="active", plan_id="spark")
        finally:
            con.close()
    # Outside lock — billing uses same lock
    try:
        from billing import bootstrap_new_user_billing

        bootstrap_new_user_billing(user.id)
    except Exception as e:
        print(f"[AUTH] bootstrap billing: {e}")
    try:
        from user_profiles import ensure_profile

        ensure_profile(user.id, name=name, email=email)
    except Exception as e:
        print(f"[AUTH] profile bootstrap: {e}")
    return user, token


def login_user(email: str, password: str) -> tuple[AppUser, str]:
    email = (email or "").strip().lower()
    password = password or ""
    with _db_lock:
        con = _conn()
        try:
            row = con.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            ph = row["password_hash"] if row else ""
            if not row or not ph or ph.startswith("!") or not _check_password(password, ph):
                raise HTTPException(status_code=401, detail="Invalid email or password.")
            if row["status"] != "active":
                raise HTTPException(status_code=403, detail="Account is suspended.")
            token = _create_session(con, row["id"])
            con.execute(
                "UPDATE users SET last_login_at = ? WHERE id = ?",
                (datetime.now(timezone.utc).isoformat(), row["id"]),
            )
            con.commit()
            user = _row_user(row)
        finally:
            con.close()
    try:
        from billing import ensure_monthly_grant, active_multiplier

        ensure_monthly_grant(user.id, user.plan_id or "spark", active_multiplier(user.id))
    except Exception:
        pass
    return user, token


def login_or_register_google(
    email: str,
    name: str,
    *,
    google_sub: str = "",
    avatar_url: str = "",
    auth_provider: str = "google",
) -> tuple[AppUser, str]:
    """Upsert user from verified Google / Supabase identity; issue session token."""
    email = (email or "").strip().lower()
    name = (name or email.split("@")[0] or "Artist").strip()
    provider = (auth_provider or "google").strip() or "google"
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Google account has no email.")

    is_new = False
    with _db_lock:
        con = _conn()
        try:
            row = con.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            now = datetime.now(timezone.utc).isoformat()
            if row:
                if row["status"] != "active":
                    raise HTTPException(status_code=403, detail="Account is suspended.")
                con.execute(
                    "UPDATE users SET last_login_at = ?, auth_provider = ?, name = CASE WHEN name = '' OR name IS NULL THEN ? ELSE name END WHERE id = ?",
                    (now, provider, name, row["id"]),
                )
                token = _create_session(con, row["id"])
                con.commit()
                user = _row_user(
                    con.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()
                )
            else:
                is_new = True
                uid = secrets.token_hex(16)
                # Unusable password hash for OAuth-only accounts
                sentinel = f"!{provider}!{secrets.token_hex(16)}"
                con.execute(
                    """
                    INSERT INTO users
                    (id, email, name, password_hash, role, status, created_at, last_login_at, plan_id, auth_provider)
                    VALUES (?,?,?,?,?,?,?,?,?,?)
                    """,
                    (uid, email, name, sentinel, "member", "active", now, now, "spark", provider),
                )
                token = _create_session(con, uid)
                con.commit()
                user = AppUser(
                    id=uid,
                    email=email,
                    display_name=name,
                    role="member",
                    status="active",
                    plan_id="spark",
                    auth_provider=provider,
                )
        finally:
            con.close()
    try:
        from billing import bootstrap_new_user_billing, ensure_monthly_grant, active_multiplier

        if is_new:
            bootstrap_new_user_billing(user.id)
        else:
            ensure_monthly_grant(user.id, user.plan_id or "spark", active_multiplier(user.id))
    except Exception as e:
        print(f"[AUTH] oauth billing: {e}")
    try:
        from user_profiles import ensure_profile, get_profile, save_profile

        prof = ensure_profile(user.id, name=name, email=email, avatar_url=avatar_url or "")
        if avatar_url and not (prof or {}).get("avatar_url"):
            save_profile(user.id, {**(prof or {}), "avatar_url": avatar_url})
    except Exception as e:
        print(f"[AUTH] oauth profile: {e}")
    return user, token


def _create_session(con: sqlite3.Connection, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=SESSION_DAYS)
    con.execute(
        "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)",
        (token, user_id, now.isoformat(), exp.isoformat()),
    )
    return token


def logout_token(token: str) -> None:
    if not token:
        return
    with _db_lock:
        con = _conn()
        try:
            con.execute("DELETE FROM sessions WHERE token = ?", (token,))
            con.commit()
        finally:
            con.close()


def user_from_token(token: str) -> Optional[AppUser]:
    if not token:
        return None
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                """
                SELECT u.* FROM sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token = ?
                """,
                (token,),
            ).fetchone()
            if not row:
                return None
            exp = con.execute(
                "SELECT expires_at FROM sessions WHERE token = ?", (token,)
            ).fetchone()
            if exp:
                try:
                    expires = datetime.fromisoformat(exp["expires_at"])
                    if expires.tzinfo is None:
                        expires = expires.replace(tzinfo=timezone.utc)
                    if expires < datetime.now(timezone.utc):
                        con.execute("DELETE FROM sessions WHERE token = ?", (token,))
                        con.commit()
                        return None
                except Exception:
                    pass
            if row["status"] != "active":
                return None
            return _row_user(row)
        finally:
            con.close()


def list_users_admin() -> list[dict[str, Any]]:
    try:
        from billing import admin_list_users_rich

        return admin_list_users_rich()
    except Exception:
        with _db_lock:
            con = _conn()
            try:
                rows = con.execute(
                    "SELECT id, email, name, role, status, created_at, last_login_at FROM users ORDER BY created_at DESC"
                ).fetchall()
                return [dict(r) for r in rows]
            finally:
                con.close()


# ---------------------------------------------------------------------------
# Quotas (plan-aware + credits)
# ---------------------------------------------------------------------------

def _utc_day_start_ts() -> float:
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.timestamp()


def _seconds_until_reset() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return max(0, int((tomorrow - now).total_seconds()))


async def count_usage_today(user_id: str, action: str) -> int:
    start = _utc_day_start_ts()
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT COUNT(*) AS c FROM usage_events WHERE user_id = ? AND action = ? AND created_at >= ?",
                (user_id, action, start),
            ).fetchone()
            return int(row["c"] if row else 0)
        finally:
            con.close()


async def record_usage(user_id: str, action: str, meta: Optional[dict] = None) -> None:
    import json
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                "INSERT INTO usage_events (user_id, action, created_at, meta) VALUES (?,?,?,?)",
                (user_id, action, time.time(), json.dumps(meta or {})),
            )
            con.commit()
        finally:
            con.close()


def _effective_daily_limits(user: AppUser) -> dict[str, int]:
    """Plan daily limits with promo multiplier. Admin → huge caps."""
    if user.role == "admin":
        return {k: 99999 for k in ("master", "stems", "oracle", "scout", "pitch", "contract")}
    try:
        from billing import effective_plan_for_user, ensure_monthly_grant, active_multiplier

        ensure_monthly_grant(user.id, user.plan_id or "spark", active_multiplier(user.id))
        plan = effective_plan_for_user(user.id)
        daily = dict(plan.get("daily") or {})
        # Keep any legacy keys from DAILY_LIMITS defaults
        for k in DAILY_LIMITS:
            daily.setdefault(k, DAILY_LIMITS[k])
        return {k: int(v) for k, v in daily.items()}
    except Exception:
        return dict(DAILY_LIMITS)


async def get_usage_snapshot(user_id: str, user: Optional[AppUser] = None) -> dict[str, Any]:
    if user is None:
        # minimal shell for limits
        user = AppUser(id=user_id, email="", plan_id="spark")
        try:
            from billing import get_user_plan_id, active_multiplier

            user.plan_id = get_user_plan_id(user_id)
            user.promo_multiplier = active_multiplier(user_id)
        except Exception:
            pass

    limits = _effective_daily_limits(user)
    usage = {}
    for action, limit in limits.items():
        used = await count_usage_today(user_id, action)
        usage[action] = {"used": used, "limit": limit, "remaining": max(0, limit - used)}

    credits = {"balance": 0, "period_grant": 0, "period_key": None}
    promo = None
    plan_id = user.plan_id or "spark"
    try:
        from billing import get_credits_snapshot, get_user_promo, get_user_plan_id, effective_plan_for_user

        credits = get_credits_snapshot(user_id)
        promo = get_user_promo(user_id)
        plan_id = get_user_plan_id(user_id)
        plan = effective_plan_for_user(user_id)
    except Exception:
        plan = {"id": plan_id, "name": plan_id, "monthly_credits": 0, "features": {}, "max_lead_count": 10, "max_scout_cities": 1}

    badge = "Admin" if user.role == "admin" else (plan.get("name") or "Spark")
    if promo:
        badge = f"{badge} · Pilot"

    return {
        "usage": usage,
        "resets_in_seconds": _seconds_until_reset(),
        "limits": limits,
        "credits": credits,
        "promo": promo,
        "plan": {
            "id": plan.get("id") or plan_id,
            "name": plan.get("name") or plan_id,
            "monthly_credits": plan.get("monthly_credits"),
            "max_lead_count": plan.get("max_lead_count"),
            "max_scout_cities": plan.get("max_scout_cities"),
            "features": plan.get("features") or {},
            "concurrent_masters": plan.get("concurrent_masters", 1),
            "max_track_minutes": plan.get("max_track_minutes", 15),
        },
        "plan_id": plan_id,
        "credit_costs": {
            "master": 15,
            "stems": 20,
            "oracle": 5,
            "scout": 8,
            "pitch": 3,
            "contract": 12,
        },
    }


async def assert_quota(user: AppUser, action: str, *, spend: bool = True) -> dict[str, Any]:
    """
    Enforce daily plan limits + credit balance.
    When spend=True (default), deduct credits for the action cost.
    """
    from entitlements import credit_cost, feature_allowed, QUOTA_ACTIONS

    if user.role == "admin":
        return {"admin": True}

    # Feature gates for zero-cap actions
    try:
        from billing import effective_plan_for_user

        plan = effective_plan_for_user(user.id)
    except Exception:
        plan = {"daily": DAILY_LIMITS, "features": {}}

    if action == "stems" and not feature_allowed(plan, "stems"):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "feature_locked",
                "action": action,
                "message": "Stem separation requires Creator or higher.",
                "upgrade_hint": "creator",
            },
        )

    limits = _effective_daily_limits(user)
    if action in limits or action in QUOTA_ACTIONS:
        limit = int(limits.get(action, 0))
        used = await count_usage_today(user.id, action)
        if limit <= 0:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "feature_locked",
                    "action": action,
                    "used": used,
                    "limit": limit,
                    "message": f"{action} is not included on your plan. Upgrade to unlock.",
                    "upgrade_hint": "creator",
                },
            )
        if used >= limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "quota_exceeded",
                    "action": action,
                    "used": used,
                    "limit": limit,
                    "resets_in_seconds": _seconds_until_reset(),
                    "message": (
                        f"Daily limit for {action} reached ({used}/{limit}). "
                        f"Resets in {_seconds_until_reset() // 3600}h — or buy credits / upgrade."
                    ),
                    "upgrade_hint": "pro",
                },
            )
    else:
        used = 0
        limit = limits.get(action, 0)

    cost = credit_cost(action)
    if spend and cost > 0:
        try:
            from billing import spend_credits

            spend_credits(user.id, cost, action, "usage", action)
        except HTTPException:
            raise
        except Exception as e:
            print(f"[QUOTA] credit spend error: {e}")

    return {"used": used, "limit": limit, "remaining": max(0, limit - used - 1), "credits_spent": cost if spend else 0}


def acquire_master_slot(user_id: str, max_concurrent: Optional[int] = None) -> None:
    cap = max_concurrent if max_concurrent is not None else MAX_CONCURRENT_MASTERS
    with _mem_lock:
        if _active_masters[user_id] >= cap:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "concurrent_limit",
                    "message": "Master slot limit reached. Wait for the current job to finish.",
                },
            )
        _active_masters[user_id] += 1


def release_master_slot(user_id: str) -> None:
    with _mem_lock:
        _active_masters[user_id] = max(0, _active_masters[user_id] - 1)


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return authorization.strip()


async def resolve_user(
    authorization: Optional[str] = Header(default=None),
) -> Optional[AppUser]:
    if not auth_required():
        return AppUser(
            id="dev-local",
            email="dev@localhost",
            display_name="Local Dev",
            role="admin",
            status="active",
        )
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Sign in required. Missing session token.")
    user = user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Sign in again.")
    if not user.is_allowed:
        raise HTTPException(status_code=403, detail="Account not allowed.")
    return user


async def require_founding_user(
    authorization: Optional[str] = Header(default=None),
) -> AppUser:
    user = await resolve_user(authorization)
    assert user is not None
    return user
