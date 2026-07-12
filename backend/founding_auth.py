"""
Clerk auth + fair-use quotas.

- Quick Google (or email) sign-in via Clerk — session remembered in the browser.
- Optional FOUNDING_EMAILS allowlist; if empty, any signed-in user is allowed.
- Daily quotas in memory (single Render dyno) with optional Supabase usage log.
"""

from __future__ import annotations

import os
import time
import threading
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from collections import defaultdict

import httpx
from fastapi import Header, HTTPException

# ---------------------------------------------------------------------------
# Daily fair-use caps
# ---------------------------------------------------------------------------

DAILY_LIMITS: dict[str, int] = {
    "master": int(os.getenv("QUOTA_MASTER_DAY", "15")),
    "scout": int(os.getenv("QUOTA_SCOUT_DAY", "15")),
    "pitch": int(os.getenv("QUOTA_PITCH_DAY", "40")),
    "contract": int(os.getenv("QUOTA_CONTRACT_DAY", "15")),
    "oracle": int(os.getenv("QUOTA_ORACLE_DAY", "20")),
    "stems": int(os.getenv("QUOTA_STEMS_DAY", "10")),
}

MAX_CONCURRENT_MASTERS = int(os.getenv("QUOTA_MASTER_CONCURRENT", "1"))

_jwks_client = None
_jwks_lock = threading.Lock()


def auth_configured() -> bool:
    """Clerk is ready when publishable key exists on FE and secret/issuer on BE."""
    return bool(
        os.getenv("CLERK_SECRET_KEY", "").strip()
        or os.getenv("CLERK_JWT_ISSUER", "").strip()
        or os.getenv("CLERK_FRONTEND_API", "").strip()
    )


def auth_required() -> bool:
    flag = os.getenv("AUTH_REQUIRED", "").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return False
    if flag in ("1", "true", "yes", "on"):
        return True
    return auth_configured()


def _env_allowlist() -> set[str]:
    raw = os.getenv("FOUNDING_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _clerk_issuer() -> str:
    """e.g. https://verb-noun-00.clerk.accounts.dev"""
    issuer = os.getenv("CLERK_JWT_ISSUER", "").strip().rstrip("/")
    if issuer:
        return issuer
    front = os.getenv("CLERK_FRONTEND_API", "").strip().rstrip("/")
    if front:
        if front.startswith("http"):
            return front
        return f"https://{front}"
    # Derive from publishable key is not reliable server-side; require env.
    return ""


@dataclass
class AppUser:
    id: str
    email: str
    display_name: str = ""
    avatar_url: str = ""
    role: str = "founding_member"
    status: str = "active"

    @property
    def is_allowed(self) -> bool:
        return self.status == "active" and self.role in ("founding_member", "admin")


_mem_usage: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
_mem_lock = threading.Lock()
_active_masters: dict[str, int] = defaultdict(int)


def _utc_day_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _seconds_until_reset() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = _utc_day_start() + timedelta(days=1)
    return max(0, int((tomorrow - now).total_seconds()))


def _get_jwks_client():
    global _jwks_client
    with _jwks_lock:
        if _jwks_client is not None:
            return _jwks_client
        try:
            from jwt import PyJWKClient
        except ImportError as e:
            raise HTTPException(status_code=500, detail="PyJWT not installed.") from e
        issuer = _clerk_issuer()
        if not issuer:
            raise HTTPException(
                status_code=500,
                detail="Set CLERK_JWT_ISSUER (e.g. https://xxx.clerk.accounts.dev) on the backend.",
            )
        _jwks_client = PyJWKClient(f"{issuer}/.well-known/jwks.json")
        return _jwks_client


def verify_clerk_jwt(token: str) -> dict[str, Any]:
    try:
        import jwt
    except ImportError as e:
        raise HTTPException(status_code=500, detail="PyJWT not installed.") from e

    issuer = _clerk_issuer()
    try:
        jwks = _get_jwks_client()
        key = jwks.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            key.key,
            algorithms=["RS256"],
            options={"require": ["exp", "sub"]},
            # Clerk issuer can vary slightly; validate if we have one
            issuer=issuer if issuer else None,
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Session expired. Sign in again.") from e
    except Exception as e:
        # Retry without issuer pin (some Clerk templates use slightly different iss)
        try:
            import jwt as jwt2
            jwks = _get_jwks_client()
            key = jwks.get_signing_key_from_jwt(token)
            return jwt2.decode(
                token,
                key.key,
                algorithms=["RS256"],
                options={"require": ["exp", "sub"], "verify_iss": False},
            )
        except Exception as e2:
            raise HTTPException(status_code=401, detail=f"Invalid session token: {e2}") from e2


def _claims_to_user(claims: dict[str, Any]) -> AppUser:
    uid = str(claims.get("sub") or "")
    # Clerk session tokens often put email in these places
    email = (
        claims.get("email")
        or (claims.get("primary_email_address") or "")
        or ""
    )
    if not email and isinstance(claims.get("email_addresses"), list) and claims["email_addresses"]:
        email = claims["email_addresses"][0]
    email = str(email).strip().lower()

    # Prefer richer fields if present on JWT template
    display = (
        claims.get("name")
        or claims.get("full_name")
        or " ".join(
            x for x in [claims.get("first_name") or "", claims.get("last_name") or ""] if x
        ).strip()
        or email
        or "Member"
    )
    avatar = str(claims.get("image_url") or claims.get("picture") or "")

    if not uid:
        raise HTTPException(status_code=401, detail="Token missing user id.")

    allow = _env_allowlist()
    admins = _admin_emails()
    if email and email in admins:
        role = "admin"
    elif not allow:
        # No allowlist configured → any signed-in user is welcome (quick beta)
        role = "founding_member"
    elif email and email in allow:
        role = "founding_member"
    else:
        role = "waitlisted"

    return AppUser(
        id=uid,
        email=email or f"{uid}@clerk.user",
        display_name=str(display),
        avatar_url=avatar,
        role=role,
        status="active",
    )


async def _fetch_clerk_user(user_id: str) -> dict[str, Any]:
    """Enrich email/name from Clerk Backend API when JWT is sparse."""
    secret = os.getenv("CLERK_SECRET_KEY", "").strip()
    if not secret or not user_id:
        return {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {secret}"},
            )
            if r.status_code >= 400:
                return {}
            return r.json()
    except Exception:
        return {}


async def resolve_user_from_token(token: str) -> AppUser:
    claims = verify_clerk_jwt(token)
    user = _claims_to_user(claims)

    # If email missing or generic, pull from Clerk API
    if not user.email or user.email.endswith("@clerk.user") or not user.display_name:
        data = await _fetch_clerk_user(user.id)
        if data:
            emails = data.get("email_addresses") or []
            primary = data.get("primary_email_address_id")
            email = ""
            for e in emails:
                if e.get("id") == primary or not email:
                    email = (e.get("email_address") or "").lower()
            first = data.get("first_name") or ""
            last = data.get("last_name") or ""
            name = f"{first} {last}".strip() or data.get("username") or email
            image = data.get("image_url") or ""
            if email:
                user.email = email
            if name:
                user.display_name = name
            if image:
                user.avatar_url = image
            # Recompute role with real email
            user = AppUser(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                avatar_url=user.avatar_url,
                role=_claims_to_user({
                    "sub": user.id,
                    "email": user.email,
                    "name": user.display_name,
                    "image_url": user.avatar_url,
                }).role,
                status="active",
            )
    return user


# Optional Supabase usage persistence (if you already set those keys)
def _supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").rstrip("/")


def _service_key() -> str:
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()


async def _sb_headers() -> dict[str, str]:
    key = _service_key()
    if not key or not _supabase_url():
        return {}
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def _sb_get(path: str, params: Optional[dict] = None) -> Any:
    headers = await _sb_headers()
    if not headers:
        return None
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.get(f"{_supabase_url()}/rest/v1/{path}", headers=headers, params=params or {})
        if r.status_code >= 400:
            return None
        return r.json()


async def _sb_post(path: str, body: Any) -> Any:
    headers = await _sb_headers()
    if not headers:
        return None
    async with httpx.AsyncClient(timeout=12.0) as client:
        r = await client.post(f"{_supabase_url()}/rest/v1/{path}", headers=headers, json=body)
        if r.status_code >= 400:
            return None
        return r.json() if r.content else []


def _mem_count_today(user_id: str, action: str) -> int:
    day_start = _utc_day_start().timestamp()
    with _mem_lock:
        events = _mem_usage[user_id][action]
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
    # Always record in memory so quotas work without Supabase
    _mem_record(user_id, action)
    # Best-effort remote log (needs app_users row FK — skip if it fails)
    await _sb_post(
        "usage_events",
        {"user_id": user_id, "action": action, "meta": meta or {}},
    )


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
                    f"Daily limit for {action} reached ({used}/{limit}). "
                    f"Resets in {_seconds_until_reset() // 3600}h."
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
                    "message": "One master at a time. Wait for the current job to finish.",
                },
            )
        _active_masters[user_id] += 1


def release_master_slot(user_id: str) -> None:
    with _mem_lock:
        _active_masters[user_id] = max(0, _active_masters[user_id] - 1)


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

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Sign in to use the Engine. Missing Authorization bearer token.",
        )
    token = authorization.split(" ", 1)[1].strip()
    user = await resolve_user_from_token(token)
    if user.role == "suspended" or user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended.")
    if not user.is_allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "not_founding_member",
                "message": (
                    "You're signed in, but this email isn't on the founding list. "
                    "Ask the team to add you, or clear FOUNDING_EMAILS to allow all sign-ins."
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
