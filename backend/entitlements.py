"""
Plan entitlements — single source of truth for SaaS tiers, daily limits,
feature flags, and credit costs. Promo multipliers apply at read time.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Credit costs (consumables)
# ---------------------------------------------------------------------------

CREDIT_COSTS: dict[str, int] = {
    "master": 15,
    "master_priority": 25,
    "stems": 20,
    "oracle": 5,
    "scout": 8,
    "scout_extra_city": 5,
    "pitch": 3,
    "contract": 12,
    "lint_contract": 0,
}

# ---------------------------------------------------------------------------
# Credit packs (Stripe one-time; price_env is optional override key)
# ---------------------------------------------------------------------------

CREDIT_PACKS: dict[str, dict[str, Any]] = {
    "boost": {"credits": 100, "price_usd": 9, "label": "Boost"},
    "session": {"credits": 400, "price_usd": 29, "label": "Session"},
    "tour": {"credits": 1500, "price_usd": 89, "label": "Tour"},
    "label_pack": {"credits": 5000, "price_usd": 249, "label": "Label Pack"},
}

# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------

PLANS: dict[str, dict[str, Any]] = {
    "spark": {
        "id": "spark",
        "name": "Spark",
        "price_monthly": 0,
        "price_annual": 0,
        "monthly_credits": 30,
        "credit_rollover": False,
        "max_lead_count": 10,
        "max_scout_cities": 1,
        "max_track_minutes": 6,
        "concurrent_masters": 1,
        "seats": 1,
        "daily": {
            "master": 1,
            "stems": 0,
            "oracle": 2,
            "scout": 2,
            "pitch": 3,
            "contract": 1,
        },
        "features": {
            "pure_master": True,
            "reference_master": False,
            "reference_trial": True,  # one free ref master lifetime handled separately if needed
            "master_profiles": ["STREAMING"],
            "advanced_knobs": False,
            "stems": False,
            "crm_export": False,
            "shark_tools": False,
            "split_sheet": False,
            "priority_queue": False,
        },
    },
    "creator": {
        "id": "creator",
        "name": "Creator",
        "price_monthly": 19,
        "price_annual": 180,
        "monthly_credits": 200,
        "credit_rollover": True,
        "max_lead_count": 100,
        "max_scout_cities": 2,
        "max_track_minutes": 15,
        "concurrent_masters": 1,
        "seats": 1,
        "daily": {
            "master": 5,
            "stems": 2,
            "oracle": 10,
            "scout": 8,
            "pitch": 20,
            "contract": 5,
        },
        "features": {
            "pure_master": True,
            "reference_master": True,
            "reference_trial": False,
            "master_profiles": ["STREAMING", "CLUB", "PODCAST", "CUSTOM", "OFF"],
            "advanced_knobs": "partial",
            "stems": True,
            "crm_export": True,
            "shark_tools": "partial",
            "split_sheet": True,
            "priority_queue": False,
        },
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price_monthly": 49,
        "price_annual": 468,
        "monthly_credits": 800,
        "credit_rollover": True,
        "max_lead_count": 1000,
        "max_scout_cities": 3,
        "max_track_minutes": 15,
        "concurrent_masters": 2,
        "seats": 1,
        "daily": {
            "master": 15,
            "stems": 8,
            "oracle": 25,
            "scout": 20,
            "pitch": 50,
            "contract": 15,
        },
        "features": {
            "pure_master": True,
            "reference_master": True,
            "reference_trial": False,
            "master_profiles": ["STREAMING", "CLUB", "PODCAST", "CUSTOM", "OFF"],
            "advanced_knobs": True,
            "stems": True,
            "crm_export": True,
            "shark_tools": True,
            "split_sheet": True,
            "priority_queue": True,
        },
    },
    "label": {
        "id": "label",
        "name": "Label",
        "price_monthly": 129,
        "price_annual": 1188,
        "monthly_credits": 3000,
        "credit_rollover": True,
        "max_lead_count": 50_000,
        "max_scout_cities": 5,
        "max_track_minutes": 15,
        "concurrent_masters": 4,
        "seats": 5,
        "daily": {
            "master": 40,
            "stems": 20,
            "oracle": 60,
            "scout": 50,
            "pitch": 120,
            "contract": 40,
        },
        "features": {
            "pure_master": True,
            "reference_master": True,
            "reference_trial": False,
            "master_profiles": ["STREAMING", "CLUB", "PODCAST", "CUSTOM", "OFF"],
            "advanced_knobs": True,
            "stems": True,
            "crm_export": True,
            "shark_tools": True,
            "split_sheet": True,
            "priority_queue": True,
        },
    },
}

# Actions that consume plan daily quotas
QUOTA_ACTIONS = ("master", "stems", "oracle", "scout", "pitch", "contract")

# Promo multiplies these numeric fields
_MULTIPLY_DAILY = True
_MULTIPLY_CREDITS = True
_MULTIPLY_LEADS = True
_MULTIPLY_CITIES = True


def get_plan(plan_id: Optional[str]) -> dict[str, Any]:
    pid = (plan_id or "spark").strip().lower()
    if pid not in PLANS:
        pid = "spark"
    return deepcopy(PLANS[pid])


def list_plans_public() -> list[dict[str, Any]]:
    out = []
    for p in PLANS.values():
        out.append(
            {
                "id": p["id"],
                "name": p["name"],
                "price_monthly": p["price_monthly"],
                "price_annual": p["price_annual"],
                "monthly_credits": p["monthly_credits"],
                "daily": p["daily"],
                "max_lead_count": p["max_lead_count"],
                "max_scout_cities": p["max_scout_cities"],
                "features": p["features"],
                "seats": p["seats"],
            }
        )
    return out


def credit_cost(action: str) -> int:
    return int(CREDIT_COSTS.get(action, 0))


def apply_multiplier(plan: dict[str, Any], multiplier: int) -> dict[str, Any]:
    """Return a copy of plan with usage fields multiplied (promo)."""
    m = max(1, int(multiplier or 1))
    if m == 1:
        return plan
    p = deepcopy(plan)
    if _MULTIPLY_DAILY:
        p["daily"] = {k: max(1, int(v) * m) if int(v) > 0 else 0 for k, v in p["daily"].items()}
        # stems 0 * m stays 0 — unlock stems only via plan; promo on spark keeps stems at 0
        # Exception: if stems was 0, leave 0 (feature gate still applies)
    if _MULTIPLY_CREDITS:
        p["monthly_credits"] = int(p["monthly_credits"]) * m
    if _MULTIPLY_LEADS:
        p["max_lead_count"] = min(100_000, int(p["max_lead_count"]) * m)
    if _MULTIPLY_CITIES:
        p["max_scout_cities"] = min(10, int(p["max_scout_cities"]) * m)
    p["promo_multiplier"] = m
    return p


def feature_allowed(plan: dict[str, Any], feature: str) -> bool:
    feats = plan.get("features") or {}
    val = feats.get(feature)
    if val is True:
        return True
    if val is False or val is None:
        return False
    # "partial" counts as allowed for MVP
    return True


def plan_public_card(plan_id: str) -> dict[str, Any]:
    p = get_plan(plan_id)
    return {
        "id": p["id"],
        "name": p["name"],
        "price_monthly": p["price_monthly"],
        "price_annual": p["price_annual"],
        "monthly_credits": p["monthly_credits"],
        "highlights": _highlights(p),
    }


def _highlights(p: dict[str, Any]) -> list[str]:
    d = p["daily"]
    return [
        f"{d.get('master', 0)} masters / day",
        f"{p['monthly_credits']} credits / month",
        f"{p['max_scout_cities']} scout cities",
        f"{p['max_lead_count']} CRM leads",
    ]
