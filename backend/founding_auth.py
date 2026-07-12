"""
Founding Cohort auth + fair-use quotas.

Google identity via Supabase Auth (JWT).
Allowlist: founding_allowlist table AND/OR FOUNDING_EMAILS env.
Quotas: daily counters in usage_events (Supabase) with in-memory fallback.
"""

from __future__ import annotations

import os
import time
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional
from collections import defaultdict

import httpx
from fastapi import Header, HTTPException, Request

# ---------------------------------------------------------------------------
# Daily fair-use caps (founding beta)
# ---------------------------------------------------------------------------

DAILY_LIMITS: dict[str, int] = {
    "master": int(os.getenv("QUOTA_MASTER_DAY", "15")),
    "scout": int(os.getenv("QUOTA_SCOUT_DAY", "15")),
    "pitch": int(os.getenv("QUOTA_PITCH_DAY", "40")),
    "contract": int(os.getenv("QUOTA_CONTRACT_DAY", "15")),
    "oracle": int(os.getenv("QUOTA_ORACLE_DAY", "20")),
    "stems": int(os.getenv("QUOTA_STEMS_DAY", "10")),
}

# Concurrent mastering jobs per user (process-local; good enough on one Render dyno)
MAX_CONCURRENT_MASTERS = int(os.getenv("QUOTA_MASTER_CONCURRENT", "1"))


def auth_configured() -> bool:
    return bool(
        os.getenv("SUPABASE_URL", "").strip()
        and os.getenv("SUPABASE_JWT_SECRET", "").strip()
    )


def auth_required() -> bool:
    """When true, unauthenticated calls to protected routes are rejected.

    Defaults to ON when Supabase is configured; set AUTH_REQUIRED=0 for local open dev.
    """
    flag = os.getenv("AUTH_REQUIRED", "").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return False
    if flag in ("1", "true", "yes", "on"):
        return True
    return auth_configured()


def _supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").rstrip("/")


def _service_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()


def _jwt_secret() -> str:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip()


def _env_allowlist() -> set[str]:
    raw = os.getenv("FOUNDING_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


@dataclass
class AppUser:
    id: str
    email: str
    display_name: str = ""
    avatar_url: str = ""
    role: str = "waitlisted"  # founding_member | waitlisted | admin | suspended
    status: str = "active"

    @property
    def is_allowed(self) -> bool:
        return self.status == "active" and self.role in ("founding_member", "admin")


# In-memory usage fallback (and concurrent locks) when Supabase REST is unavailable
_mem_usage: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
_mem_lock = threading.Lock()
_active_masters: dict[str, int] = defaultdict(int)


def _utc_day_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _seconds_until_reset() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0)
    from datetime import timedelta
    tomorrow = tomorrow + timedelta(days=1)
    return max(0, int((tomorrow - now).total_seconds()))


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """Validate Supabase access token (HS256 with JWT secret)."""
    try:
        import jwt  # PyJWT
    except ImportError as e:
        raise HTTPException(status_code=500, detail="PyJWT not installed on server.") from e

    secret = _jwt_secret()
    if not secret:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET is not configured.")

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid session token: {e}") from e


async def _sb_headers() -> dict[str, str]:
    key = _service_key()
    if not key:
        return {}
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def _sb_get(path: str, params: Optional[dict] = None) -> Any:
    url = f"{_supabase_url()}/rest/v1/{path}"
    headers = await _sb_headers()
    if not headers:
        return None
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.get(url, headers=headers, params=params or {})
        if r.status_code >= 400:
            print(f"[AUTH] Supabase GET {path} -> {r.status_code} {r.text[:200]}")
            return None
        return r.json()


async def _sb_post(path: str, body: Any, prefer: str = "return=representation") -> Any:
    url = f"{_supabase_url()}/rest/v1/{path}"
    headers = await _sb_headers()
    if not headers:
        return None
    headers = {**headers, "Prefer": prefer}
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.post(url, headers=headers, json=body)
        if r.status_code >= 400:
            print(f"[AUTH] Supabase POST {path} -> {r.status_code} {r.text[:200]}")
            return None
        if not r.content:
            return []
        return r.json()


async def _sb_patch(path: str, body: Any, params: Optional[dict] = None) -> Any:
    url = f"{_supabase_url()}/rest/v1/{path}"
    headers = await _sb_headers()
    if not headers:
        return None
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.patch(url, headers=headers, params=params or {}, json=body)
        if r.status_code >= 400:
            print(f"[AUTH] Supabase PATCH {path} -> {r.status_code} {r.text[:200]}")
            return None
        return r.json() if r.content else []


async def email_on_allowlist(email: str) -> bool:
    email = (email or "").strip().lower()
    if not email:
        return False
    if email in _env_allowlist() or email in _admin_emails():
        return True
    rows = await _sb_get(
        "founding_allowlist",
        params={"email": f"eq.{email}", "select": "email"},
    )
    return bool(rows)


async def upsert_app_user(claims: dict[str, Any]) -> AppUser:
    uid = str(claims.get("sub") or "")
    email = (claims.get("email") or "").strip().lower()
    meta = claims.get("user_metadata") or {}
    if isinstance(meta, str):
        meta = {}
    display = (meta.get("full_name") or meta.get("name") or claims.get("email") or "").strip()
    avatar = (meta.get("avatar_url") or meta.get("picture") or "").strip()

    if not uid or not email:
        raise HTTPException(status_code=401, detail="Token missing user identity.")

    is_admin = email in _admin_emails()
    allowed = is_admin or await email_on_allowlist(email)
    role = "admin" if is_admin else ("founding_member" if allowed else "waitlisted")

    # Prefer existing row (preserve suspended)
    existing = await _sb_get(
        "app_users",
        params={"id": f"eq.{uid}", "select": "*"},
    )
    if existing and isinstance(existing, list) and existing:
        row = existing[0]
        # Don't upgrade suspended via allowlist automatically
        if row.get("status") == "suspended" or row.get("role") == "suspended":
            return AppUser(
                id=uid,
                email=email,
                display_name=row.get("display_name") or display,
                avatar_url=row.get("avatar_url") or avatar,
                role="suspended",
                status="suspended",
            )
        # Refresh role if allowlist changed (except admin stays admin)
        new_role = role if role == "admin" else (
            "founding_member" if allowed else "waitlisted"
        )
        await _sb_patch(
            "app_users",
            {
                "email": email,
                "display_name": display or row.get("display_name"),
                "avatar_url": avatar or row.get("avatar_url"),
                "role": new_role,
                "status": "active",
                "last_seen_at": datetime.now(timezone.utc).isoformat(),
            },
            params={"id": f"eq.{uid}"},
        )
        return AppUser(
            id=uid,
            email=email,
            display_name=display or row.get("display_name") or "",
            avatar_url=avatar or row.get("avatar_url") or "",
            role=new_role,
            status="active",
        )

    # Insert new
    await _sb_post(
        "app_users",
        {
            "id": uid,
            "email": email,
            "display_name": display,
            "avatar_url": avatar,
            "role": role,
            "status": "active",
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
        },
        prefer="resolution=merge-duplicates,return=representation",
    )
    return AppUser(
        id=uid,
        email=email,
        display_name=display,
        avatar_url=avatar,
        role=role,
        status="active",
    )


def _mem_count_today(user_id: str, action: str) -> int:
    day_start = _utc_day_start().timestamp()
    with _mem_lock:
        events = _mem_usage[user_id][action]
        # prune
        events[:] = [t for t in events if t >= day_start]
        return len(events)


def _mem_record(user_id: str, action: str) -> None:
    with _mem_lock:
        _mem_usage[user_id][action].append(time.time())


async def count_usage_today(user_id: str, action: str) -> int:
    day_start = _utc_day_start().isoformat()
    rows = await _sb_get(
        "usage_events",
        params={
            "user_id": f"eq.{user_id}",
            "action": f"eq.{action}",
            "created_at": f"gte.{day_start}",
            "select": "id",
        },
    )
    if rows is None:
        return _mem_count_today(user_id, action)
    return len(rows) if isinstance(rows, list) else 0


async def record_usage(user_id: str, action: str, meta: Optional[dict] = None) -> None:
    body = {
        "user_id": user_id,
        "action": action,
        "meta": meta or {},
    }
    result = await _sb_post("usage_events", body)
    if result is None:
        _mem_record(user_id, action)


async def get_usage_snapshot(user_id: str) -> dict[str, Any]:
    usage = {}
    for action, limit in DAILY_LIMITS.items():
        used = await count_usage_today(user_id, action)
        usage[action] = {
            "used": used,
            "limit": limit,
            "remaining": max(0, limit - used),
        }
    return {
        "usage": usage,
        "resets_in_seconds": _seconds_until_reset(),
        "limits": DAILY_LIMITS,
    }


async def assert_quota(user: AppUser, action: str) -> dict[str, Any]:
    if action not in DAILY_LIMITS:
        return {}
    used = await count_usage_today(user.id, action)
    limit = DAILY_LIMITS[action]
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
                    f"Founding plan daily limit reached for {action} "
                    f"({used}/{limit}). Resets in {_seconds_until_reset() // 3600}h."
                ),
            },
        )
    return {"used": used, "limit": limit, "remaining": limit - used}


def acquire_master_slot(user_id: str) -> None:
    with _mem_lock:
        if _active_masters[user_id] >= MAX_CONCURRENT_MASTERS:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "concurrent_limit",
                    "message": "One master at a time on the founding plan. Wait for the current job to finish.",
                },
            )
        _active_masters[user_id] += 1


def release_master_slot(user_id: str) -> None:
    with _mem_lock:
        _active_masters[user_id] = max(0, _active_masters[user_id] - 1)


async def resolve_user(
    authorization: Optional[str] = Header(default=None),
) -> Optional[AppUser]:
    """FastAPI dependency: returns user or None if auth disabled."""
    if not auth_required():
        return AppUser(
            id="dev-local",
            email="dev@localhost",
            display_name="Local Dev",
            role="admin",
            status="active",
        )

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Sign in with Google to use the Engine. Missing Authorization bearer token.",
        )
    token = authorization.split(" ", 1)[1].strip()
    claims = verify_supabase_jwt(token)
    user = await upsert_app_user(claims)
    if user.role == "suspended" or user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Contact the Engine team.")
    if not user.is_allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "not_founding_member",
                "message": (
                    "You're signed in, but not on the Founding Member list yet. "
                    "Ask for an invite — this cohort is capped at 50 DJs."
                ),
                "email": user.email,
            },
        )
    return user


async def require_founding_user(
    authorization: Optional[str] = Header(default=None),
) -> AppUser:
    user = await resolve_user(authorization)
    assert user is not None
    return user
