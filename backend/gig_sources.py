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


def _iso(dt) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _date_window(timeframe: str):
    """Map a free-text timeframe to a (startDateTime, endDateTime) UTC window
    for the Ticketmaster API. Returns (None, None) when no window applies."""
    from datetime import datetime, timezone, timedelta
    tf = (timeframe or "").strip().lower()
    now = datetime.now(timezone.utc)
    if not tf or "active" in tf or "now" in tf:
        # Default active window: next 60 days.
        return _iso(now), _iso(now + timedelta(days=60))
    # Plain phrasing the UI now uses: "next 90 days", "next 6 months".
    rel = re.search(r"next\s+(\d+)\s*(day|week|month)", tf)
    if rel:
        n = int(rel.group(1))
        unit = rel.group(2)
        days = n if unit == "day" else n * 7 if unit == "week" else n * 30
        return _iso(now), _iso(now + timedelta(days=days))
    # Season / quarter keywords -> explicit windows.
    seasons = {
        "spring": (3, 1, 5, 31), "summer": (6, 1, 8, 31),
        "fall": (9, 1, 11, 30), "autumn": (9, 1, 11, 30), "winter": (12, 1, 2, 28),
    }
    year_match = re.search(r"(20\d{2})", tf)
    for name, (sm, sd, em, ed) in seasons.items():
        if name in tf:
            yr = int(year_match.group(1)) if year_match else now.year
            ey = yr + 1 if sm == 12 else yr  # winter spills into next year
            return (_iso(datetime(yr, sm, sd, tzinfo=timezone.utc)),
                    _iso(datetime(ey, em, ed, 23, 59, 59, tzinfo=timezone.utc)))
    qmatch = re.search(r"q([1-4])", tf)
    if qmatch:
        q = int(qmatch.group(1))
        yr = int(year_match.group(1)) if year_match else now.year
        sm = (q - 1) * 3 + 1
        em = sm + 2
        last_day = 31 if em in (1, 3, 5, 7, 8, 10, 12) else 30 if em != 2 else 28
        return (_iso(datetime(yr, sm, 1, tzinfo=timezone.utc)),
                _iso(datetime(yr, em, last_day, 23, 59, 59, tzinfo=timezone.utc)))
    return None, None


async def fetch_ticketmaster_venues(
    city: str,
    genre: str,
    radius: str = "50",
    timeframe: str = "",
    size: int = 50,
    country_code: str | None = None,
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

    try:
        from free_data import infer_country
        cc = infer_country(city, country_code)
    except Exception:
        cc = (country_code or "US").upper()

    base_params = {
        "apikey": api_key,
        "city": re.sub(r",\s*(US|USA|UK|CA|GB).*$", "", city, flags=re.I).strip() or city,
        "segmentName": "Music",
        "size": str(size),
        "sort": "date,asc",
        "radius": _radius_miles(radius),
        "unit": "miles",
        "countryCode": cc,
    }

    # Real date window from the timeframe picker (Ticketmaster start/endDateTime).
    start, end = _date_window(timeframe)
    if start and end:
        base_params["startDateTime"] = start
        base_params["endDateTime"] = end

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
