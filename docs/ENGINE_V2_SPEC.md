# ENGINE V2 — "COMMAND BRIDGE" SPEC
Architecture + design decisions (authored on Fable; implement on Opus).
Deployed target: https://the-artist-enginev2.vercel.app/engine

## Thesis
The current /engine looks right but is hollow: hardcoded stats (1.24M streams,
$42,050), a permanently-dead "Revenue Velocity" chart, and five siloed views.
V2 removes every fake number. The dashboard becomes a real operations hub where
every stat, event, and pipeline card is the trace of something the user actually
did. Honest > impressive-looking. (Investors WILL ask "is that real?")

## 1. Central state — `frontend/src/lib/engineState.tsx`
Single lightweight store. React Context + useReducer, persisted to
localStorage key `engine_state_v1` (merge-on-load, version field for future
migrations). NO redux/zustand — zero new deps.

```ts
interface EngineState {
  version: 1;
  stats: {                      // ALL start at 0, increment on real actions
    mastersCompleted: number;
    venuesScouted: number;
    pitchesDrafted: number;
    contractsScanned: number;
    threatsFlagged: number;     // red_flags count from Zion scans
  };
  pipeline: Lead[];             // booking funnel
  activity: ActivityEvent[];    // capped at 50, newest first
}
interface Lead {
  id: string;                   // `${venueName}-${addedAt}` (no uuid dep)
  venueName: string; city: string;
  stage: 'scouted' | 'pitched' | 'negotiating' | 'booked' | 'dead';
  reputationScore?: number; payoutModel?: string; grossPotential?: number;
  verifiedLive?: boolean;       // came from ticketmaster_live source
  addedAt: number; updatedAt: number;   // Date.now() at action time
}
interface ActivityEvent {
  id: string; ts: number;
  kind: 'master' | 'scout' | 'pitch' | 'scan' | 'pipeline' | 'system';
  label: string;                // e.g. "Mastered SOVEREIGN_MASTER.wav (-1.0 dBTP)"
  accent?: 'audio' | 'radar' | 'zion' | 'shark' | 'ember';
}
```
Exports: `EngineProvider`, `useEngine()` returning `{state, record}` where
`record` = typed action helpers: `recordMaster(filename, format)`,
`recordScout(city, genre, venues[])` (also bulk-adds Leads at 'scouted',
deduped by venueName), `recordPitch(venueName, type)` (moves lead → 'pitched'),
`recordScan(flagCount, integrityScore)`, `moveLead(id, stage)`,
`clearActivity()`.
Mount `<EngineProvider>` in EngineCore.tsx wrapping all views.

## 2. Instrument existing views (surgical — do NOT restructure them)
- StudioCore: after successful /api/master response → `recordMaster(...)`.
- GigRadar: after successful /api/scout → `recordScout(...)` with venue array
  + `source === 'ticketmaster_live'` flag; after pitch drafted → `recordPitch`.
  Existing "PITCHED" local mutation stays; it additionally calls recordPitch.
- ZionSentinel: after successful analysis → `recordScan(redFlags.length, score)`.
Each is a 2-4 line insertion at the existing success paths. Nothing else moves.

## 3. Dashboard v2 — `components/Dashboard.tsx` full rewrite
Layout (12-col grid, keep ember-red accent + font-display):
1. **Stat row** (5 cards): Masters / Venues Scouted / Pitches / Contracts
   Scanned / Threats Flagged — from state.stats. Empty state (all zero) shows
   "—" with sub-label "awaiting first op", NOT fake numbers.
2. **Booking Pipeline board** (main panel, replaces dead Revenue Velocity):
   4 columns Scouted → Pitched → Negotiating → Booked. Lead cards show venue,
   city, rep score chip, gross potential, ✓ LIVE badge when verifiedLive.
   Advance/kill via small stage buttons on card (no drag-drop lib; buttons only).
   Empty state: "Pipeline empty — run a scout in the WAR ROOM" + CTA button
   switching activeView to 'radar' (pass setActiveView down or via context).
3. **Activity feed** (right rail): state.activity list, accent-dot per kind,
   relative timestamps ("4m ago"). Empty: "No operations logged yet."
4. **System telemetry strip** (bottom): fetch `/api/system-status` once on
   mount → ENGINE CORE online/offline dot + key_verified + GEMINI_MODEL name;
   show TICKETMASTER GRID: LIVE when a past scout had verifiedLive (from state)
   else STANDBY. Handle fetch failure as "OFFLINE — cold start likely, retry
   in 60s" (Render free tier).
Keep the animated EQ bars strip as decoration if desired — it reads as vibe,
not as a fake metric.

## 4. Shell polish — EngineCore.tsx (light touch)
- Replace background <video> with static gradient + `.grain` (kills 1.2MB
  payload + mobile battery drain). Keep sidebar/bottom-nav structure as-is.
- Treasury widgets in header currently show hardcoded fiat/crypto from
  profile: keep (user-entered = honest), but label "SELF-REPORTED".
- Do NOT touch the MOBILE LOCKDOWN studio gate.

## 5. Explicitly out of scope for this pass
- No backend changes. No new deps. No routing changes. No auth.
- No drag-and-drop. No charts lib — if a trend viz is wanted later, sparkline
  via inline SVG from activity timestamps.

## 6. Verification checklist (run before commit)
1. `npm run build` clean.
2. Dev flow: run scout → leads appear in pipeline + stat increments + activity
   logs; draft pitch → lead moves to Pitched; master a file → Masters stat +1;
   Zion scan → Contracts +1 & Threats +N. Refresh page → state persists.
3. All-zero fresh state renders clean empty states (no NaN, no "undefined").
4. No console errors. Commit + push immediately (IDE reset risk).
