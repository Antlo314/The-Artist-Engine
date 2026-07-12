# ENGINE UI V4 — "OBSIDIAN HUD" (Liquid Glass × Bento 2.0)
Delta spec on top of v3. Keep everything v3 got right (plain labels, honest
data, PageHeader video bands, one input/button language). This pass changes
SURFACE + STRUCTURE: liquid-glass tiles, an animated bento dashboard, HUD
character. Dark, aligned with the marketing pages. Authored on Fable —
execute on Opus.

## Design intent
Simple as possible, sophisticated as hell: fewer boxes, stronger grid rhythm,
glass that feels liquid (specular, deep blur, sheen on hover), motion that
feels engineered (staggered spring entrances, breathing status dots) — never
busy. Color discipline: ember is THE accent; per-tool colors demoted to icon
tint + PageHeader module line only. No new deps (framer-motion already in).

## 1. index.css — liquid glass + HUD utilities (add; keep old classes working)
Upgrade `.glass-obsidian` in place so EVERY existing panel instantly becomes
liquid glass (zero component churn):
```css
.glass-obsidian {
  position: relative;
  background:
    linear-gradient(150deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02) 38%, rgba(255,255,255,0.05));
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow:
    0 24px 60px rgba(0,0,0,0.55),
    inset 0 1px 0 rgba(255,255,255,0.12),      /* top specular */
    inset 0 -1px 0 rgba(255,255,255,0.03);
}
```
New utilities:
- `.sheen` — liquid hover sweep. `overflow:hidden`; `::before` = skewed
  gradient bar (rgba(255,255,255,0.06)) at left:-150%, transition `left .9s
  cubic-bezier(.22,1,.36,1)`; on `:hover::before` left:150%. Pointer-events
  none.
- `.hud-corners` — HUD brackets: `::before`/`::after` 10px L-shaped corner
  ticks (border-top+left / border-bottom+right, 1px rgba(255,255,255,0.25))
  at top-left and bottom-right, 8px inset.
- `.dot-breathe` — status dot animation: keyframes scale 1→1.35→1 + opacity
  .7→1→.7, 2.4s ease-in-out infinite.
- `@media (prefers-reduced-motion: reduce)` — disable sheen transition,
  dot-breathe, and any entrance animation (see §2 fallback).

## 2. Dashboard → true animated bento (structural rewrite of layout only)
Keep ALL v2 logic/data (stats, pipeline, activity, system fetch, LeadCard,
record.*). Replace the stacked sections with ONE bento grid:
- Container: `grid grid-cols-2 lg:grid-cols-6 gap-4 auto-rows-[minmax(104px,auto)]`
  wrapped in a framer-motion parent `variants={{show:{transition:{staggerChildren:0.06}}}}`.
- Row 1 — six square-ish tiles (each `col-span-1`):
  5 stat tiles (Masters/Venues/Pitches/Contracts/Threats — same data,
  tighter: icon top-left, big tabular number, mono label) + 1 SYSTEM tile
  replacing the old bottom telemetry strip: engine dot (dot-breathe,
  green/red), "Engine online/offline", tiny lines for AI core +
  Ticketmaster grid state. Same fetch logic moved here.
- Rows 2–3: PIPELINE hero tile `col-span-2 lg:col-span-4 lg:row-span-2`
  (same board + empty state) and ACTIVITY tile `col-span-2 lg:row-span-2`
  (same feed + Clear).
- Every tile: `glass-obsidian sheen rounded-2xl p-5` + motion child
  `variants={{hidden:{opacity:0,y:24,scale:.97},show:{opacity:1,y:0,scale:1,
  transition:{type:'spring',stiffness:260,damping:26}}}}` and
  `whileHover={{y:-4}}`. Pipeline + System tiles also get `.hud-corners`.
- Color discipline inside tiles: numbers ink-50, icons ink-400, ONLY live/
  threat states use ember/emerald. Kill the per-stat accent hexes.

## 3. Panels everywhere — automatic upgrade + light touches
- All tool views already use Panel/glass-obsidian → they inherit liquid glass
  free. Add `sheen` + `rounded-2xl` to the Panel primitive root, and
  `hud-corners` opt-in prop `hud` (use it on: GigRadar Search panel, Studio
  "Drop your tracks" panel, Zion scanner panel).
- PageHeader: add `hud-corners` to the band + a thin bottom "meter" line:
  1px full-width bg-white/10 with a 20% ember segment (pure CSS, static).
- Result cards in Find Gigs: swap `glass-obsidian ... rounded-xl` →
  `glass-obsidian sheen rounded-2xl` + framer stagger on the results grid
  (same variants as dashboard tiles). Demote orange: chips/borders →
  white/10 + ink tokens; keep orange ONLY on the rep-score chip + Draft
  pitch button.
- Studio/Legal/Profile: no structural change beyond inherited glass + sheen;
  demote cyan/violet/gold the same way (icon tint + small accents only).

## 4. Acceptance
- Dashboard reads as one confident bento composition at lg (6-col), stacks
  cleanly at mobile (2-col).
- Tiles animate in with a visible but quick stagger; hover = lift + sheen.
- Only ember (+ semantic green/red) reads as color at a glance.
- prefers-reduced-motion kills all of it gracefully.
- Build clean; all logic identical (scout→pipeline etc. still work);
  zero console errors; commit + push when verified.
