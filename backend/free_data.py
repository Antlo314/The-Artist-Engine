"""
Max free public data helpers for The Source Engine investor demo.
All sources are free/open or freemium public APIs — no paid Chartmetric/etc.
"""

from __future__ import annotations

import os
import re
from typing import Any, Optional

import httpx

UA = "TheSourceEngine/3.0 (https://www.thesourceengine.com; free-data)"

# City → ISO country when user types "Toronto", "London UK", etc.
CITY_COUNTRY_HINTS: list[tuple[str, str]] = [
    (r"\b(toronto|vancouver|montreal|calgary|ottawa|edmonton)\b", "CA"),
    (r"\b(london|manchester|birmingham|bristol|glasgow|edinburgh|leeds)\b", "GB"),
    (r"\b(berlin|munich|hamburg|cologne|frankfurt)\b", "DE"),
    (r"\b(paris|lyon|marseille|toulouse)\b", "FR"),
    (r"\b(amsterdam|rotterdam|utrecht)\b", "NL"),
    (r"\b(dublin|cork)\b", "IE"),
    (r"\b(sydney|melbourne|brisbane|perth)\b", "AU"),
    (r"\b(auckland|wellington)\b", "NZ"),
    (r"\b(tokyo|osaka)\b", "JP"),
    (r"\b(mexico\s*city|guadalajara|monterrey)\b", "MX"),
    (r"\b(são\s*paulo|sao\s*paulo|rio\s*de\s*janeiro|brasilia)\b", "BR"),
    (r"\b(stockholm|gothenburg)\b", "SE"),
    (r"\b(oslo)\b", "NO"),
    (r"\b(copenhagen)\b", "DK"),
    (r"\b(madrid|barcelona|valencia)\b", "ES"),
    (r"\b(rome|milan|naples)\b", "IT"),
]

GENRE_PRESETS: dict[str, dict[str, Any]] = {
    "hip-hop": {
        "label": "Hip-Hop / Rap",
        "genre": "Hip Hop",
        "tier": "Mid-size — 250 to 1,000 people",
        "radius": "50 miles",
        "timeframe": "Next 60 days",
        "seed_artists": ["J. Cole", "Kendrick Lamar", "Doja Cat", "Tyler, The Creator", "SZA", "21 Savage"],
    },
    "rnb": {
        "label": "R&B / Soul",
        "genre": "R&B",
        "tier": "Mid-size — 250 to 1,000 people",
        "radius": "50 miles",
        "timeframe": "Next 60 days",
        "seed_artists": ["SZA", "Summer Walker", "Brent Faiyaz", "H.E.R.", "Giveon", "Daniel Caesar"],
    },
    "indie": {
        "label": "Indie / Alt",
        "genre": "Indie Rock",
        "tier": "Mid-size — 250 to 1,000 people",
        "radius": "75 miles",
        "timeframe": "Next 90 days",
        "seed_artists": ["Phoebe Bridgers", "Boygenius", "The 1975", "Tame Impala", "Clairo", "Paramore"],
    },
    "electronic": {
        "label": "Electronic / Dance",
        "genre": "Electronic",
        "tier": "Mid-size — 250 to 1,000 people",
        "radius": "100 miles",
        "timeframe": "Next 90 days",
        "seed_artists": ["Flume", "Disclosure", "Odesza", "Kaytranada", "Fred again..", "Porter Robinson"],
    },
    "country": {
        "label": "Country / Americana",
        "genre": "Country",
        "tier": "Theaters — 1,000 to 3,000 people",
        "radius": "100 miles",
        "timeframe": "Next 6 months",
        "seed_artists": ["Zach Bryan", "Luke Combs", "Kacey Musgraves", "Chris Stapleton", "Megan Moroney"],
    },
    "pop": {
        "label": "Pop",
        "genre": "Pop",
        "tier": "Theaters — 1,000 to 3,000 people",
        "radius": "75 miles",
        "timeframe": "Next 90 days",
        "seed_artists": ["Billie Eilish", "Olivia Rodrigo", "Dua Lipa", "Sabrina Carpenter", "Chappell Roan"],
    },
    "rock": {
        "label": "Rock / Metal",
        "genre": "Rock",
        "tier": "Mid-size — 250 to 1,000 people",
        "radius": "75 miles",
        "timeframe": "Next 90 days",
        "seed_artists": ["Foo Fighters", "Queens of the Stone Age", "Turnstile", "Spiritbox", "Gojira"],
    },
    "jazz": {
        "label": "Jazz / Improvised",
        "genre": "Jazz",
        "tier": "Small rooms — 50 to 250 people",
        "radius": "50 miles",
        "timeframe": "Next 60 days",
        "seed_artists": ["Kamasi Washington", "Robert Glasper", "Norah Jones", "Esperanza Spalding"],
    },
}


def infer_country(city: str, explicit: Optional[str] = None) -> str:
    if explicit and len(explicit.strip()) == 2:
        return explicit.strip().upper()
    text = (city or "").strip().lower()
    # "London, UK" / "Paris FR"
    m = re.search(r"\b(us|usa|ca|uk|gb|de|fr|nl|ie|au|nz|jp|mx|br|se|no|dk|es|it)\b", text)
    if m:
        code = m.group(1).upper()
        return {"USA": "US", "UK": "GB"}.get(code, code if code != "UK" else "GB")
    for pattern, code in CITY_COUNTRY_HINTS:
        if re.search(pattern, text, re.I):
            return code
    return "US"


def free_stack_manifest() -> dict[str, Any]:
    """Investor-facing inventory of free vs coming-soon."""
    return {
        "live_free_now": [
            {"id": "master", "name": "Mastering — with or without a reference track", "stack": "Studio"},
            {"id": "meters", "name": "Loudness check, so you know it's streaming-ready", "stack": "Studio"},
            {"id": "stems", "name": "Splitting a song into vocals, drums, bass, and the rest", "stack": "Studio"},
            {"id": "oracle", "name": "An honest read on your mix before you master it", "stack": "Studio"},
            {"id": "ticketmaster", "name": "Venues with real shows on sale right now", "stack": "Find Gigs"},
            {"id": "bandsintown", "name": "Where similar artists are actually touring", "stack": "Find Gigs"},
            {"id": "musicbrainz", "name": "Press kit built from your public releases", "stack": "Roster"},
            {"id": "discogs", "name": "Your back catalogue, pulled in automatically", "stack": "Roster"},
            {"id": "osm", "name": "Tour routing that puts your cities in the right order", "stack": "Home"},
            {"id": "linter", "name": "Instant contract check — free, unlimited, no AI", "stack": "Contracts"},
            {"id": "legal_ai", "name": "Full contract and offer reading", "stack": "Contracts · Pitch & Deals"},
            {"id": "pitches", "name": "Booking emails, call scripts, and DMs written for you", "stack": "Pitch & Deals"},
            {"id": "crm", "name": "Contacts, tasks, and exports you own", "stack": "Roster"},
            {"id": "auth", "name": "Your account, with fair daily limits", "stack": "Everywhere"},
            {"id": "theme", "name": "Light and dark, whichever you prefer", "stack": "Everywhere"},
            {"id": "pwa", "name": "Installs on your phone like an app", "stack": "Everywhere"},
        ],
        "coming_soon_paid_or_heavy": [
            {"id": "chartmetric", "name": "Your streaming and social numbers on one screen", "why": "Needs a paid data provider"},
            {"id": "esign", "name": "Signing contracts here, with version history", "why": "Needs an e-signature partner"},
            {"id": "payouts", "name": "Money paid straight to your bank", "why": "Needs payment licensing"},
            {"id": "sendgrid", "name": "Sending pitches from here and seeing who replied", "why": "Needs an email provider"},
            {"id": "demucs_gpu", "name": "Higher-quality stem splitting for everyone", "why": "Needs dedicated hardware"},
            {"id": "pro_reg", "name": "Registering your songs with your PRO", "why": "Needs society integrations"},
            {"id": "distro", "name": "Sending your music to stores in one click", "why": "Needs distributor partnerships"},
        ],
        "philosophy": "Everything in the first list works today at no extra cost. The second list is what we haven't built yet — we'd rather name it than fake it.",
    }


async def nominatim_geocode(place: str) -> Optional[dict[str, Any]]:
    q = (place or "").strip()
    if not q:
        return None
    params = {"q": q, "format": "json", "limit": 1}
    headers = {"User-Agent": UA}
    try:
        async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
            r = await client.get("https://nominatim.openstreetmap.org/search", params=params)
            r.raise_for_status()
            data = r.json()
        if not data:
            return None
        hit = data[0]
        return {
            "display_name": hit.get("display_name"),
            "lat": float(hit["lat"]),
            "lon": float(hit["lon"]),
            "source": "openstreetmap_nominatim",
        }
    except Exception as e:
        print(f"[OSM] geocode failed: {e}")
        return None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import radians, sin, cos, sqrt, atan2

    r = 6371.0
    p1, p2 = radians(lat1), radians(lat2)
    dp = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * r * atan2(sqrt(a), sqrt(1 - a))


async def tour_route(cities: list[str]) -> dict[str, Any]:
    """Order cities by nearest-neighbor from first city using free OSM geocode."""
    cleaned = [c.strip() for c in cities if c and str(c).strip()]
    if len(cleaned) < 2:
        return {"route": cleaned, "legs_km": [], "total_km": 0, "note": "Need 2+ cities"}

    points = []
    for c in cleaned[:12]:
        g = await nominatim_geocode(c)
        if g:
            points.append({"city": c, **g})
        else:
            points.append({"city": c, "lat": None, "lon": None})

    # nearest neighbor from first geocoded
    remaining = [p for p in points if p.get("lat") is not None]
    if not remaining:
        return {"route": cleaned, "legs_km": [], "total_km": 0, "note": "Geocode failed"}

    ordered = [remaining.pop(0)]
    legs = []
    while remaining:
        last = ordered[-1]
        best_i, best_d = 0, 1e18
        for i, p in enumerate(remaining):
            d = haversine_km(last["lat"], last["lon"], p["lat"], p["lon"])
            if d < best_d:
                best_d, best_i = d, i
        nxt = remaining.pop(best_i)
        legs.append({"from": last["city"], "to": nxt["city"], "km": round(best_d, 1), "mi": round(best_d * 0.621371, 1)})
        ordered.append(nxt)

    total = sum(x["km"] for x in legs)
    return {
        "route": [p["city"] for p in ordered],
        "points": ordered,
        "legs_km": legs,
        "total_km": round(total, 1),
        "total_mi": round(total * 0.621371, 1),
        "source": "openstreetmap_nominatim",
    }


async def discogs_search(query: str, limit: int = 8) -> dict[str, Any]:
    """
    Discogs API — free with DISCOGS_TOKEN (personal access token, free account).
    Without token returns empty + setup note (still free to enable).
    """
    token = (os.getenv("DISCOGS_TOKEN") or os.getenv("DISCOGS_KEY") or "").strip()
    q = (query or "").strip()
    if not q:
        return {"results": [], "note": "empty query"}
    if not token:
        return {
            "results": [],
            "note": "Set free DISCOGS_TOKEN from discogs.com/settings/developers to enable catalog search.",
            "enabled": False,
        }
    headers = {"User-Agent": UA, "Authorization": f"Discogs token={token}"}
    params = {"q": q, "type": "artist", "per_page": str(limit)}
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            r = await client.get("https://api.discogs.com/database/search", params=params)
            r.raise_for_status()
            data = r.json()
        results = []
        for hit in data.get("results") or []:
            results.append({
                "id": hit.get("id"),
                "title": hit.get("title"),
                "type": hit.get("type"),
                "thumb": hit.get("thumb"),
                "cover_image": hit.get("cover_image"),
                "resource_url": hit.get("resource_url"),
                "uri": f"https://www.discogs.com{hit.get('uri')}" if hit.get("uri") else None,
            })
        return {"results": results, "enabled": True, "source": "discogs"}
    except Exception as e:
        return {"results": [], "enabled": True, "error": str(e)}


RELEASE_CHECKLIST = [
    {"id": "mix_lock", "label": "Mix is final — no more changing the arrangement"},
    {"id": "master", "label": "Track mastered for streaming (Studio does this)"},
    {"id": "meters", "label": "Checked that it reads as streaming-ready in Studio"},
    {"id": "isrc", "label": "ISRC assigned — the ID that tracks your song's plays"},
    {"id": "upc", "label": "UPC assigned, if you're releasing an EP or album"},
    {"id": "artwork", "label": "Cover art ready at 3000×3000 pixels"},
    {"id": "metadata", "label": "Title, writers, producers, and features all spelled right"},
    {"id": "splits", "label": "Split sheet signed by everyone who wrote it (Contracts → Split sheet)"},
    {"id": "contract", "label": "Any label or distribution deal checked in Contracts"},
    {"id": "epk", "label": "Press kit ready — bio, photos, links (start one in Roster)"},
    {"id": "distro", "label": "Sent to your distributor (DistroKid, CD Baby, or similar)"},
    {"id": "pitch_playlists", "label": "List drafted of playlists and press to pitch"},
    {"id": "social_assets", "label": "Short clips and cover image ready for socials"},
    {"id": "release_day", "label": "Release-day posts written and scheduled"},
    {"id": "week_1", "label": "First-week posts planned, and time set aside to reply to people"},
]
