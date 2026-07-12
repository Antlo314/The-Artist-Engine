# ENGINE V5 — FEATURE ENHANCEMENT SPEC ("OPTIONS PASS")
Studio first, then Find Gigs, then trickle-down. Blend with the v4 Obsidian
HUD (build v4 CSS/bento first — it's quick — then these features live inside
those liquid-glass tiles). Authored on Fable; execute on Opus.
Ground rule: every feature below is buildable on the EXISTING free stack
(pedalboard DSP + ffmpeg loudnorm + Ticketmaster + Gemini + engineState).
No new paid services. Backward compatible — old requests must still work.

════════════════════════════════════════════════════════════════
## PHASE A — STUDIO: real mastering OPTIONS
════════════════════════════════════════════════════════════════
Today: reference REQUIRED, 4 knobs, one loudness fate. Artists need choices.

### A1. Backend — extend /api/master (backward compatible)
New optional Form params (defaults preserve old behavior):
- `reference`: now OPTIONAL. No reference → skip matchering, run the DSP
  chain + loudness stage directly on the target ("Pure mode").
- `lufs_target`: float, default None. When set, run ffmpeg 2-pass loudnorm
  AFTER the pedalboard chain: measure (loudnorm print_format=json) then
  apply (I=lufs_target:TP=-1.0:LRA=11 + measured_* values). ffmpeg is
  already a validated dependency.
- `ref_influence`: 0-100, default 100. After matchering, blend
  `out = matchered*(x) + original*(1-x)` sample-wise in the worker
  (numpy; align lengths by trimming to min; original resampled to the
  matchered rate via pedalboard.io if rates differ).
- New knobs (0-100, 50 neutral, same convention as sub/air):
  - `warmth`: low-mid saturation — pedalboard Distortion(drive_db=(v-50)/12)
    ONLY on a low-passed parallel bus is overkill; simpler: PeakFilter
    (cutoff 200Hz, gain=(v-50)/12, Q=0.7) + tiny Gain compensation.
  - `presence`: PeakFilter(cutoff 3800Hz, gain=(v-50)/10, Q=0.9).
  - `demud`: CUT-only — PeakFilter(cutoff 300Hz, gain=-(max(0,v-50))/8, Q=1.2).
- `mono_bass`: bool, default false. Sum L/R below 120Hz: split via
  LowpassFilter/HighpassFilter buses in numpy (low bus → mean of channels,
  duplicated), recombine. Keeps club masters phase-tight.
Worker: matcher_worker.py takes these as extra argv (append; old call sites
updated in main.py). Chain order: [matchering?] → EQ knobs (sub, demud,
warmth, presence, air) → Compressor(snap) → Chorus(width) → mono_bass →
Limiter(-1.0) → [loudnorm?] → blend(ref_influence) — NOTE: blend BEFORE
limiter/loudnorm (blend raw matchered vs original first, then chain), i.e.
actual order: blend → EQ → dynamics → mono_bass → Limiter → loudnorm.
Loudnorm runs via subprocess ffmpeg on the wav (2 passes), then re-limit is
unnecessary (loudnorm respects TP=-1.0).

### A2. Backend — /api/oracle upgrade
Add to the JSON the model must return: `preset_recommendation` (one of the
preset keys below) + `lufs_recommendation` (number) + existing knobs (now
may include warmth/presence/demud). Prompt-only change.

### A3. Studio UI — "options without clutter" (inside HUD tiles)
- **Master Profile presets** (Segmented, top of Master controls):
  STREAMING (-14 LUFS) · CLUB (-9) · PODCAST (-16) · CUSTOM (slider -20…-8,
  0.5 steps) · OFF (no loudnorm; today's behavior). Sends lufs_target.
- **Mode**: with reference = "Reference match" + NEW `Reference influence`
  slider (100 default); without reference = auto "Pure master" badge —
  dropzone copy: reference tile gains "(optional)".
- **Knobs regrouped in 3 labeled clusters** (Tone: Sub/De-mud/Warmth/
  Presence/Air · Dynamics: Snap · Space: Width + Mono-bass toggle).
  Human hints per v3 style. Advanced cluster collapsed behind a "More
  options" disclosure so default view stays simple (Sub/Air/Snap/Width
  visible; De-mud/Warmth/Presence/Mono-bass inside).
- **Session versions** (engineState addition): every successful master
  push {id, ts, settings summary, objectURL} to a `masters` array (cap 5,
  NOT persisted to localStorage — objectURLs die on reload; keep in a
  React ref/context memory only). UI: small "This session" list in Result
  tile: v1/v2/v3 chips → click swaps audio src for instant A/B; download
  per version. Label chips with the profile used ("v2 · CLUB · ref 80%").
- Oracle card: shows preset + LUFS recommendation with one-tap "Use these
  settings" (sets knobs + profile).

════════════════════════════════════════════════════════════════
## PHASE B — FIND GIGS: from list to workflow
════════════════════════════════════════════════════════════════
### B1. Backend (small)
- /api/scout: pass timeframe into Ticketmaster as a real date window:
  map "Active Now"→next 60d, "Summer 2026"→Jun-Aug 2026, "Fall 2026"→
  Sep-Nov 2026, "Q1 2027"→Jan-Mar 2027 via startDateTime/endDateTime
  params in gig_sources.fetch_ticketmaster_venues. Fallback: omit.
- /api/draft-pitch: accept outreach_type "followup" — prompt variant:
  short, references the earlier pitch, one clear ask. UI adds it as a
  4th Segmented option in the pitch modal.
### B2. UI
- **Results toolbar** (client-only): Sort segmented [Best odds · Rep ·
  Gross $ · Capacity] + "Verified only" toggle + min-rep chip (70+).
- **Multi-city sweep**: city input accepts comma-list (max 3). Client
  loops handleScout per city sequentially (reuse existing fetch), merges
  + dedupes by venue name, tags each card with its city. Progress line
  "Scanning Austin (1/3)…".
- **Saved searches**: engineState `savedSearches` (cap 5): save current
  form; chips above the form re-run on click.
- **Export CSV**: button on results toolbar → client Blob CSV of all
  fields (name, city, contact, persona, payout, lead time, rep, capacity,
  gross, urls). Same export button on Dashboard pipeline (leads).

════════════════════════════════════════════════════════════════
## PHASE C — TRICKLE-DOWN (small, high-polish)
════════════════════════════════════════════════════════════════
- **Legal/Zion**: severity filter chips above flags (All/Critical/High/
  Warning — filter client-side on dangerLevel if present, else show all);
  "Copy rebuttal" button (navigator.clipboard) on shark_rebuttal;
  "Download analysis (.txt)" client blob. Codex: add a search input
  filtering codexEntries by term/definition (client-side).
- **Profile → personalization glue**: add fields homeCity + primaryGenre
  (Field recipe, persisted in sovereign_identity). Find Gigs initializes
  its city/genre state from profile when present (initializer only —
  do not override user edits). Studio pitch/oracle untouched.
- **Dashboard**: pipeline lead card gains a tiny note field (pencil icon →
  inline input, saved to lead.note in engineState) + CSV export button in
  the pipeline tile header.

════════════════════════════════════════════════════════════════
## EXECUTION ORDER (each step: build → verify → commit → push)
1. v4 Obsidian HUD (CSS + bento dashboard) from ENGINE_UI_V4_BENTO_SPEC.md.
2. A1 backend + worker (+ local end-to-end curl test: with/without ref,
   lufs targets, new knobs, mono_bass, ref_influence 50).
3. A2 oracle prompt + A3 Studio UI.
4. B1 backend + B2 Gigs UI (live scout test).
5. C trickle-down.
6. Full verify sweep + deploy note (Render auto-deploys from main).
## GUARDRAILS
- /api/master must still succeed with ONLY the old params (prod frontend
  compatibility during rollout).
- Worker argv growth: use "--key=value" style flags for new params instead
  of positional (parse with a tiny loop; keep first 7 positional args
  exactly as-is for backward compat).
- ffmpeg loudnorm failure → log + fall back to un-normalized output
  (never fail the job for the loudness stage).
- All new UI must use v4 tile language; no new accent colors.
