"""
MusicBrainz + Cover Art Archive — free, open music metadata.
https://musicbrainz.org/doc/MusicBrainz_API
Respect 1 req/s and meaningful User-Agent.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Optional

import httpx

UA = "TheSourceEngine/3.0 (https://www.thesourceengine.com; contact@thesourceengine.com)"
MB = "https://musicbrainz.org/ws/2"
CAA = "https://coverartarchive.org"

_last_call = 0.0
_lock = asyncio.Lock()


async def _throttle():
    global _last_call
    async with _lock:
        now = time.monotonic()
        wait = 1.05 - (now - _last_call)
        if wait > 0:
            await asyncio.sleep(wait)
        _last_call = time.monotonic()


async def search_artist(query: str, limit: int = 8) -> dict[str, Any]:
    q = (query or "").strip()
    if len(q) < 1:
        return {"artists": [], "error": "empty query"}
    await _throttle()
    params = {"query": q, "fmt": "json", "limit": str(limit)}
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": UA}) as client:
        r = await client.get(f"{MB}/artist", params=params)
        r.raise_for_status()
        data = r.json()
    artists = []
    for a in data.get("artists") or []:
        artists.append({
            "id": a.get("id"),
            "name": a.get("name"),
            "type": a.get("type"),
            "country": a.get("country"),
            "disambiguation": a.get("disambiguation"),
            "score": a.get("score"),
            "tags": [t.get("name") for t in (a.get("tags") or [])[:8] if t.get("name")],
        })
    return {"artists": artists}


async def artist_releases(artist_id: str, limit: int = 12) -> dict[str, Any]:
    if not artist_id:
        return {"releases": []}
    await _throttle()
    params = {
        "artist": artist_id,
        "fmt": "json",
        "limit": str(limit),
        "status": "official",
        "type": "album|ep|single",
    }
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": UA}) as client:
        r = await client.get(f"{MB}/release", params=params)
        r.raise_for_status()
        data = r.json()
    releases = []
    for rel in data.get("releases") or []:
        rid = rel.get("id")
        releases.append({
            "id": rid,
            "title": rel.get("title"),
            "date": rel.get("date"),
            "country": rel.get("country"),
            "status": rel.get("status"),
            "cover_art_url": f"{CAA}/release/{rid}/front-250" if rid else None,
            "cover_art_full": f"{CAA}/release/{rid}/front-500" if rid else None,
            "musicbrainz_url": f"https://musicbrainz.org/release/{rid}" if rid else None,
        })
    return {"releases": releases}


async def release_cover(release_id: str) -> dict[str, Any]:
    if not release_id:
        return {"images": []}
    await _throttle()
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": UA}, follow_redirects=True) as client:
        r = await client.get(f"{CAA}/release/{release_id}")
        if r.status_code == 404:
            return {"images": [], "note": "No cover art in Cover Art Archive"}
        r.raise_for_status()
        data = r.json()
    images = []
    for img in data.get("images") or []:
        images.append({
            "front": img.get("front"),
            "thumb": (img.get("thumbnails") or {}).get("250") or (img.get("thumbnails") or {}).get("small"),
            "image": img.get("image"),
        })
    return {"images": images}


async def epk_bundle(artist_query: str) -> dict[str, Any]:
    """One-shot EPK metadata pack for profile/landing."""
    found = await search_artist(artist_query, limit=5)
    artists = found.get("artists") or []
    if not artists:
        return {"query": artist_query, "artist": None, "releases": [], "source": "musicbrainz"}
    top = artists[0]
    rels = await artist_releases(top["id"], limit=10)
    return {
        "query": artist_query,
        "artist": top,
        "candidates": artists[:5],
        "releases": rels.get("releases") or [],
        "source": "musicbrainz+coverartarchive",
        "license_note": "Metadata © MusicBrainz contributors (CC0/CC BY-NC-SA where applicable). Cover Art Archive images have their own licenses.",
    }
