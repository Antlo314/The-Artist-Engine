"""
Gig Radar — real-world data sources.

Primary source: Ticketmaster Discovery API (free tier, 5,000 calls/day).
It returns REAL, verified venues with real addresses and proof they actively
book shows in the requested genre/city. The strategic intel layer (payout model,
reputation, leverage) is added on top by Gemini in main.py — this module only
does the raw, deterministic data fetch so it can be tested in isolation.

If TICKETMASTER_API_KEY is not set, ticketmaster_available() returns False and
the caller falls back to the Gemini-grounded scout.
"""

import os
import re
import httpx

TM_EVENTS_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


def ticketmaster_available() -> bool:
    """True if a Ticketmaster API key is configured."""
    return bool(os.getenv("TICKETMASTER_API_KEY", "").strip())


def _radius_miles(radius: str, default: str = "50") -> str:
    """Extract a numeric mile value from a free-text radius like '50 miles'."""
    m = re.search(r"\d+", str(radius or ""))
    return m.group(0) if m else default


async def fetch_ticketmaster_venues(
    city: str,
    genre: str,
    radius: str = "50",
    timeframe: str = "",
    size: int = 50,
):
    """
    Query the Ticketmaster Discovery API for upcoming music events in `city`
    matching `genre`, then aggregate them into a list of unique real venues,
    each annotated with the upcoming events that prove it's active.

    Returns a list of venue dicts. Returns [] if the key is missing, the request
    fails, or nothing matches — the caller treats [] as "fall back to Gemini".
    """
    api_key = os.getenv("TICKETMASTER_API_KEY", "").strip()
    if not api_key:
        return []

    base_params = {
        "apikey": api_key,
        "city": city,
        "segmentName": "Music",
        "size": str(size),
        "sort": "date,asc",
        "radius": _radius_miles(radius),
        "unit": "miles",
        "countryCode": "US",
    }

    async def _query(extra: dict):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(TM_EVENTS_URL, params={**base_params, **extra})
                resp.raise_for_status()
                payload = resp.json()
        except Exception:
            # Network error, bad key, rate limit, etc. — treated as no results.
            return []
        return (payload.get("_embedded") or {}).get("events") or []

    # Pass 1: filter by genre keyword (tight, most relevant).
    events = await _query({"keyword": genre})
    # Pass 2: if the genre keyword was too narrow, fall back to ALL music events
    # in the city so we still return REAL venues for Gemini to filter by genre.
    if not events:
        events = await _query({})
    venues: dict = {}

    for ev in events:
        embedded = ev.get("_embedded") or {}
        for v in embedded.get("venues") or []:
            vid = v.get("id") or v.get("name")
            if not vid:
                continue
            if vid not in venues:
                city_obj = v.get("city") or {}
                state_obj = v.get("state") or {}
                addr_obj = v.get("address") or {}
                box = v.get("boxOfficeInfo") or {}
                venues[vid] = {
                    "name": v.get("name"),
                    "city": city_obj.get("name"),
                    "state": state_obj.get("stateCode") or state_obj.get("name"),
                    "address": addr_obj.get("line1"),
                    "website_url": v.get("url"),
                    "box_office_phone": box.get("phoneNumberDetail"),
                    "general_info": (v.get("generalInfo") or {}).get("generalRule"),
                    "genres": set(),
                    "upcoming_events": [],
                }
            entry = venues[vid]
            dates = (ev.get("dates") or {}).get("start") or {}
            if len(entry["upcoming_events"]) < 5:
                entry["upcoming_events"].append({
                    "name": ev.get("name"),
                    "date": dates.get("localDate"),
                })
            for c in ev.get("classifications") or []:
                g = (c.get("genre") or {}).get("name")
                if g and g.lower() not in ("undefined", "other"):
                    entry["genres"].add(g)

    result = []
    for v in venues.values():
        v["genres"] = sorted(v["genres"])
        result.append(v)
    return result
