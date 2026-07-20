"""
Rich per-user profile data — artist identity, socials, stats cache.
Stored in SQLite alongside auth (simple_auth DB).
"""

from __future__ import annotations

import json
import secrets
import time
from typing import Any, Optional

from simple_auth import _conn, _db_lock


def init_profile_tables() -> None:
    with _db_lock:
        con = _conn()
        try:
            con.executescript(
                """
                CREATE TABLE IF NOT EXISTS user_profiles (
                    user_id TEXT PRIMARY KEY,
                    artist_alias TEXT DEFAULT '',
                    one_liner TEXT DEFAULT '',
                    bio TEXT DEFAULT '',
                    home_city TEXT DEFAULT '',
                    primary_genre TEXT DEFAULT '',
                    target_markets TEXT DEFAULT '',
                    agent_name TEXT DEFAULT '',
                    agent_email TEXT DEFAULT '',
                    agent_phone TEXT DEFAULT '',
                    agent_social TEXT DEFAULT '',
                    spotify_url TEXT DEFAULT '',
                    apple_url TEXT DEFAULT '',
                    youtube_url TEXT DEFAULT '',
                    instagram_url TEXT DEFAULT '',
                    other_url TEXT DEFAULT '',
                    avatar_url TEXT DEFAULT '',
                    treasury_balance TEXT DEFAULT '',
                    crypto_balance TEXT DEFAULT '',
                    crypto_address TEXT DEFAULT '',
                    onboarding_done INTEGER DEFAULT 0,
                    stats_json TEXT DEFAULT '{}',
                    preferences_json TEXT DEFAULT '{}',
                    updated_at REAL NOT NULL
                );
                """
            )
            con.commit()
        finally:
            con.close()


def _now() -> float:
    return time.time()


def default_profile_for(name: str, email: str, avatar_url: str = "") -> dict[str, Any]:
    alias = (name or email.split("@")[0] or "Artist").strip()
    return {
        "artist_alias": alias,
        "one_liner": "Independent artist · powered by The Source Engine",
        "bio": "",
        "home_city": "",
        "primary_genre": "",
        "target_markets": "",
        "agent_name": alias,
        "agent_email": email or "",
        "agent_phone": "",
        "agent_social": "",
        "spotify_url": "",
        "apple_url": "",
        "youtube_url": "",
        "instagram_url": "",
        "other_url": "",
        "avatar_url": avatar_url or "",
        "treasury_balance": "",
        "crypto_balance": "",
        "crypto_address": "",
        "onboarding_done": False,
        "stats": {
            "masters_total": 0,
            "scouts_total": 0,
            "pitches_total": 0,
            "contracts_total": 0,
            "leads_open": 0,
            "booked": 0,
        },
        "preferences": {
            "master_default_profile": "STREAMING",
            "notify_quota": True,
        },
    }


def ensure_profile(user_id: str, name: str = "", email: str = "", avatar_url: str = "") -> dict[str, Any]:
    existing = get_profile(user_id)
    if existing:
        return existing
    base = default_profile_for(name, email, avatar_url)
    save_profile(user_id, base)
    return get_profile(user_id) or base


def get_profile(user_id: str) -> Optional[dict[str, Any]]:
    with _db_lock:
        con = _conn()
        try:
            row = con.execute(
                "SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)
            ).fetchone()
            if not row:
                return None
            return _row_profile(row)
        finally:
            con.close()


def save_profile(user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    stats = data.get("stats") if isinstance(data.get("stats"), dict) else {}
    prefs = data.get("preferences") if isinstance(data.get("preferences"), dict) else {}
    if data.get("stats_json") and not stats:
        try:
            stats = json.loads(data["stats_json"])
        except Exception:
            stats = {}
    if data.get("preferences_json") and not prefs:
        try:
            prefs = json.loads(data["preferences_json"])
        except Exception:
            prefs = {}

    fields = {
        "artist_alias": data.get("artist_alias") or data.get("artistAlias") or "",
        "one_liner": data.get("one_liner") or data.get("oneLiner") or "",
        "bio": data.get("bio") or "",
        "home_city": data.get("home_city") or data.get("homeCity") or "",
        "primary_genre": data.get("primary_genre") or data.get("primaryGenre") or "",
        "target_markets": data.get("target_markets") or data.get("targetMarkets") or "",
        "agent_name": data.get("agent_name") or data.get("agentName") or "",
        "agent_email": data.get("agent_email") or data.get("agentEmail") or "",
        "agent_phone": data.get("agent_phone") or data.get("agentPhone") or "",
        "agent_social": data.get("agent_social") or data.get("agentSocial") or "",
        "spotify_url": data.get("spotify_url") or data.get("spotifyUrl") or "",
        "apple_url": data.get("apple_url") or data.get("appleUrl") or "",
        "youtube_url": data.get("youtube_url") or data.get("youtubeUrl") or "",
        "instagram_url": data.get("instagram_url") or data.get("instagramUrl") or "",
        "other_url": data.get("other_url") or data.get("otherUrl") or "",
        "avatar_url": data.get("avatar_url") or data.get("avatarUrl") or "",
        "treasury_balance": data.get("treasury_balance") or data.get("treasuryBalance") or "",
        "crypto_balance": data.get("crypto_balance") or data.get("cryptoBalance") or "",
        "crypto_address": data.get("crypto_address") or data.get("cryptoAddress") or "",
        "onboarding_done": 1 if data.get("onboarding_done") or data.get("onboardingDone") else 0,
        "stats_json": json.dumps(stats or {}),
        "preferences_json": json.dumps(prefs or {}),
        "updated_at": _now(),
    }

    with _db_lock:
        con = _conn()
        try:
            exists = con.execute(
                "SELECT user_id FROM user_profiles WHERE user_id = ?", (user_id,)
            ).fetchone()
            if exists:
                con.execute(
                    """
                    UPDATE user_profiles SET
                      artist_alias=?, one_liner=?, bio=?, home_city=?, primary_genre=?,
                      target_markets=?, agent_name=?, agent_email=?, agent_phone=?, agent_social=?,
                      spotify_url=?, apple_url=?, youtube_url=?, instagram_url=?, other_url=?,
                      avatar_url=?, treasury_balance=?, crypto_balance=?, crypto_address=?,
                      onboarding_done=?, stats_json=?, preferences_json=?, updated_at=?
                    WHERE user_id=?
                    """,
                    (
                        fields["artist_alias"],
                        fields["one_liner"],
                        fields["bio"],
                        fields["home_city"],
                        fields["primary_genre"],
                        fields["target_markets"],
                        fields["agent_name"],
                        fields["agent_email"],
                        fields["agent_phone"],
                        fields["agent_social"],
                        fields["spotify_url"],
                        fields["apple_url"],
                        fields["youtube_url"],
                        fields["instagram_url"],
                        fields["other_url"],
                        fields["avatar_url"],
                        fields["treasury_balance"],
                        fields["crypto_balance"],
                        fields["crypto_address"],
                        fields["onboarding_done"],
                        fields["stats_json"],
                        fields["preferences_json"],
                        fields["updated_at"],
                        user_id,
                    ),
                )
            else:
                con.execute(
                    """
                    INSERT INTO user_profiles (
                      user_id, artist_alias, one_liner, bio, home_city, primary_genre,
                      target_markets, agent_name, agent_email, agent_phone, agent_social,
                      spotify_url, apple_url, youtube_url, instagram_url, other_url,
                      avatar_url, treasury_balance, crypto_balance, crypto_address,
                      onboarding_done, stats_json, preferences_json, updated_at
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """,
                    (
                        user_id,
                        fields["artist_alias"],
                        fields["one_liner"],
                        fields["bio"],
                        fields["home_city"],
                        fields["primary_genre"],
                        fields["target_markets"],
                        fields["agent_name"],
                        fields["agent_email"],
                        fields["agent_phone"],
                        fields["agent_social"],
                        fields["spotify_url"],
                        fields["apple_url"],
                        fields["youtube_url"],
                        fields["instagram_url"],
                        fields["other_url"],
                        fields["avatar_url"],
                        fields["treasury_balance"],
                        fields["crypto_balance"],
                        fields["crypto_address"],
                        fields["onboarding_done"],
                        fields["stats_json"],
                        fields["preferences_json"],
                        fields["updated_at"],
                    ),
                )
            con.commit()
        finally:
            con.close()
    return get_profile(user_id) or {}


def bump_stat(user_id: str, key: str, delta: int = 1) -> None:
    prof = get_profile(user_id) or ensure_profile(user_id)
    stats = dict(prof.get("stats") or {})
    stats[key] = int(stats.get(key) or 0) + delta
    prof["stats"] = stats
    save_profile(user_id, prof)


def recompute_stats_from_usage(user_id: str) -> dict[str, Any]:
    """Refresh aggregate counters from usage_events + CRM."""
    with _db_lock:
        con = _conn()
        try:
            counts = {}
            for action in ("master", "scout", "pitch", "contract", "oracle", "stems"):
                row = con.execute(
                    "SELECT COUNT(*) AS c FROM usage_events WHERE user_id = ? AND action = ?",
                    (user_id, action),
                ).fetchone()
                counts[action] = int(row["c"] if row else 0)
            leads_open = con.execute(
                "SELECT COUNT(*) AS c FROM crm_leads WHERE user_id = ? AND stage NOT IN ('booked','lost')",
                (user_id,),
            ).fetchone()
            booked = con.execute(
                "SELECT COUNT(*) AS c FROM crm_leads WHERE user_id = ? AND stage = 'booked'",
                (user_id,),
            ).fetchone()
        finally:
            con.close()

    prof = get_profile(user_id) or ensure_profile(user_id)
    stats = dict(prof.get("stats") or {})
    stats.update(
        {
            "masters_total": counts.get("master", 0),
            "scouts_total": counts.get("scout", 0),
            "pitches_total": counts.get("pitch", 0),
            "contracts_total": counts.get("contract", 0),
            "oracle_total": counts.get("oracle", 0),
            "stems_total": counts.get("stems", 0),
            "leads_open": int(leads_open["c"] if leads_open else 0),
            "booked": int(booked["c"] if booked else 0),
        }
    )
    prof["stats"] = stats
    return save_profile(user_id, prof)


def _row_profile(row) -> dict[str, Any]:
    try:
        stats = json.loads(row["stats_json"] or "{}")
    except Exception:
        stats = {}
    try:
        prefs = json.loads(row["preferences_json"] or "{}")
    except Exception:
        prefs = {}
    return {
        "artist_alias": row["artist_alias"] or "",
        "one_liner": row["one_liner"] or "",
        "bio": row["bio"] or "",
        "home_city": row["home_city"] or "",
        "primary_genre": row["primary_genre"] or "",
        "target_markets": row["target_markets"] or "",
        "agent_name": row["agent_name"] or "",
        "agent_email": row["agent_email"] or "",
        "agent_phone": row["agent_phone"] or "",
        "agent_social": row["agent_social"] or "",
        "spotify_url": row["spotify_url"] or "",
        "apple_url": row["apple_url"] or "",
        "youtube_url": row["youtube_url"] or "",
        "instagram_url": row["instagram_url"] or "",
        "other_url": row["other_url"] or "",
        "avatar_url": row["avatar_url"] or "",
        "treasury_balance": row["treasury_balance"] or "",
        "crypto_balance": row["crypto_balance"] or "",
        "crypto_address": row["crypto_address"] or "",
        "onboarding_done": bool(row["onboarding_done"]),
        "stats": stats,
        "preferences": prefs,
        "updated_at": row["updated_at"],
        # camelCase mirrors for frontend sovereign_identity
        "artistAlias": row["artist_alias"] or "",
        "oneLiner": row["one_liner"] or "",
        "homeCity": row["home_city"] or "",
        "primaryGenre": row["primary_genre"] or "",
        "targetMarkets": row["target_markets"] or "",
        "agentName": row["agent_name"] or "",
        "agentEmail": row["agent_email"] or "",
        "agentPhone": row["agent_phone"] or "",
        "agentSocial": row["agent_social"] or "",
        "spotifyUrl": row["spotify_url"] or "",
        "appleUrl": row["apple_url"] or "",
        "youtubeUrl": row["youtube_url"] or "",
        "instagramUrl": row["instagram_url"] or "",
        "otherUrl": row["other_url"] or "",
        "avatarUrl": row["avatar_url"] or "",
    }


# ---------------------------------------------------------------------------
# Demo seed — rich sample artists for investor walkthrough
# ---------------------------------------------------------------------------

DEMO_ARTISTS = [
    {
        "email": "nova.blake@example.com",
        "name": "Nova Blake",
        "password": "DemoArtist1!",
        "plan_id": "pro",
        "promo": True,
        "profile": {
            "artist_alias": "NOVA BLAKE",
            "one_liner": "Alt-R&B vocalist · late-night clubs · LA / Atlanta",
            "bio": "Genre-fluid writer and performer building a catalog of intimate midtempo records. Touring the west coast circuit with a live trio.",
            "home_city": "Los Angeles, CA",
            "primary_genre": "R&B / Soul",
            "target_markets": "Los Angeles, Atlanta, London",
            "agent_name": "Nova Blake",
            "agent_email": "nova.blake@example.com",
            "agent_phone": "+1 310 555 0142",
            "agent_social": "@novablake",
            "spotify_url": "https://open.spotify.com/artist/demo-nova",
            "instagram_url": "https://instagram.com/novablake",
            "onboarding_done": True,
        },
        "leads": [
            {"venueName": "The Echo", "city": "Los Angeles", "stage": "negotiating", "reputationScore": 82, "grossPotential": 4200, "contactName": "Jamie Ruiz", "contactEmail": "bookings@echo.example", "note": "Asked for EPK + tech rider"},
            {"venueName": "Troubadour", "city": "West Hollywood", "stage": "contacted", "reputationScore": 91, "grossPotential": 7800, "contactName": "Alex Kim", "contactEmail": "talent@troubadour.example"},
            {"venueName": "The Masquerade", "city": "Atlanta", "stage": "scouted", "reputationScore": 76, "grossPotential": 5500},
            {"venueName": "Rough Trade NYC", "city": "Brooklyn", "stage": "hold", "reputationScore": 88, "grossPotential": 3200, "note": "Soft hold for September"},
        ],
    },
    {
        "email": "dj.kiln@example.com",
        "name": "DJ Kiln",
        "password": "DemoArtist1!",
        "plan_id": "creator",
        "promo": False,
        "profile": {
            "artist_alias": "KILN",
            "one_liner": "Techno / industrial · warehouse peak-time",
            "bio": "Berlin-trained selector turning warehouse rooms into pressure cookers. Releases on independent techno labels.",
            "home_city": "Berlin, DE",
            "primary_genre": "Techno",
            "target_markets": "Berlin, Detroit, Chicago, Tbilisi",
            "agent_name": "Mara Holt (booking)",
            "agent_email": "mara@kiln.example",
            "agent_phone": "+49 30 555 0199",
            "agent_social": "@djkiln",
            "spotify_url": "https://open.spotify.com/artist/demo-kiln",
            "onboarding_done": True,
        },
        "leads": [
            {"venueName": "Berghain Kantine", "city": "Berlin", "stage": "booked", "reputationScore": 95, "grossPotential": 12000, "contactName": "Door Bookings", "note": "Confirmed support slot"},
            {"venueName": "Tresor", "city": "Berlin", "stage": "negotiating", "reputationScore": 93, "grossPotential": 9000},
            {"venueName": "Smartbar", "city": "Chicago", "stage": "contacted", "reputationScore": 84, "grossPotential": 4500},
        ],
    },
    {
        "email": "sierra.waves@example.com",
        "name": "Sierra Waves",
        "password": "DemoArtist1!",
        "plan_id": "spark",
        "promo": True,
        "profile": {
            "artist_alias": "Sierra Waves",
            "one_liner": "Indie folk · storytelling sets · coffeehouse to 500-cap",
            "bio": "Songwriter from Austin building a fanbase one intimate room at a time. Just finished a 6-song EP.",
            "home_city": "Austin, TX",
            "primary_genre": "Indie Folk",
            "target_markets": "Austin, Nashville, Denver",
            "agent_name": "Sierra Waves",
            "agent_email": "sierra.waves@example.com",
            "agent_social": "@sierrawaves",
            "onboarding_done": True,
        },
        "leads": [
            {"venueName": "C-Boys Heart & Soul", "city": "Austin", "stage": "scouted", "reputationScore": 70, "grossPotential": 900},
            {"venueName": "The Basement", "city": "Nashville", "stage": "contacted", "reputationScore": 78, "grossPotential": 1400},
        ],
    },
]


def seed_demo_artists() -> list[dict[str, Any]]:
    """Idempotent seed of demo artists with profiles, plans, CRM leads."""
    from simple_auth import _hash_password, _create_session
    from billing import set_user_plan, grant_credits, redeem_promo, bootstrap_new_user_billing
    from crm import upsert_lead, add_activity, add_task, init_crm_tables
    import secrets
    from datetime import datetime, timezone

    init_profile_tables()
    init_crm_tables()
    created = []

    for demo in DEMO_ARTISTS:
        email = demo["email"].lower()
        with _db_lock:
            con = _conn()
            try:
                row = con.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
                if row:
                    uid = row["id"]
                    is_new = False
                else:
                    is_new = True
                    uid = secrets.token_hex(16)
                    now = datetime.now(timezone.utc).isoformat()
                    con.execute(
                        """
                        INSERT INTO users
                        (id, email, name, password_hash, role, status, created_at, plan_id, auth_provider, cohort_tags)
                        VALUES (?,?,?,?,?,?,?,?,?,?)
                        """,
                        (
                            uid,
                            email,
                            demo["name"],
                            _hash_password(demo["password"]),
                            "member",
                            "active",
                            now,
                            demo.get("plan_id") or "spark",
                            "password",
                            "demo,investor_pipeline",
                        ),
                    )
                    con.commit()
            finally:
                con.close()

        if is_new:
            try:
                bootstrap_new_user_billing(uid)
            except Exception:
                pass
            try:
                set_user_plan(uid, demo.get("plan_id") or "spark")
            except Exception:
                pass
            if demo.get("promo"):
                try:
                    redeem_promo(uid, "engine26!")
                except Exception:
                    pass
            try:
                grant_credits(uid, 50, "demo_seed_bonus", "seed", "demo")
            except Exception:
                pass

        save_profile(uid, {**demo["profile"], "agent_email": demo["email"]})
        for lead in demo.get("leads") or []:
            upsert_lead(uid, lead)
        add_activity(uid, "system", f"Demo profile ready · {demo['name']}", "ember")
        add_task(uid, f"Follow up top venue for {demo['profile'].get('artist_alias')}", due_at=time.time() + 86400 * 3)
        recompute_stats_from_usage(uid)
        created.append({"email": email, "user_id": uid, "plan": demo.get("plan_id"), "name": demo["name"]})

    return created
