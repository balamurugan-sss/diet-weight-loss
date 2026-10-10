# Design

The app follows the reference screens supplied for Movewell: near-black flat panels
(`#121212` page, `#1e1e1e` cards), one orange accent (`#ff5a1f`, white text on it), blue
uppercase tags (`--color-tag`), Inter bold headings in title case, near-square corners,
and four tabs (My program · Explore · Meals · Me). Tokens live in `src/app/globals.css`;
the role names (`lime`, `forest`, …) are kept from earlier themes and now point at the
orange palette.

## Figma file (earlier Thali theme)

Figma: **Thali — Diet & Workout App Design**
https://www.figma.com/design/knHL3stEVbdnTEQvLFv2II

(Adobe XD is no longer sold or developed, so the design lives in Figma.)

## Pages

- **Screens**: five 390 × 844 mobile screens, built as editable auto-layout layers (no flat images):
  1. Home: next meal, today's workout, calorie ring with the workout bonus.
  2. Workouts hub: Meals | Workouts switch, today card, progress and streak, week strip.
  3. Training calendar: month grid by day type (strength / cardio / recovery / rest), cardio minutes, the selected day's cardio log.
  4. Workout session: demo slot, overload hint, set rows, rest timer.
  5. Shared plan: the public `/s/[token]` page (plan summary only, no body data).

  Row 1 is dark, row 2 is light. The light copies use the same layers, bound to the light colour variables.
- **Design system**: colour swatches, text styles and components (Button / Primary, Button / Outline, Chip / Selected, Chip / Default, StatStrip, ArrowCircle, BottomNav).

## Tokens ↔ code

The colour variables mirror the CSS custom properties in `src/app/globals.css`:

| Figma variable | CSS token / Tailwind class |
|---|---|
| `bg`, `surface`, `sand`, `sand2`, `line` | `bg-ivory` (page), `bg-surface`, `bg-sand`, `bg-sand-2`, `border-line` |
| `text`, `text2`, `muted` | `text-charcoal`, `text-ink-2`, `text-muted` |
| `accent`, `onAccent`, `accentSoft` | `text-forest` / `bg-forest`, `text-on-accent`, `bg-forest-50` |
| `limeStrong`, `limeCard`, `ink` | `bg-lime` (now orange `#ff5a1f`), `bg-lime-100`, white text on the accent |
| `water` / `waterSoft`, `amberInk` / `amberSoft`, `terracotta` | `water` / `water-100`, `amber-ink` / `amber-100`, `terracotta` (cardio, recovery, warnings) |
| `protein`, `carbs`, `fat` | macro bars |

On Figma's Starter plan a collection can only have one mode, so there are two
collections, **Thali colors / Dark** and **Thali colors / Light**, with the same variable
names. On a paid plan they can be merged into one collection with Dark and Light modes.

The Figma file still shows the earlier lime theme and its fonts (Outfit, Plus Jakarta
Sans). The app now uses Inter for everything, loaded by `next/font` in
`src/app/layout.tsx`, and the orange palette described at the top of this page.

## Exercise media

The design's demo slot shows the drawn stick figure (`ExerciseFigure`). In the app, an
approved Veo clip replaces it automatically (see [Workouts → AI demo clips](WORKOUTS.md#ai-demo-clips-veo-31)).
