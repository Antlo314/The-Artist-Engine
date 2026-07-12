"""
Deterministic, open-source-style contract linter — no AI required.
Flags predatory / beneficial music-industry language for UI highlighting.
Not legal advice.
"""

from __future__ import annotations

import re
from typing import Any

# pattern, severity, label, risk, fix_hint
RULES: list[tuple[str, str, str, str, str]] = [
    (r"\bin\s+perpetuity\b", "critical", "In Perpetuity",
     "Rights may never return to the artist.",
     "Demand a reversion or fixed term (e.g. 5–10 years) with clear end date."),
    (r"\bcross[-\s]?collateraliz", "critical", "Cross-Collateralization",
     "Losses on one project can wipe earnings from others.",
     "Carve out: each project accounts separately."),
    (r"\b360\s*(deal|agreement)?\b", "high", "360 Deal",
     "Label may take a cut of touring, merch, brand, and more.",
     "Cap ancillary rights or exclude tour/merch entirely."),
    (r"\bwork\s+for\s+hire\b|\bwork[-\s]for[-\s]hire\b", "critical", "Work For Hire",
     "You may assign authorship / copyright outright.",
     "Prefer license over assignment; retain copyright where possible."),
    (r"\brecoup(?:ment|able)?\b", "high", "Recoupment",
     "Advances and costs come out of your royalties first.",
     "Define what is recoupable; exclude marketing without approval."),
    (r"\bleaving\s+member\b", "high", "Leaving Member Clause",
     "Exiting a group can trigger punitive royalties or freezes.",
     "Negotiate fair buyout / sunset for departing members."),
    (r"\bcontrolled\s+composition\b", "high", "Controlled Composition",
     "Mechanical rate may be reduced on your own songs.",
     "Strike or limit reduced rate; full statutory preferred."),
    (r"\bnet\s+profits?\b", "medium", "Net Profits",
     "Opaque deductions can zero out 'net'.",
     "Prefer gross participation or tightly defined deductions list."),
    (r"\bblack\s+box\b", "medium", "Black Box Royalties",
     "Unmatched royalties may be kept by the company.",
     "Require audit rights and distribution of black-box monies."),
    (r"\bmoral\s+rights\b", "medium", "Moral Rights Waiver",
     "You may waive credit or integrity protections.",
     "Preserve credit; limit waiver to necessary territories."),
    (r"\boption\s+period", "high", "Option Periods",
     "Company can hold you for more albums on their terms.",
     "Limit options; set delivery/release commitments."),
    (r"\bright\s+of\s+first\s+refusal\b|\bROFR\b", "medium", "Right of First Refusal",
     "Can slow or block future deals.",
     "Time-box ROFR and exclude certain partners."),
    (r"\bpackaging\s+deduction\b", "medium", "Packaging Deduction",
     "Reduces royalty base on physical (and sometimes digital).",
     "Eliminate packaging deductions on digital."),
    (r"\bindemnif", "medium", "Indemnification",
     "You may pay their legal costs for broad claims.",
     "Make indemnification mutual and fault-based."),
    (r"\bforce\s+majeure\b", "low", "Force Majeure",
     "Excuses performance in extreme events — check balance.",
     "Ensure force majeure is mutual and time-limited."),
    (r"\bminimum\s+delivery\b", "medium", "Minimum Delivery",
     "Delivery pressure without release obligation.",
     "Pair with release commitment / pay-or-play."),
    (r"\bexclusive\s+(?:recording|services)\b", "high", "Exclusivity",
     "Blocks side projects or other labels.",
     "Carve out features, sync, and side projects."),
    (r"\birrevocab", "high", "Irrevocable Grant",
     "Hard to unwind rights once granted.",
     "Add cure periods and reversion triggers."),
    (r"\bworldwide\b.*\bperpetual\b|\bperpetual\b.*\bworldwide\b", "critical", "Worldwide Perpetual",
     "Global forever grant is maximum lock-in.",
     "Limit term and territory."),
    # Beneficial (info)
    (r"\breversion\b", "info", "Reversion Clause",
     "Rights may return to you — protective.",
     "Keep and define clear triggers."),
    (r"\baudit\s+rights?\b", "info", "Audit Rights",
     "You can verify royalty statements.",
     "Preserve frequency and lookback period."),
    (r"\bsunset\s+clause\b", "info", "Sunset Clause",
     "Commissions phase out after exit.",
     "Keep for managers/agents."),
    (r"\bkey\s+man\b|\bkey[-\s]man\b", "info", "Key Man Clause",
     "Protects if your champion leaves the company.",
     "Name the person; allow termination if they leave."),
    (r"\bfavou?red\s+nations\b", "info", "Favored Nations",
     "You get terms as good as peers.",
     "Keep where possible."),
    (r"\bpay\s+or\s+play\b", "info", "Pay or Play",
     "You get paid even if not released/used.",
     "Keep for recording/tour commitments."),
]


def lint_text(text: str) -> dict[str, Any]:
    raw = text or ""
    if not raw.strip():
        return {
            "findings": [],
            "summary": "No text to lint.",
            "disclaimer": DISCLAIMER,
            "integrity_hint": None,
        }

    findings = []
    seen = set()
    for pattern, severity, label, risk, fix in RULES:
        for m in re.finditer(pattern, raw, flags=re.IGNORECASE):
            key = (label, m.start())
            if key in seen:
                continue
            seen.add(key)
            start = max(0, m.start() - 40)
            end = min(len(raw), m.end() + 40)
            snippet = raw[start:end].replace("\n", " ").strip()
            findings.append({
                "severity": severity,
                "label": label,
                "clause_snippet": snippet,
                "risk": risk,
                "fix": fix,
                "offset": m.start(),
            })

    # Score: start 80, critical -18, high -10, medium -5
    score = 80
    for f in findings:
        if f["severity"] == "critical":
            score -= 18
        elif f["severity"] == "high":
            score -= 10
        elif f["severity"] == "medium":
            score -= 5
        elif f["severity"] == "info":
            score += 2
    score = max(5, min(98, score))

    crit = sum(1 for f in findings if f["severity"] == "critical")
    high = sum(1 for f in findings if f["severity"] == "high")

    return {
        "findings": findings,
        "counts": {
            "critical": crit,
            "high": high,
            "medium": sum(1 for f in findings if f["severity"] == "medium"),
            "info": sum(1 for f in findings if f["severity"] == "info"),
            "total": len(findings),
        },
        "integrity_hint": score,
        "summary": (
            f"Rule-based scan found {len(findings)} term hits "
            f"({crit} critical, {high} high). This is a keyword linter, not a lawyer."
        ),
        "disclaimer": DISCLAIMER,
        "method": "regex_codex_linter_v1",
    }


DISCLAIMER = (
    "Not legal advice. The Source Engine’s contract tools (rule linter + AI scan) "
    "are educational aids for independent artists. They do not create an attorney–client "
    "relationship. Have a qualified entertainment attorney review any agreement before signing."
)
