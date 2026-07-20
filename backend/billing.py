"""
Credits, promo codes, and Stripe billing helpers.
Lives in the same SQLite DB as auth (simple_auth).
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from fastapi import HTTPException

from simple_auth import _conn, _db_lock, DATA_DIR
from entitlements import (
    CREDIT_PACKS,
    PLANS,
    apply_multiplier,
    credit_cost,
    get_plan,
    list_plans_public,
)

PROMO_ENGINE26 = "engine26!"
PROMO_MULTIPLIER = 5
PROMO_DURATION_DAYS = 90


def _now() -> float:
    return time.time()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def init_billing_tables() -> None:
    with _db_lock:
        con = _conn()
        try:
            con.executescript(
                """
                CREATE TABLE IF NOT EXISTS credit_balances (
                    user_id TEXT PRIMARY KEY,
                    balance INTEGER NOT NULL DEFAULT 0,
                    period_grant INTEGER NOT NULL DEFAULT 0,
                    period_key TEXT,
                    updated_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS credit_ledger (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    delta INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    ref_type TEXT,
                    ref_id TEXT,
                    created_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_ledger_user
                    ON credit_ledger(user_id, created_at DESC);

                CREATE TABLE IF NOT EXISTS promo_codes (
                    id TEXT PRIMARY KEY,
                    code_hash TEXT UNIQUE NOT NULL,
                    code_display TEXT,
                    multiplier INTEGER NOT NULL DEFAULT 5,
                    duration_days INTEGER NOT NULL DEFAULT 90,
                    active INTEGER NOT NULL DEFAULT 1,
                    max_redemptions INTEGER,
                    created_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS promo_redemptions (
                    id TEXT PRIMARY KEY,
                    code_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    redeemed_at REAL NOT NULL,
                    expires_at REAL NOT NULL,
                    UNIQUE(code_id, user_id)
                );
                CREATE INDEX IF NOT EXISTS idx_promo_user
                    ON promo_redemptions(user_id);

                CREATE TABLE IF NOT EXISTS subscriptions (
                    user_id TEXT PRIMARY KEY,
                    plan_id TEXT NOT NULL DEFAULT 'spark',
                    stripe_subscription_id TEXT,
                    status TEXT NOT NULL DEFAULT 'active',
                    period_start REAL,
                    period_end REAL,
                    updated_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS stripe_events (
                    id TEXT PRIMARY KEY,
                    type TEXT,
                    payload TEXT,
                    processed_at REAL
                );
                CREATE TABLE IF NOT EXISTS admin_notes (
                    id TEXT PRIMARY KEY,
                    target_user_id TEXT NOT NULL,
                    author_id TEXT NOT NULL,
                    body TEXT NOT NULL,
                    created_at REAL NOT NULL
                );
                """
            )
            # Seed engine26!
            h = _hash_code(PROMO_ENGINE26)
            row = con.execute("SELECT id FROM promo_codes WHERE code_hash = ?", (h,)).fetchone()
            if not row:
                con.execute(
                    """
                    INSERT INTO promo_codes
                    (id, code_hash, code_display, multiplier, duration_days, active, max_redemptions, created_at)
                    VALUES (?,?,?,?,?,?,?,?)
                    """,
                    (
                        secrets.token_hex(8),
                        h,
                        PROMO_ENGINE26,
                        PROMO_MULTIPLIER,
                        PROMO_DURATION_DAYS,
                        1,
                        None,
                        _now(),
                    ),
                )
            con.commit()
        finally:
            con.close()


def ensure_user_billing_columns() -> None:
    """Add plan / promo / stripe columns to users if missing."""
    cols = {
        "plan_id": "TEXT DEFAULT 'spark'",
        "stripe_customer_id": "TEXT",
        "promo_multiplier": "INTEGER DEFAULT 1",
        "promo_expires_at": "REAL",
        "auth_provider": "TEXT DEFAULT 'password'",
        "cohort_tags": "TEXT DEFAULT ''",
    }
    with _db_lock:
        con = _conn()
        try:
            existing = {
                r[1] for r in con.execute("PRAGMA table_info(users)").fetchall()
            }
            for name, decl in cols.items():
                if name not in existing:
                    con.execute(f"ALTER TABLE users ADD COLUMN {name} {decl}")
            # password_hash may need to allow empty for Google-only — keep as-is; use sentinel
            con.commit()
        finally:
            con.close()


# ---------------------------------------------------------------------------
# Credits
# ---------------------------------------------------------------------------

def get_credit_balance(user_id: str) -> int:
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT balance FROM credit_balances WHERE user_id = ?", (user_id,)
            ).fetchone()
            return int(row["balance"]) if row else 0
        finally:
            con.close()


def get_credits_snapshot(user_id: str) -> dict[str, Any]:
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT balance, period_grant, period_key FROM credit_balances WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if not row:
                return {"balance": 0, "period_grant": 0, "period_key": None}
            return {
                "balance": int(row["balance"]),
                "period_grant": int(row["period_grant"] or 0),
                "period_key": row["period_key"],
            }
        finally:
            con.close()


def _ledger(
    con,
    user_id: str,
    delta: int,
    reason: str,
    ref_type: str | None = None,
    ref_id: str | None = None,
) -> None:
    con.execute(
        """
        INSERT INTO credit_ledger (id, user_id, delta, reason, ref_type, ref_id, created_at)
        VALUES (?,?,?,?,?,?,?)
        """,
        (secrets.token_hex(12), user_id, delta, reason, ref_type, ref_id, _now()),
    )


def grant_credits(
    user_id: str,
    amount: int,
    reason: str,
    ref_type: str | None = None,
    ref_id: str | None = None,
    *,
    set_period_grant: Optional[int] = None,
    period_key: Optional[str] = None,
) -> int:
    if amount <= 0:
        return get_credit_balance(user_id)
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT balance FROM credit_balances WHERE user_id = ?", (user_id,)
            ).fetchone()
            bal = int(row["balance"]) if row else 0
            new_bal = bal + amount
            if row:
                if set_period_grant is not None:
                    con.execute(
                        """
                        UPDATE credit_balances
                        SET balance = ?, period_grant = ?, period_key = ?, updated_at = ?
                        WHERE user_id = ?
                        """,
                        (new_bal, set_period_grant, period_key, _now(), user_id),
                    )
                else:
                    con.execute(
                        "UPDATE credit_balances SET balance = ?, updated_at = ? WHERE user_id = ?",
                        (new_bal, _now(), user_id),
                    )
            else:
                con.execute(
                    """
                    INSERT INTO credit_balances (user_id, balance, period_grant, period_key, updated_at)
                    VALUES (?,?,?,?,?)
                    """,
                    (
                        user_id,
                        new_bal,
                        set_period_grant or 0,
                        period_key,
                        _now(),
                    ),
                )
            _ledger(con, user_id, amount, reason, ref_type, ref_id)
            con.commit()
            return new_bal
        finally:
            con.close()


def spend_credits(
    user_id: str,
    amount: int,
    reason: str,
    ref_type: str | None = None,
    ref_id: str | None = None,
) -> int:
    """Deduct credits; raise 402 if insufficient."""
    if amount <= 0:
        return get_credit_balance(user_id)
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT balance FROM credit_balances WHERE user_id = ?", (user_id,)
            ).fetchone()
            bal = int(row["balance"]) if row else 0
            if bal < amount:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "insufficient_credits",
                        "action": reason,
                        "required": amount,
                        "balance": bal,
                        "message": f"Need {amount} credits (you have {bal}). Buy a pack or upgrade.",
                        "upgrade_hint": "creator",
                    },
                )
            new_bal = bal - amount
            con.execute(
                "UPDATE credit_balances SET balance = ?, updated_at = ? WHERE user_id = ?",
                (new_bal, _now(), user_id),
            )
            _ledger(con, user_id, -amount, reason, ref_type, ref_id)
            con.commit()
            return new_bal
        finally:
            con.close()


def refund_credits(user_id: str, amount: int, reason: str) -> int:
    return grant_credits(user_id, amount, reason, ref_type="refund")


def period_key_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def ensure_monthly_grant(user_id: str, plan_id: str, promo_mult: int = 1) -> None:
    """If user has no grant for this calendar month, grant plan monthly credits."""
    plan = apply_multiplier(get_plan(plan_id), promo_mult)
    grant = int(plan["monthly_credits"])
    key = period_key_now()
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT balance, period_key, period_grant FROM credit_balances WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if row and row["period_key"] == key:
                return
            # New period
            bal = int(row["balance"]) if row else 0
            if row and plan.get("credit_rollover") and row["period_key"]:
                # Keep remaining balance; add new grant
                new_bal = bal + grant
            else:
                # Spark / no rollover: set to grant (don't wipe purchased-only surplus naively)
                # If they had purchased packs, balance may be high — only reset period_grant tracking
                new_bal = bal + grant if row else grant
            if row:
                con.execute(
                    """
                    UPDATE credit_balances
                    SET balance = ?, period_grant = ?, period_key = ?, updated_at = ?
                    WHERE user_id = ?
                    """,
                    (new_bal, grant, key, _now(), user_id),
                )
            else:
                con.execute(
                    """
                    INSERT INTO credit_balances (user_id, balance, period_grant, period_key, updated_at)
                    VALUES (?,?,?,?,?)
                    """,
                    (user_id, grant, grant, key, _now()),
                )
            _ledger(con, user_id, grant, "monthly_grant", "period", key)
            con.commit()
        finally:
            con.close()


# ---------------------------------------------------------------------------
# Promo
# ---------------------------------------------------------------------------

def get_user_promo(user_id: str) -> Optional[dict[str, Any]]:
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT promo_multiplier, promo_expires_at, cohort_tags FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            if not row:
                return None
            mult = int(row["promo_multiplier"] or 1)
            exp = row["promo_expires_at"]
            if mult <= 1:
                return None
            if exp and float(exp) < _now():
                # expired
                con.execute(
                    "UPDATE users SET promo_multiplier = 1, promo_expires_at = NULL WHERE id = ?",
                    (user_id,),
                )
                con.commit()
                return None
            return {
                "code": PROMO_ENGINE26 if mult == PROMO_MULTIPLIER else "promo",
                "multiplier": mult,
                "expires_at": datetime.fromtimestamp(float(exp), tz=timezone.utc).isoformat()
                if exp
                else None,
            }
        finally:
            con.close()


def active_multiplier(user_id: str) -> int:
    p = get_user_promo(user_id)
    return int(p["multiplier"]) if p else 1


def redeem_promo(user_id: str, code: str) -> dict[str, Any]:
    code = (code or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="Enter a promo code.")
    h = _hash_code(code)
    with _db_lock:
        con = _conn()
        try:
            prow = con.execute(
                "SELECT * FROM promo_codes WHERE code_hash = ? AND active = 1", (h,)
            ).fetchone()
            if not prow:
                raise HTTPException(status_code=404, detail="Invalid or inactive promo code.")
            existing = con.execute(
                "SELECT id FROM promo_redemptions WHERE code_id = ? AND user_id = ?",
                (prow["id"], user_id),
            ).fetchone()
            if existing:
                raise HTTPException(status_code=409, detail="You already redeemed this promo.")
            if prow["max_redemptions"] is not None:
                cnt = con.execute(
                    "SELECT COUNT(*) AS c FROM promo_redemptions WHERE code_id = ?",
                    (prow["id"],),
                ).fetchone()
                if int(cnt["c"]) >= int(prow["max_redemptions"]):
                    raise HTTPException(status_code=410, detail="Promo code fully redeemed.")
            expires = _now() + int(prow["duration_days"]) * 86400
            rid = secrets.token_hex(8)
            con.execute(
                """
                INSERT INTO promo_redemptions (id, code_id, user_id, redeemed_at, expires_at)
                VALUES (?,?,?,?,?)
                """,
                (rid, prow["id"], user_id, _now(), expires),
            )
            tags = con.execute(
                "SELECT cohort_tags, plan_id FROM users WHERE id = ?", (user_id,)
            ).fetchone()
            plan_id = (tags["plan_id"] if tags and tags["plan_id"] else "spark") or "spark"
            old_tags = (tags["cohort_tags"] if tags else "") or ""
            new_tags = old_tags
            if "investor_pipeline" not in old_tags:
                new_tags = (old_tags + ",investor_pipeline,promo:engine26").strip(",")
            con.execute(
                """
                UPDATE users SET promo_multiplier = ?, promo_expires_at = ?, cohort_tags = ?
                WHERE id = ?
                """,
                (int(prow["multiplier"]), expires, new_tags, user_id),
            )
            con.commit()
        finally:
            con.close()

    # Re-grant credits for period with new multiplier (top-up difference)
    mult = int(prow["multiplier"])
    plan = apply_multiplier(get_plan(plan_id), mult)
    # Grant extra credits so balance reflects ×5 grant feel
    snap = get_credits_snapshot(user_id)
    target_grant = int(plan["monthly_credits"])
    already = int(snap.get("period_grant") or 0)
    # base grant without promo
    base = int(get_plan(plan_id)["monthly_credits"])
    extra = max(0, target_grant - max(already, base))
    if extra > 0:
        grant_credits(user_id, extra, "promo_boost", "promo", code)

    try:
        from crm import add_activity

        add_activity(user_id, "promo", f"Redeemed promo ×{mult}", "ember")
    except Exception:
        pass

    return {
        "status": "success",
        "multiplier": mult,
        "expires_at": datetime.fromtimestamp(expires, tz=timezone.utc).isoformat(),
        "code": code,
        "message": f"Investor pilot active — usage ×{mult} for {prow['duration_days']} days.",
    }


# ---------------------------------------------------------------------------
# Plan helpers
# ---------------------------------------------------------------------------

def get_user_plan_id(user_id: str) -> str:
    with _db_lock:
        con = _conn()
        try:
            row = con.execute("SELECT plan_id FROM users WHERE id = ?", (user_id,)).fetchone()
            if not row or not row["plan_id"]:
                return "spark"
            return row["plan_id"]
        finally:
            con.close()


def set_user_plan(user_id: str, plan_id: str) -> None:
    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Unknown plan.")
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                "UPDATE users SET plan_id = ? WHERE id = ?", (plan_id, user_id)
            )
            con.execute(
                """
                INSERT INTO subscriptions (user_id, plan_id, status, updated_at)
                VALUES (?,?,?,?)
                ON CONFLICT(user_id) DO UPDATE SET plan_id=excluded.plan_id, status=excluded.status, updated_at=excluded.updated_at
                """,
                (user_id, plan_id, "active", _now()),
            )
            con.commit()
        finally:
            con.close()
    ensure_monthly_grant(user_id, plan_id, active_multiplier(user_id))


def effective_plan_for_user(user_id: str) -> dict[str, Any]:
    plan_id = get_user_plan_id(user_id)
    mult = active_multiplier(user_id)
    return apply_multiplier(get_plan(plan_id), mult)


def bootstrap_new_user_billing(user_id: str) -> None:
    ensure_user_billing_columns()
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                "UPDATE users SET plan_id = COALESCE(plan_id, 'spark') WHERE id = ?",
                (user_id,),
            )
            con.commit()
        finally:
            con.close()
    ensure_monthly_grant(user_id, "spark", 1)


# ---------------------------------------------------------------------------
# Stripe (optional — works in mock mode without keys)
# ---------------------------------------------------------------------------

def stripe_configured() -> bool:
    key = (os.getenv("STRIPE_SECRET_KEY") or "").strip()
    return bool(key) and not key.startswith("sk_test_mock")


def get_stripe():
    if not stripe_configured():
        return None
    import stripe

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    return stripe


# Map plan+interval and pack ids to env price IDs
def price_id_for_plan(plan_id: str, interval: str = "month") -> Optional[str]:
    key = f"STRIPE_PRICE_{plan_id.upper()}_{'ANNUAL' if interval == 'year' else 'MONTHLY'}"
    return (os.getenv(key) or "").strip() or None


def price_id_for_pack(pack_id: str) -> Optional[str]:
    key = f"STRIPE_PRICE_CREDIT_{pack_id.upper()}"
    return (os.getenv(key) or "").strip() or None


def create_checkout_session(
    user_id: str,
    email: str,
    *,
    mode: str,
    plan_id: Optional[str] = None,
    pack_id: Optional[str] = None,
    interval: str = "month",
) -> dict[str, Any]:
    """
    mode: 'subscription' | 'payment' (credits)
    Returns {url} or mock payload when Stripe unset.
    """
    frontend = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
    stripe = get_stripe()

    if mode == "subscription":
        if not plan_id or plan_id == "spark":
            raise HTTPException(status_code=400, detail="Choose a paid plan.")
        if plan_id not in PLANS or plan_id == "spark":
            raise HTTPException(status_code=400, detail="Invalid plan.")
        price = price_id_for_plan(plan_id, interval)
        if not stripe or not price:
            # Mock checkout for demo: upgrade immediately in test/dev
            if os.getenv("BILLING_MOCK_UPGRADE", "1").strip().lower() in ("1", "true", "yes"):
                set_user_plan(user_id, plan_id)
                return {
                    "status": "success",
                    "mock": True,
                    "upgraded": True,
                    "plan_id": plan_id,
                    "message": "Stripe not configured — mock upgraded plan for demo.",
                    "url": f"{frontend}/engine?billing=mock_success&plan={plan_id}",
                }
            raise HTTPException(
                status_code=503,
                detail="Billing not configured. Set STRIPE_SECRET_KEY and price IDs.",
            )
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer_email=email,
            line_items=[{"price": price, "quantity": 1}],
            success_url=f"{frontend}/engine?billing=success",
            cancel_url=f"{frontend}/pricing?billing=cancel",
            metadata={"user_id": user_id, "plan_id": plan_id},
            client_reference_id=user_id,
        )
        return {"status": "success", "url": session.url, "session_id": session.id}

    if mode == "payment":
        if not pack_id or pack_id not in CREDIT_PACKS:
            raise HTTPException(status_code=400, detail="Unknown credit pack.")
        pack = CREDIT_PACKS[pack_id]
        price = price_id_for_pack(pack_id)
        if not stripe or not price:
            if os.getenv("BILLING_MOCK_UPGRADE", "1").strip().lower() in ("1", "true", "yes"):
                grant_credits(
                    user_id,
                    int(pack["credits"]),
                    "credit_pack_mock",
                    "pack",
                    pack_id,
                )
                return {
                    "status": "success",
                    "mock": True,
                    "credits_added": pack["credits"],
                    "message": "Stripe not configured — mock credit pack granted.",
                    "url": f"{frontend}/engine?billing=credits_mock&pack={pack_id}",
                }
            raise HTTPException(status_code=503, detail="Credit packs not configured in Stripe.")
        session = stripe.checkout.Session.create(
            mode="payment",
            customer_email=email,
            line_items=[{"price": price, "quantity": 1}],
            success_url=f"{frontend}/engine?billing=credits_success",
            cancel_url=f"{frontend}/pricing?billing=cancel",
            metadata={
                "user_id": user_id,
                "pack_id": pack_id,
                "credits": str(pack["credits"]),
            },
            client_reference_id=user_id,
        )
        return {"status": "success", "url": session.url, "session_id": session.id}

    raise HTTPException(status_code=400, detail="Invalid checkout mode.")


def handle_stripe_webhook(payload: bytes, sig_header: str | None) -> dict[str, Any]:
    stripe = get_stripe()
    secret = (os.getenv("STRIPE_WEBHOOK_SECRET") or "").strip()
    if not stripe or not secret:
        raise HTTPException(status_code=503, detail="Webhook not configured.")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    eid = event.get("id")
    with _db_lock:
        con = _conn()
        try:
            if con.execute("SELECT id FROM stripe_events WHERE id = ?", (eid,)).fetchone():
                return {"status": "duplicate"}
            con.execute(
                "INSERT INTO stripe_events (id, type, payload, processed_at) VALUES (?,?,?,?)",
                (eid, event.get("type"), json.dumps(event)[:50000], _now()),
            )
            con.commit()
        finally:
            con.close()

    etype = event["type"]
    data = event["data"]["object"]
    if etype == "checkout.session.completed":
        meta = data.get("metadata") or {}
        user_id = meta.get("user_id") or data.get("client_reference_id")
        if user_id and meta.get("plan_id"):
            set_user_plan(user_id, meta["plan_id"])
        if user_id and meta.get("pack_id"):
            pack = CREDIT_PACKS.get(meta["pack_id"])
            credits = int(meta.get("credits") or (pack["credits"] if pack else 0))
            if credits:
                grant_credits(user_id, credits, "credit_pack", "stripe", data.get("id"))
    return {"status": "ok"}


def admin_list_users_rich() -> list[dict[str, Any]]:
    with _db_lock:
        con = _conn()
        try:
            rows = con.execute(
                """
                SELECT u.id, u.email, u.name, u.role, u.status, u.created_at, u.last_login_at,
                       u.plan_id, u.promo_multiplier, u.promo_expires_at, u.auth_provider, u.cohort_tags,
                       u.stripe_customer_id,
                       COALESCE(c.balance, 0) AS credits
                FROM users u
                LEFT JOIN credit_balances c ON c.user_id = u.id
                ORDER BY u.created_at DESC
                """
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            con.close()


def admin_adjust_credits(admin_id: str, user_id: str, delta: int, reason: str) -> int:
    if delta == 0:
        return get_credit_balance(user_id)
    if delta > 0:
        return grant_credits(user_id, delta, f"admin:{reason}", "admin", admin_id)
    return spend_credits(user_id, abs(delta), f"admin:{reason}", "admin", admin_id)


def admin_set_plan(user_id: str, plan_id: str) -> None:
    set_user_plan(user_id, plan_id)


def admin_add_note(author_id: str, target_user_id: str, body: str) -> dict:
    nid = secrets.token_hex(8)
    with _db_lock:
        con = _conn()
        try:
            con.execute(
                "INSERT INTO admin_notes (id, target_user_id, author_id, body, created_at) VALUES (?,?,?,?,?)",
                (nid, target_user_id, author_id, body.strip(), _now()),
            )
            con.commit()
        finally:
            con.close()
    return {"id": nid, "body": body, "created_at": _now()}


def promo_stats() -> dict[str, Any]:
    with _db_lock:
        con = _conn()
        try:
            h = _hash_code(PROMO_ENGINE26)
            code = con.execute(
                "SELECT id FROM promo_codes WHERE code_hash = ?", (h,)
            ).fetchone()
            if not code:
                return {"code": PROMO_ENGINE26, "redemptions": 0}
            cnt = con.execute(
                "SELECT COUNT(*) AS c FROM promo_redemptions WHERE code_id = ?",
                (code["id"],),
            ).fetchone()
            return {
                "code": PROMO_ENGINE26,
                "redemptions": int(cnt["c"]),
                "multiplier": PROMO_MULTIPLIER,
                "duration_days": PROMO_DURATION_DAYS,
            }
        finally:
            con.close()
