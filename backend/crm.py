"""
Server-side CRM — leads, pitches, notes, activity in SQLite (same DB as auth).
Free, multi-device if client syncs.
"""

from __future__ import annotations

import json
import secrets
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from simple_auth import DATA_DIR, DB_PATH, _db_lock, _conn

# Reuse auth lock/path so CRM lives next to users.


PIPELINE_STAGES = (
    "scouted",
    "contacted",
    "negotiating",
    "hold",
    "booked",
    "lost",
)


def init_crm_tables() -> None:
    with _db_lock:
        con = _conn()
        try:
            con.executescript(
                """
                CREATE TABLE IF NOT EXISTS crm_leads (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    venue_name TEXT NOT NULL,
                    city TEXT DEFAULT '',
                    stage TEXT NOT NULL DEFAULT 'scouted',
                    reputation_score INTEGER,
                    payout_model TEXT,
                    gross_potential REAL,
                    verified_live INTEGER DEFAULT 0,
                    meta TEXT DEFAULT '{}',
                    added_at REAL NOT NULL,
                    updated_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id, updated_at);

                CREATE TABLE IF NOT EXISTS crm_tasks (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    lead_id TEXT,
                    body TEXT NOT NULL,
                    due_at REAL,
                    done INTEGER DEFAULT 0,
                    created_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON crm_tasks(user_id, due_at);

                CREATE TABLE IF NOT EXISTS crm_pitches (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    lead_id TEXT,
                    venue_name TEXT,
                    outreach TEXT,
                    subject TEXT,
                    body TEXT,
                    created_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_crm_pitches_user ON crm_pitches(user_id, created_at);

                CREATE TABLE IF NOT EXISTS crm_notes (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    lead_id TEXT,
                    body TEXT NOT NULL,
                    created_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS crm_activity (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    label TEXT NOT NULL,
                    accent TEXT,
                    created_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_crm_activity_user ON crm_activity(user_id, created_at);

                CREATE TABLE IF NOT EXISTS password_resets (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    expires_at REAL NOT NULL,
                    used INTEGER DEFAULT 0
                );
                """
            )
            # Migrate lead columns on existing DBs
            existing = {r[1] for r in con.execute("PRAGMA table_info(crm_leads)").fetchall()}
            for col, decl in (
                ("contact_name", "TEXT DEFAULT ''"),
                ("contact_email", "TEXT DEFAULT ''"),
                ("contact_phone", "TEXT DEFAULT ''"),
                ("next_action_at", "REAL"),
                ("note", "TEXT DEFAULT ''"),
            ):
                if col not in existing:
                    con.execute(f"ALTER TABLE crm_leads ADD COLUMN {col} {decl}")
            con.commit()
        finally:
            con.close()


def _now() -> float:
    return datetime.now(timezone.utc).timestamp()


def list_leads(user_id: str) -> list[dict]:
    with _db_lock:
        con = _conn()
        try:
            rows = con.execute(
                "SELECT * FROM crm_leads WHERE user_id = ? ORDER BY updated_at DESC",
                (user_id,),
            ).fetchall()
            return [_lead(r) for r in rows]
        finally:
            con.close()


def upsert_lead(user_id: str, lead: dict) -> dict:
    now = _now()
    lid = lead.get("id") or secrets.token_hex(8)
    stage = (lead.get("stage") or "scouted").strip().lower()
    if stage not in PIPELINE_STAGES:
        stage = "scouted"
    contact_name = lead.get("contactName") or lead.get("contact_name") or ""
    contact_email = lead.get("contactEmail") or lead.get("contact_email") or ""
    contact_phone = lead.get("contactPhone") or lead.get("contact_phone") or ""
    note = lead.get("note") or ""
    next_action = lead.get("nextActionAt") if lead.get("nextActionAt") is not None else lead.get("next_action_at")
    with _db_lock:
        con = _conn()
        try:
            existing = con.execute(
                "SELECT id FROM crm_leads WHERE id = ? AND user_id = ?", (lid, user_id)
            ).fetchone()
            meta = lead.get("meta") if isinstance(lead.get("meta"), str) else json.dumps(lead.get("meta") or {})
            if existing:
                con.execute(
                    """
                    UPDATE crm_leads SET venue_name=?, city=?, stage=?, reputation_score=?,
                    payout_model=?, gross_potential=?, verified_live=?, meta=?, updated_at=?,
                    contact_name=?, contact_email=?, contact_phone=?, next_action_at=?, note=?
                    WHERE id=? AND user_id=?
                    """,
                    (
                        lead.get("venueName") or lead.get("venue_name") or "",
                        lead.get("city") or "",
                        stage,
                        lead.get("reputationScore") if lead.get("reputationScore") is not None else lead.get("reputation_score"),
                        lead.get("payoutModel") or lead.get("payout_model"),
                        lead.get("grossPotential") if lead.get("grossPotential") is not None else lead.get("gross_potential"),
                        1 if lead.get("verifiedLive") or lead.get("verified_live") else 0,
                        meta,
                        now,
                        contact_name,
                        contact_email,
                        contact_phone,
                        next_action,
                        note,
                        lid,
                        user_id,
                    ),
                )
            else:
                con.execute(
                    """
                    INSERT INTO crm_leads
                    (id, user_id, venue_name, city, stage, reputation_score, payout_model,
                     gross_potential, verified_live, meta, added_at, updated_at,
                     contact_name, contact_email, contact_phone, next_action_at, note)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """,
                    (
                        lid,
                        user_id,
                        lead.get("venueName") or lead.get("venue_name") or "Unknown",
                        lead.get("city") or "",
                        stage,
                        lead.get("reputationScore") if lead.get("reputationScore") is not None else lead.get("reputation_score"),
                        lead.get("payoutModel") or lead.get("payout_model"),
                        lead.get("grossPotential") if lead.get("grossPotential") is not None else lead.get("gross_potential"),
                        1 if lead.get("verifiedLive") or lead.get("verified_live") else 0,
                        meta,
                        lead.get("addedAt") or lead.get("added_at") or now,
                        now,
                        contact_name,
                        contact_email,
                        contact_phone,
                        next_action,
                        note,
                    ),
                )
            con.commit()
            row = con.execute("SELECT * FROM crm_leads WHERE id = ?", (lid,)).fetchone()
            return _lead(row)
        finally:
            con.close()


def bulk_upsert_leads(user_id: str, leads: list[dict]) -> list[dict]:
    return [upsert_lead(user_id, l) for l in (leads or [])]


def move_lead(user_id: str, lead_id: str, stage: str) -> Optional[dict]:
    stage = (stage or "scouted").strip().lower()
    if stage not in PIPELINE_STAGES:
        stage = "scouted"
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                "UPDATE crm_leads SET stage = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (stage, _now(), lead_id, user_id),
            )
            con.commit()
            row = con.execute(
                "SELECT * FROM crm_leads WHERE id = ? AND user_id = ?", (lead_id, user_id)
            ).fetchone()
            return _lead(row) if row else None
        finally:
            con.close()


def count_leads(user_id: str) -> int:
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT COUNT(*) AS c FROM crm_leads WHERE user_id = ?", (user_id,)
            ).fetchone()
            return int(row["c"] if row else 0)
        finally:
            con.close()


def list_tasks(user_id: str, include_done: bool = False) -> list[dict]:
    with _db_lock:
        con = _conn()
        try:
            if include_done:
                rows = con.execute(
                    "SELECT * FROM crm_tasks WHERE user_id = ? ORDER BY done ASC, due_at ASC, created_at DESC",
                    (user_id,),
                ).fetchall()
            else:
                rows = con.execute(
                    "SELECT * FROM crm_tasks WHERE user_id = ? AND done = 0 ORDER BY due_at ASC, created_at DESC",
                    (user_id,),
                ).fetchall()
            return [_task(r) for r in rows]
        finally:
            con.close()


def add_task(user_id: str, body: str, lead_id: str | None = None, due_at: float | None = None) -> dict:
    tid = secrets.token_hex(8)
    now = _now()
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                """
                INSERT INTO crm_tasks (id, user_id, lead_id, body, due_at, done, created_at)
                VALUES (?,?,?,?,?,0,?)
                """,
                (tid, user_id, lead_id, (body or "").strip(), due_at, now),
            )
            con.commit()
        finally:
            con.close()
    return {"id": tid, "body": body, "lead_id": lead_id, "due_at": due_at, "done": False, "created_at": now}


def set_task_done(user_id: str, task_id: str, done: bool = True) -> bool:
    with _db_lock:
        con = _conn()
        try:
            cur = con.execute(
                "UPDATE crm_tasks SET done = ? WHERE id = ? AND user_id = ?",
                (1 if done else 0, task_id, user_id),
            )
            con.commit()
            return cur.rowcount > 0
        finally:
            con.close()


def _task(r: sqlite3.Row) -> dict:
    return {
        "id": r["id"],
        "lead_id": r["lead_id"],
        "body": r["body"],
        "due_at": r["due_at"],
        "done": bool(r["done"]),
        "created_at": r["created_at"],
    }


def delete_lead(user_id: str, lead_id: str) -> bool:
    with _db_lock:
        con = _conn()
        try:
            cur = con.execute(
                "DELETE FROM crm_leads WHERE id = ? AND user_id = ?", (lead_id, user_id)
            )
            con.commit()
            return cur.rowcount > 0
        finally:
            con.close()


def add_pitch(user_id: str, pitch: dict) -> dict:
    pid = secrets.token_hex(8)
    now = _now()
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                """
                INSERT INTO crm_pitches (id, user_id, lead_id, venue_name, outreach, subject, body, created_at)
                VALUES (?,?,?,?,?,?,?,?)
                """,
                (
                    pid,
                    user_id,
                    pitch.get("lead_id") or pitch.get("leadId"),
                    pitch.get("venue_name") or pitch.get("venueName"),
                    pitch.get("outreach"),
                    pitch.get("subject"),
                    pitch.get("body"),
                    now,
                ),
            )
            con.commit()
        finally:
            con.close()
    return {"id": pid, "created_at": now, **pitch}


def list_pitches(user_id: str, limit: int = 50) -> list[dict]:
    with _db_lock:
        con = _conn()
        try:
            rows = con.execute(
                "SELECT * FROM crm_pitches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            con.close()


def add_activity(user_id: str, kind: str, label: str, accent: str | None = None) -> dict:
    aid = secrets.token_hex(8)
    now = _now()
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                "INSERT INTO crm_activity (id, user_id, kind, label, accent, created_at) VALUES (?,?,?,?,?,?)",
                (aid, user_id, kind, label, accent, now),
            )
            # Cap 100
            con.execute(
                """
                DELETE FROM crm_activity WHERE user_id = ? AND id NOT IN (
                    SELECT id FROM crm_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
                )
                """,
                (user_id, user_id),
            )
            con.commit()
        finally:
            con.close()
    return {"id": aid, "kind": kind, "label": label, "accent": accent, "ts": int(now * 1000)}


def list_activity(user_id: str, limit: int = 50) -> list[dict]:
    with _db_lock:
        con = _conn()
        try:
            rows = con.execute(
                "SELECT * FROM crm_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
            return [
                {
                    "id": r["id"],
                    "kind": r["kind"],
                    "label": r["label"],
                    "accent": r["accent"],
                    "ts": int(r["created_at"] * 1000),
                }
                for r in rows
            ]
        finally:
            con.close()


def export_all(user_id: str) -> dict:
    return {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "leads": list_leads(user_id),
        "pitches": list_pitches(user_id),
        "activity": list_activity(user_id),
    }


def import_all(user_id: str, payload: dict) -> dict:
    leads = payload.get("leads") or []
    pitches = payload.get("pitches") or []
    n_leads = len(bulk_upsert_leads(user_id, leads))
    n_pitches = 0
    for p in pitches:
        add_pitch(user_id, p)
        n_pitches += 1
    return {"imported_leads": n_leads, "imported_pitches": n_pitches}


def _lead(r: sqlite3.Row) -> dict:
    if not r:
        return {}
    keys = set(r.keys()) if hasattr(r, "keys") else set()

    def g(k, default=None):
        if k not in keys:
            return default
        return r[k] if r[k] is not None else default

    return {
        "id": r["id"],
        "venueName": r["venue_name"],
        "city": r["city"] or "",
        "stage": r["stage"],
        "reputationScore": r["reputation_score"],
        "payoutModel": r["payout_model"],
        "grossPotential": r["gross_potential"],
        "verifiedLive": bool(r["verified_live"]),
        "addedAt": int((r["added_at"] or 0) * 1000) if r["added_at"] and r["added_at"] < 1e12 else int(r["added_at"] or 0),
        "updatedAt": int((r["updated_at"] or 0) * 1000) if r["updated_at"] and r["updated_at"] < 1e12 else int(r["updated_at"] or 0),
        "meta": json.loads(r["meta"] or "{}"),
        "contactName": g("contact_name") or "",
        "contactEmail": g("contact_email") or "",
        "contactPhone": g("contact_phone") or "",
        "nextActionAt": g("next_action_at"),
        "note": g("note") or "",
    }


# ---- password reset helpers (free / no SMTP required for beta) ----

def create_reset_token(email: str) -> Optional[dict]:
    from simple_auth import _conn, _db_lock

    email = (email or "").strip().lower()
    with _db_lock:
        con = _conn()
        try:
            row = con.execute("SELECT id, email FROM users WHERE email = ?", (email,)).fetchone()
            if not row:
                return None
            token = secrets.token_urlsafe(24)
            code = f"{secrets.randbelow(10**6):06d}"
            now = _now()
            # store both: token and code in token field as code|token for simple verify
            stored = f"{code}:{token}"
            con.execute(
                "INSERT INTO password_resets (token, user_id, created_at, expires_at, used) VALUES (?,?,?,?,0)",
                (stored, row["id"], now, now + 3600),
            )
            con.commit()
            return {"email": email, "code": code, "token": token, "expires_in_sec": 3600}
        finally:
            con.close()


def reset_password_with_code(email: str, code: str, new_password: str) -> bool:
    from simple_auth import _conn, _db_lock, _hash_password

    email = (email or "").strip().lower()
    code = (code or "").strip()
    if len(new_password or "") < 6:
        raise ValueError("Password must be at least 6 characters.")
    now = _now()
    with _db_lock:
        con = _conn()
        try:
            user = con.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if not user:
                return False
            rows = con.execute(
                "SELECT * FROM password_resets WHERE user_id = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC",
                (user["id"], now),
            ).fetchall()
            match = None
            for r in rows:
                stored = r["token"] or ""
                if stored.startswith(f"{code}:"):
                    match = r
                    break
            if not match:
                return False
            con.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (_hash_password(new_password), user["id"]),
            )
            con.execute("UPDATE password_resets SET used = 1 WHERE token = ?", (match["token"],))
            con.commit()
            return True
        finally:
            con.close()
