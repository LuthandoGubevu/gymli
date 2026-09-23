# Gymli — Design Prompt (Dark, Modern, Sleek)

Paste this into the design step of your rebuild, ahead of or alongside the
functional spec. It's a visual direction only — no features here, just how
the app should look and feel.

---

## Direction

Design Gymli as a **dark-mode-native, premium fitness app** — the kind of
polish you'd expect from a high-end training app or a fintech dashboard,
not a generic admin panel with a dark toggle bolted on. Dark isn't a theme
option here, it's the identity: deep charcoal/near-black surfaces, a single
confident accent color doing all the work, generous negative space, and
restrained, purposeful motion. Think Nike Training Club or Whoop's app
crossed with a clean SaaS dashboard — energetic but not loud, premium but
not cold.

Avoid: flat corporate blue, rainbow gradients, cluttered dashboards with
too many competing accent colors, skeuomorphic gym clichés (barbell icons
everywhere, aggressive red/black "extreme sports" styling).

---

## Color system

Build the palette as HSL CSS custom properties (works cleanly with
Tailwind + shadcn/ui, and makes future per-tenant branding trivial — swap
the variable values, not the components).

**Base (dark, primary mode):**
- `--background`: `222 47% 8%` — near-black navy, not pure black (pure
  black reads harsh on OLED and kills depth cues)
- `--surface` / `--card`: `222 41% 12%`, with a subtle 1px border at
  `222 20% 20%` rather than relying on shadows alone for elevation (shadows
  barely read on dark backgrounds — use lightness steps instead)
- `--surface-elevated` (modals, popovers, anything "above" the card layer):
  `222 38% 16%`
- `--foreground` (primary text): `210 20% 96%`
- `--muted-foreground` (secondary text): `215 15% 65%`
- `--border`: `222 20% 20%`

**Accent — pick one confident, energetic color and commit to it everywhere**
(buttons, active states, progress bars, key numbers, focus rings). A warm
amber/gold reads premium and athletic without the cliché of gym-app red:
- `--primary` / `--accent`: `45 93% 52%` (`#FACC15`-family gold)
- `--primary-foreground`: near-black (`222 47% 11%`) for text/icons sitting
  on top of the accent color, for contrast
- Reserve a second, quieter accent only for semantic states — success
  (`142 70% 45%`, a clean green), warning (`38 90% 55%`), destructive
  (`0 70% 55%`) — never for decoration.

**Glass/depth accents (optional but recommended for a "sleek" feel):**
cards and the mobile sidebar can use a semi-transparent surface
(`222 41% 14% / 0.6`) with a light backdrop blur over a subtle background
image or gradient mesh, so the UI feels like it's floating over depth
rather than sitting on a flat fill. Use this sparingly — the main content
surfaces (tables, forms) should stay fully opaque for legibility.

**Light mode:** support it, but treat dark as the default and the one that
gets the most design attention. Light mode should feel like the same
product, not a different one — same accent color, same radius/spacing
scale, just inverted surfaces (white/near-white backgrounds, dark text).

---

## Typography

Pair a **display face with real character** for numbers/headlines against
a **clean, highly legible body face** — don't use the same font for both,
and avoid the default-feeling combos (Inter+Inter, or the ChatGPT-esque
"Söhne everywhere" look).

- **Display / headlines / big stat numbers** (streak counts, PR weights,
  the crowd-meter percentage): something with real weight and a bit of
  personality at large sizes — e.g. **Space Grotesk** or **General Sans**
  for a modern-technical feel, or **Fraunhofer/Newsreader** if you want a
  touch of editorial warmth against the athletic accent color. Bold/black
  weights only, used sparingly for the numbers that matter most on a
  screen.
- **Body / UI text**: **Inter**, **IBM Plex Sans**, or **Geist** — whichever
  you pick, use it consistently for labels, buttons, form fields,
  paragraph copy. Regular/medium weights, never light-weight body text on
  a dark background (fails contrast).
- **Data / numeric tables, timestamps, code-like values**: a monospace
  (**IBM Plex Mono**, **JetBrains Mono**) for anything tabular or precise
  — class times, PR values, leaderboard ranks — gives the "premium
  dashboard" feel and makes numbers easy to scan.
- Big, confident numerals for stats (streak days, member count, capacity
  %) — these should be the visual focal points of their cards, not
  competing with a dozen other same-sized text elements.

---

## Shape, elevation, spacing

- **Border radius**: generous but not bubbly — `0.75rem`–`1rem` on cards,
  slightly smaller (`0.5rem`) on inputs/buttons. Consistent across every
  component; don't mix radius scales.
- **Elevation on dark surfaces comes from lightness steps and a thin
  border, not drop shadows.** A card that's meant to feel "above" the page
  should be a lighter shade of the background, not a darker one with a
  shadow underneath — shadows read as almost invisible on dark UIs.
- **Spacing**: generous padding inside cards (at least `1.25rem`–`1.5rem`),
  clear vertical rhythm between sections (`1.5rem`–`2rem` gaps). Don't
  cram a dashboard — this app should feel calm, not busy, even with a lot
  of data on screen.
- **One accent color glow, used deliberately**: a soft box-shadow in the
  accent color (low opacity, large blur) behind the primary CTA button or
  the active nav item is a good "premium dark app" signature — don't
  overuse it on every element or it stops meaning anything.

---

## Components & patterns

- **Buttons**: solid accent-fill for primary actions (dark text on gold,
  per the contrast pairing above), outline/ghost for secondary actions.
  Confident sizing — don't undersize tap targets on what's fundamentally a
  mobile-first PWA.
- **Cards**: the primary content unit throughout — stat cards, feature
  cards, list rows. Consistent internal layout: icon or stat top-left,
  label beneath, supporting detail in muted text.
- **Progress/meter elements** (crowd meter, streak progress, workout plan
  completion): color-coded using the semantic accents above (green→amber→
  red as capacity/intensity rises), animated smoothly on value change, not
  jarring instant jumps.
- **Navigation**: a collapsible icon+label sidebar on desktop/tablet, a
  fixed bottom tab bar on mobile — both should use the accent color only
  for the active state, muted foreground for inactive, never more than one
  "loud" element in the nav at a time.
- **Empty states**: every list/feed needs a designed empty state (icon +
  one line of copy + a clear next action), not a bare "no data" string —
  this app has several natural empty states (no matches yet, no notices,
  no PRs logged) and they're a real chance to reinforce the premium feel.
- **Forms**: dark inputs with a visible but subtle border, a clear focus
  ring in the accent color, inline validation messages in the destructive
  color — never rely on color alone, pair with an icon/text for
  accessibility.

---

## Motion

Restrained and purposeful, not decorative:
- Micro-interactions on interactive elements (subtle scale/opacity on
  press, smooth color transition on hover) — 150-200ms, ease-out.
- Meaningful state changes get a real transition: a matched Gym Buddy, a
  newly earned badge, a completed set on the crowd meter — these moments
  deserve a small celebratory animation (a brief scale/glow pulse), since
  they're the emotional high points of the product. Don't animate
  everything equally; save motion for moments that matter.
- Page/route transitions should be fast and simple (fade or slight slide),
  never a long branded loading animation that gets in the way of a
  frequently-used app.

---

## Imagery

- If using photography (e.g. a hero background on the marketing/landing
  page), use real gym/training photography with a dark gradient overlay
  for text legibility — never stock photos that look staged. Keep photos
  out of the core app UI (dashboard, admin) — those screens should be
  data/UI-driven, not decorated with imagery, to keep them feeling like a
  precise tool rather than a brochure.
- Icons: one consistent icon set throughout (Lucide is a good default —
  clean, consistent stroke width, wide coverage). Never mix icon styles
  (don't combine filled and outlined icons in the same view).

---

## One-line brief, if you need to hand this off in a sentence

*"A dark-mode-native fitness PWA with a single confident gold accent, big
confident numerals for stats, glass-panel depth via lightness steps rather
than shadows, and restrained motion reserved for real moments — premium
training-app energy, not a generic dashboard with the lights off."*
