# ENGINE UI V3 — "CLARITY PROTOCOL" REDESIGN SPEC
Full /engine redesign: enterprise-grade, instantly understandable, cinematic.
Authored on Fable — execute on Opus. Target: all views under /engine.

## Design thesis
motionsites.ai patterns applied: luxury-minimal typography, dark glass panels,
video used as *contained ambient texture* (not wallpaper), generous whitespace,
one bold accent per surface. The user should never have to decode the UI:
every label says what it does; the brand voice lives in accents/microcopy,
not in navigation. Every number shown is real (Engine v2 rule stands).

## Non-negotiables
- KEEP: Sovereign Cinema tokens (ink/ember/accents), Clash Display + Satoshi +
  JetBrains Mono, engineState telemetry (v2), all API wiring, all handlers.
- KEEP the original videos, but ONLY as PageHeader ambient bands (below).
- KILL: fake treasury widgets + "+12% M/M" badge, "SECTOR-7G/MODULE-READY"
  status line, "OMEGA TIER" chrome, clip-path gimmicks (shape-cyber-leaf,
  shape-chamfer-br) in app views, glitch-hover in app views, full-page bg videos.
- Copy rule: labels are plain English; flavor goes in small mono sub-captions.
  e.g. Title "Find Gigs" + sub "GIG RADAR ARRAY · LIVE TICKETING GRID".
- No new deps. Cosmetic/structural JSX only — never touch fetch logic,
  state management, or engineState recording calls.

## 1. Shared primitives — `frontend/src/components/ui/Shell.tsx`
One file exporting small shared pieces (keeps diff surface tiny):

**PageHeader** `{video, accent, module, title, desc, children?}`
- Band: `relative overflow-hidden rounded-2xl border border-white/10 mb-8`,
  height ~180px desktop / 140px mobile.
- Video: absolute inset-0, object-cover, `opacity-35`, autoplay/loop/muted/
  playsInline (plain <video>, not dangerouslySetInnerHTML).
- Overlays: `bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/30`
  + bottom fade `from-ink-950`. Content sits left-bottom, z-10, p-6/8:
  - module line: mono 10px tracking-[0.3em] uppercase, colored `accent`
  - title: font-display text-3xl/4xl font-semibold text-ink-50
  - desc: text-ink-200 font-light text-sm max-w-xl (ONE plain sentence)
  - children slot right side (e.g. primary action button)
- Video map: radar→/gig-radar.mp4 · studio→/audio-core.mp4 ·
  legal→/legal-war.mp4 · dashboard→/site/soverein_server.mp4 ·
  profile→no video (use light_abstract png at opacity-20).

**Panel** `{title?, sub?, accent?, actions?, children}` — glass-obsidian
rounded-xl border-white/10; header row (font-display text-base title, mono
sub, actions right), p-5/6 body. THE only card. Replaces ad-hoc panels.

**Field** `{label, hint?, children}` — mono 10px uppercase tracking label,
ink-400; consistent input styling: `bg-ink-900 border border-white/10
rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-700 text-sm
focus:border-{accent}/50 focus:outline-none transition-colors w-full`.

**Btn** variants: `primary` (rounded-full bg-ember-600 hover:bg-ember-500
font-display font-medium text-white px-6 py-3), `accent` (same but per-view
color w/ text-ink-950), `ghost` (border border-white/10 hover:border-white/25
text-ink-200), `danger-ghost`. Sizes sm/md. Disabled = opacity-40.

**EmptyState** `{icon, title, hint, cta?}` — dashed border-white/10 rounded-xl,
centered, py-12. Used for every zero state.

**StepHint** `{steps: string[]}` — tiny horizontal "1 → 2 → 3" strip (mono
10px, ink-400, accent numbers) under headers of tool pages so first-time
users see the flow: e.g. Studio: "1 Drop your mix · 2 Drop a reference ·
3 Master & download".

## 2. Shell redesign — EngineCore.tsx
- Sidebar: keep structure; remove rounded-tr/br asym shape → clean
  `border-r border-white/10` full-height. Nav items get plain labels +
  tiny descriptions:
  dashboard "Dashboard / Overview & pipeline" · radar "Find Gigs / Live venue
  scouting" · studio "Studio / Mastering & analysis" · legal "Legal /
  Contracts & splits" · profile "Profile / Identity & settings".
  Item style: rounded-lg, active = bg-white/5 + left 2px ember bar +
  text-ink-50; inactive = text-ink-400 hover:text-ink-50 hover:bg-white/5.
  Icons 18px, label text-sm font-medium, desc mono 9px ink-400 (hide desc
  when narrow).
- Header bar: REMOVE treasury widgets and +12% badge and SECTOR-7G line.
  Replace with: left = breadcrumb "Engine / {View label}" (mono 10px ink-400);
  right = live status chip (reuses dashboard's system check pattern or static
  dot + "Systems nominal") + artist avatar chip (alias + avatar, click →
  profile view).
- Background: keep v2 gradient+grain (no video).
- Mobile: bottom nav unchanged structurally; relabel to Dashboard/Gigs/
  Studio/Legal/Profile. Studio desktop-gate: reword panel → title "Studio
  needs a bigger screen", body "Waveform analysis and mastering controls are
  desktop-only for now. Everything else works great here." — friendly, no
  LOCKDOWN cosplay. Keep the gate logic.

## 3. Per-view redesigns
### Dashboard (light touch — v2 is already real)
- Wrap with PageHeader (dashboard video, ember): module "COMMAND CENTER",
  title "Dashboard", desc "Your operation at a glance — every number here is
  something you actually did."
- Convert stat cards/pipeline/activity/telemetry to Panel primitive; keep all
  v2 logic identical. Remove decorative EQ bars from header (PageHeader
  replaces).

### GigRadar → "Find Gigs"
- PageHeader (radar video, #fb923c): module "GIG RADAR ARRAY · LIVE TICKETING
  GRID", title "Find Gigs", desc "Search live event data for venues actively
  booking your genre, with payout intel and a ready-to-send pitch."
  StepHint: 1 Set your search · 2 Review verified venues · 3 Send the pitch.
- Search form → one Panel "Search": grid md:grid-cols-5 of Fields (City,
  Genre, Venue tier, Radius, Timeframe) + accent Btn "Scan for venues"
  spanning right. Kill jargon placeholders; selects styled per Field recipe.
- Results: keep ALL data + logic; recompose each card as Panel-style:
  header = venue name (font-display text-lg) + LIVE badge + rep score chip;
  body = 2-col meta grid (mono labels: Contact, Payout, Lead time, Capacity,
  Gross potential $); leverage callout = left-border accent box; footer =
  Btn accent "Draft pitch" (was ONE-CLICK ENGAGE) + ghost link icons.
  Straight rounded-xl corners (no cyber-leaf). "Alpha Target" ring → subtle
  `ring-1 ring-orange-500/40` + small "BEST ODDS" chip.
- Loading: keep LoadingProgressBar; error copy → "Search failed — the engine
  may be waking up (free hosting naps after 15 min). Try again in a minute."
- Pitch modal: same logic; restyle to Panel look, tabs = Email/Call script/DM
  as segmented control (bg-white/5 rounded-full, active bg-orange-500
  text-ink-950).

### StudioCore → "Studio"
- PageHeader (audio-core video, #22d3ee): module "AUDIO MASTER CORE",
  title "Studio", desc "Drop your mix and a reference track — get a
  streaming-ready master back in about a minute."
  StepHint: 1 Drop your mix · 2 Drop a reference · 3 Master & download.
- Dropzone phase: two side-by-side Panels "Your mix" / "Reference track"
  (plain-English!), each a large dashed drop target with file chip + play
  preview; below: format segmented control (WAV/MP3/FLAC) + Oracle Panel
  ("AI Mix Analysis — let the Oracle listen first and set the dials for
  you") with accent Btn "Analyze my mix"; primary Btn "Master it".
- Tuning phase: knobs keep logic; group in Panel "Master controls" with
  human labels + one-line hints: Sub "low-end weight" · Air "top-end shine" ·
  Snap "punch" · Width "stereo space". A/B + download in Panel "Result".
- Remove hue-rotate video overlay in processing state; processing = Panel
  with progress bar + rotating status copy (keep timing logic).

### LegalCore → "Legal"
- PageHeader (legal-war video, #a78bfa): module "ZION LEGAL SENTINEL",
  title "Legal", desc "Scan contracts for predatory clauses, model your
  recoupment, and generate split sheets."
- Tabs → segmented control: "Contract Scanner" (ZionSentinel) · "Term Codex" ·
  "Recoupment Calculator" · "Split Sheets". Keep components; restyle their
  internal panels to Panel primitive; forms to Field recipe. Scanner CTA:
  "Scan contract". Results keep gauge + flags; flag cards = Panel with
  severity left-border (red/orange/emerald).

### ArtistProfile → "Profile"
- PageHeader (no video, gold #eab308): module "SOVEREIGN IDENTITY",
  title "Profile", desc "Your artist identity — used to personalize pitches
  and outreach."
- Two-column: Panel "Identity" (avatar + alias + manager fields, Field
  recipe, "Saved automatically" caption instead of fake save theater —
  keep existing save state logic but relabel button "Save profile").
- Treasury fields stay but inside Panel "Treasury (self-reported)" with
  caption "Shown on your dashboard header. Not connected to a bank."
- REMOVE "Premium Arsenal" locked teasers + "UPGRADE TO OMEGA TIER" button
  entirely (fake tier = investor poison). Replace with Panel "Coming soon"
  listing 3 short roadmap bullets (outcome tracking, more data sources,
  payments) — honest roadmap, no fake locks.

## 4. Execution order (each step = build + commit; IDE reset risk)
1. ui/Shell.tsx primitives.
2. EngineCore shell (nav/header/gate copy).
3. Dashboard wrap.
4. GigRadar. 5. StudioCore. 6. LegalCore suite. 7. ArtistProfile.
Per view: `npm run build` clean; verify in preview (empty + happy path,
console clean); commit; push at the end.

## 5. Acceptance checklist
- A first-time user can name what each nav item does without hovering.
- No fake numbers or fake locks anywhere in the shell/views.
- Videos visible on every tool page header, never behind body text.
- One card look, one input look, one button hierarchy everywhere.
- All existing functionality works (scout→pipeline, master, scan, pitch).
