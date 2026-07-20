"""
Supabase Auth bridge — verify Google (or any) Supabase session and map to Engine user.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx
from fastapi import HTTPException


def supabase_configured() -> bool:
    url = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").strip()
    key = (
        os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or ""
    ).strip()
    return bool(url and key)


def supabase_url() -> str:
    return (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")


def supabase_key() -> str:
    # Prefer service role for server-side user lookup if present; anon also works with user JWT
    return (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or ""
    ).strip()


async def fetch_supabase_user(access_token: str) -> dict[str, Any]:
    """
    Validate a Supabase access_token by calling Auth /user.
    Works for Google OAuth sessions created in the Supabase project.
    """
    token = (access_token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Missing Supabase access token.")
    if not supabase_configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SERVICE_ROLE_KEY).",
        )

    url = f"{supabase_url()}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": supabase_key(),
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(url, headers=headers)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Supabase unreachable: {e}")

    if res.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase session. Sign in again.")
    if res.status_code >= 400:
        raise HTTPException(status_code=401, detail=f"Supabase auth failed ({res.status_code}).")

    data = res.json()
    email = (data.get("email") or "").strip().lower()
    if not email:
        # Some identities put email under user_metadata
        meta = data.get("user_metadata") or {}
        email = (meta.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Supabase user has no email.")

    meta = data.get("user_metadata") or {}
    name = (
        meta.get("full_name")
        or meta.get("name")
        or meta.get("preferred_username")
        or email.split("@")[0]
    )
    avatar = meta.get("avatar_url") or meta.get("picture") or ""
    return {
        "id": data.get("id"),
        "email": email,
        "name": name,
        "avatar_url": avatar,
        "provider": (data.get("app_metadata") or {}).get("provider") or "supabase",
        "raw": data,
    }


async def optional_sync_app_user_row(user: dict[str, Any], plan_id: str = "spark") -> None:
    """
    Best-effort upsert into public.app_users when service role is available.
    Does not fail the login if Supabase table is missing or RLS blocks.
    """
    service = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not service or not supabase_url():
        return
    uid = user.get("id")
    if not uid:
        return
    payload = {
        "id": uid,
        "email": user["email"],
        "display_name": user.get("name") or "",
        "avatar_url": user.get("avatar_url") or "",
        "role": "founding_member",
        "status": "active",
        "last_seen_at": "now()",
    }
    # PostgREST upsert
    url = f"{supabase_url()}/rest/v1/app_users"
    headers = {
        "apikey": service,
        "Authorization": f"Bearer {service}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    # last_seen_at as now() won't work as string — use ISO from client
    from datetime import datetime, timezone

    body = {
        "id": uid,
        "email": user["email"],
        "display_name": user.get("name") or "",
        "avatar_url": user.get("avatar_url") or "",
        "role": "founding_member",
        "status": "active",
        "last_seen_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(url, headers=headers, json=body)
    except Exception as e:
        print(f"[SUPABASE] app_users sync skipped: {e}")
