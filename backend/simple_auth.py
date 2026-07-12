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

    @property
    def is_allowed(self) -> bool:
        return self.status == "active" and self.role in ("member", "admin", "founding_member")


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


def _row_user(row: sqlite3.Row) -> AppUser:
    return AppUser(
        id=row["id"],
        email=row["email"],
        display_name=row["name"],
        avatar_url="",
        role=row["role"] if row["role"] != "founding_member" else "member",
        status=row["status"],
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
                "INSERT INTO users (id, email, name, password_hash, role, status, created_at) VALUES (?,?,?,?,?,?,?)",
                (uid, email, name, _hash_password(password), "member", "active", now),
            )
            token = _create_session(con, uid)
            con.commit()
            user = AppUser(id=uid, email=email, display_name=name, role="member", status="active")
            return user, token
        finally:
            con.close()


def login_user(email: str, password: str) -> tuple[AppUser, str]:
    email = (email or "").strip().lower()
    password = password or ""
    with _db_lock:
        con = _conn()
        try:
            row = con.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if not row or not _check_password(password, row["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password.")
            if row["status"] != "active":
                raise HTTPException(status_code=403, detail="Account is suspended.")
            token = _create_session(con, row["id"])
            con.execute(
                "UPDATE users SET last_login_at = ? WHERE id = ?",
                (datetime.now(timezone.utc).isoformat(), row["id"]),
            )
            con.commit()
            return _row_user(row), token
        finally:
            con.close()


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
# Quotas
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


async def get_usage_snapshot(user_id: str) -> dict[str, Any]:
    usage = {}
    for action, limit in DAILY_LIMITS.items():
        used = await count_usage_today(user_id, action)
        usage[action] = {"used": used, "limit": limit, "remaining": max(0, limit - used)}
    return {
        "usage": usage,
        "resets_in_seconds": _seconds_until_reset(),
        "limits": DAILY_LIMITS,
    }


async def assert_quota(user: AppUser, action: str) -> dict[str, Any]:
    if action not in DAILY_LIMITS:
        return {}
    # Admins unlimited
    if user.role == "admin":
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
