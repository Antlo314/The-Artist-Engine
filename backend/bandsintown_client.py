"""
Bandsintown public artist events API — free with app_id.
https://help.artists.bandsintown.com/

Set BANDSINTOWN_APP_ID (any unique string identifying your app is accepted for public endpoints).
"""

from __future__ import annotations

import os
import re
from typing import Any, Optional
from urllib.parse import quote

import httpx

BIT_BASE = "https://rest.bandsintown.com"


def bandsintown_available() -> bool:
    return bool(os.getenv("BANDSINTOWN_APP_ID", "").strip() or os.getenv("BANDSINTOWN_APP_ID", "thesourceengine"))


def _app_id() -> str:
    return (os.getenv("BANDSINTOWN_APP_ID") or "thesourceengine").strip()


async def fetch_artist_events(artist_name: str, date: str = "upcoming") -> dict[str, Any]:
    name = (artist_name or "").strip()
    if not name:
        return {"events": [], "error": "empty artist"}
    app_id = _app_id()
    url = f"{BIT_BASE}/artists/{quote(name)}/events"
    params = {"app_id": app_id, "date": date}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, params=params)
        if r.status_code == 404:
            return {"events": [], "artist": name, "note": "Artist not found on Bandsintown"}
        r.raise_for_status()
        data = r.json()
    if not isinstance(data, list):
        return {"events": [], "raw": data}
    events = []
    for ev in data[:40]:
        venue = ev.get("venue") or {}
        events.append({
            "id": ev.get("id"),
            "datetime": ev.get("datetime"),
            "url": ev.get("url"),
            "venue_name": venue.get("name"),
            "city": venue.get("city"),
            "region": venue.get("region"),
            "country": venue.get("country"),
            "latitude": venue.get("latitude"),
            "longitude": venue.get("longitude"),
            "lineup": ev.get("lineup") or [],
        })
    return {"events": events, "artist": name, "source": "bandsintown"}


async def venues_near_city(city: str, genre_hint: str = "", sample_artists: Optional[list[str]] = None) -> list[dict]:
    """
    Aggregate unique venues from sample artist tours that pass through `city`.
    Free-tier approach without a paid venue search endpoint.
    """
    city_l = (city or "").strip().lower()
    if not city_l:
        return []

    # Genre-biased default touring acts as seeds (public knowledge / BIT pages)
    seeds = sample_artists or _seed_artists(genre_hint)
    venues: dict[str, dict] = {}
    for artist in seeds[:6]:
        try:
            pack = await fetch_artist_events(artist)
            for ev in pack.get("events") or []:
                vc = (ev.get("city") or "").lower()
                if city_l not in vc and vc not in city_l:
                    # also match "New York" vs "New York City"
                    if not any(p in vc for p in city_l.split() if len(p) > 3):
                        continue
                key = (ev.get("venue_name") or "").strip().lower()
                if not key:
                    continue
                if key not in venues:
                    venues[key] = {
                        "name": ev.get("venue_name"),
                        "city": ev.get("city"),
                        "region": ev.get("region"),
                        "country": ev.get("country"),
                        "website_url": None,
                        "social_media_url": None,
                        "contact": None,
                        "contact_persona": "Booking (via Bandsintown activity)",
                        "contact_source": "Bandsintown public events",
                        "tier": "Unknown",
                        "payout_model": "Unknown",
                        "lead_time": "Unknown",
                        "reputation_score": 60,
                        "reputation_explanation": "Inferred from public tour activity only — not a fairness audit.",
                        "capacity": None,
                        "avg_ticket_price_usd": None,
                        "gross_potential_usd": None,
                        "leverage_point": f"Recent/upcoming BIT event: {ev.get('datetime')}",
                        "active_search_signal": True,
                        "verified_live": True,
                        "similar_acts": list(ev.get("lineup") or [])[:4],
                        "bandsintown_event_url": ev.get("url"),
                        "data_source": "bandsintown",
                    }
                else:
                    acts = venues[key].get("similar_acts") or []
                    for a in (ev.get("lineup") or []):
                        if a not in acts:
                            acts.append(a)
                    venues[key]["similar_acts"] = acts[:6]
        except Exception as e:
            print(f"[BANDSINTOWN] {artist}: {e}")
            continue
    return list(venues.values())


def _seed_artists(genre: str) -> list[str]:
    g = (genre or "").lower()
    try:
        from free_data import GENRE_PRESETS
        for preset in GENRE_PRESETS.values():
            label = (preset.get("label") or "").lower()
            pg = (preset.get("genre") or "").lower()
            if pg in g or any(w in g for w in label.replace("/", " ").split() if len(w) > 2):
                return list(preset.get("seed_artists") or [])
    except Exception:
        pass
    table = {
        "hip hop": ["J. Cole", "Kendrick Lamar", "Doja Cat", "Tyler, The Creator", "Lil Baby", "Megan Thee Stallion", "SZA", "21 Savage"],
        "rap": ["J. Cole", "Kendrick Lamar", "Travis Scott", "Drake", "21 Savage", "SZA", "Doja Cat", "Lil Baby"],
        "r&b": ["SZA", "Summer Walker", "Brent Faiyaz", "H.E.R.", "Giveon", "Daniel Caesar", "Frank Ocean", "Solange"],
        "rock": ["Foo Fighters", "The Killers", "Paramore", "Queens of the Stone Age", "Phoebe Bridgers", "Turnstile", "IDLES"],
        "indie": ["Phoebe Bridgers", "Boygenius", "The 1975", "Vampire Weekend", "Tame Impala", "Clairo", "Japanese Breakfast"],
        "electronic": ["Flume", "Disclosure", "Odesza", "Kaytranada", "Fred again..", "Porter Robinson", "Four Tet"],
        "country": ["Zach Bryan", "Luke Combs", "Kacey Musgraves", "Chris Stapleton", "Megan Moroney", "Lainey Wilson"],
        "pop": ["Billie Eilish", "Olivia Rodrigo", "Dua Lipa", "The Weeknd", "Sabrina Carpenter", "Chappell Roan"],
        "jazz": ["Kamasi Washington", "Robert Glasper", "Norah Jones", "Esperanza Spalding", "Cory Henry"],
        "metal": ["Metallica", "Gojira", "Spiritbox", "Sleep Token", "Tool", "Knocked Loose"],
        "latin": ["Bad Bunny", "Rosalía", "Peso Pluma", "Karol G", "Rauw Alejandro"],
        "afrobeats": ["Burna Boy", "Wizkid", "Tems", "Asake", "Rema"],
        "amapiano": ["Tyla", "Uncle Waffles", "Kabza De Small"],
    }
    for key, artists in table.items():
        if key in g:
            return artists
    return ["Billie Eilish", "The Weeknd", "Foo Fighters", "SZA", "Tyler, The Creator", "Paramore", "Doja Cat", "Odesza"]
