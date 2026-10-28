# Tech Epitome design system

Structure follows the AlgoMaster reference (a dense, dark-first developer
tool). Colour is Tech Epitome's own: charcoal surfaces and a single **ember**
accent. Phase 1 (2026-10-28) added an editorial layer chosen with the Tasteful
plugin: a serif display face and hairline rules from GoShuin
(aestudio.studio), ruled flat cards from Stash (stash.cool). The palette was
kept; only contrast fixes changed it.

Tokens live in `src/app/globals.css`. Use the Tailwind names below, never raw
hex values.

## Colour

| Role            | Class                                                              | Notes                                                                  |
| --------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Page            | `bg-background`                                                    | Charcoal, never pure black                                             |
| Card / panel    | `bg-card border border-border`                                     | One tonal step up, 1px hairline                                        |
| Muted fill      | `bg-muted/40`, `bg-accent/40` hover                                | Inputs, chips, hover rows                                              |
| Primary text    | `text-foreground`                                                  |                                                                        |
| Supporting text | `text-muted-foreground`                                            | Descriptions, meta, table headers                                      |
| Action / accent | `bg-primary` (ember), `text-ember-300/400`, `bg-ember-500/12` tint | **One filled ember CTA per view.** Everything else is outline or ghost |
| Links in tables | `text-info`                                                        | Problem/item titles in lists                                           |
| Difficulty      | `<DifficultyBadge>`                                                | Coloured text only, never a filled pill                                |
| Status          | `text-success`, `text-warning`, `text-destructive`, `text-info`; `Badge`/`Alert` variants `success`, `warning`, `info`, `destructive` | Never ember: a state must not read as an action |
| Visuals         | `viz-*`, `ember-*` on `.viz-canvas`                                | Only inside diagrams and visualizations                                |

No gradient text, glows or washes. `.text-gradient-ember`, `.bg-hero-haze` and
`.grid-backdrop` were removed in Phase 1.

Light theme: `ember-100`..`ember-400` are dark, text-safe shades (all >= 4.5:1
on white) because components written dark-first use them as accent text.
Light `primary` is oklch(0.55 0.138 47) so white button text clears 4.5:1.

## Type

Inter for UI and body (`font-sans`); Source Serif 4 for display only
(`font-display`, or the `.display` utility: regular weight, -0.02em, balanced);
Geist Mono for code and numbers (`font-mono`). All three via `next/font`.

| Use           | Classes                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Hero display  | `display text-5xl sm:text-6xl lg:text-7xl`                                                      |
| Page title    | `<PageHeader>` (`display text-3xl sm:text-4xl`); older pages still use `tracking-headline`      |
| Section title | `text-lg font-semibold tracking-headline`                                                       |
| Card title    | `text-base font-semibold`                                                                       |
| Body          | `text-sm` (app), `text-base`/`text-lg` (marketing)                                              |
| Meta / labels | `text-xs`/`text-sm text-muted-foreground`, sentence case. No tracked uppercase eyebrows.        |
| Long reading  | `.reading` (17px / 1.75)                                                                        |

## Shape and depth

- Flat. Depth comes from tonal steps and 1px borders, not shadows. At most `shadow-sm`.
- **Pills (`rounded-full`)** for marketing CTAs and tags.
- **6–8px** (`rounded-md`/`rounded-lg`) for app buttons, inputs, small cards.
- **12px (`rounded-xl`)** for app panels, tables and list sections; nav icon tiles.
- **8px (`rounded-lg`)** for marketing and feature cards too (Stash). No `rounded-2xl` cards.
- Prefer ruled lists (`border-t` + `border-b` rows) over a grid of identical cards.

## Layout

- Shell: sticky 56px header with section menus (`SiteHeader`), floating icon rail
  (`AppRail`), page in `main`. Do not add page-level sidebars that duplicate nav.
- App page container: `mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8`.
  Reading pages: three panes (chapter tree, ~44rem content, "On this page").
- Marketing content: `max-w-6xl`; each section is a ruled band (`border-t`) with
  a small accent label column and a serif title, `py-16 sm:py-20`.
  Headers are solid `bg-background`, no backdrop blur. Overlays are `bg-black/50`.
- 4px spacing base. Inputs and buttons 36–40px tall; hero CTAs 44–48px.

## Components (patterns to reuse)

- **Feature card**: `MiniDiagram` thumbnail (`src/components/marketing/mini-diagrams.tsx`)
  on the left or top, title, one-line muted description, optional "New" pill.
- **Grouped table**: `rounded-xl border bg-card`, collapsible header with a
  progress bar (`bg-muted h-1.5` track, `bg-ember-500` fill), muted 12px
  column headers, 12px row padding, `divide-y`. See `PatternGroupTable`.
- **Progress card**: right-rail `bg-card rounded-xl border p-4` with per-row
  bars.
- **Stat tile**: `StatTile` in `components/common`.
- **Tabs in a pane**: underline style with an ember bar under the active tab
  (see `PaneTab` in `problem-workspace.tsx`).
- **Empty states**: `EmptyState`. Never a dead end: always a next step.

## Rules

- Do keep ember as the only action colour; blue (`text-info`) is for links in lists.
- Don't append `→` to links or buttons; underline text links instead.
- Navigation comes from `navForViewer(viewer)` in `src/lib/navigation.ts`; staff
  links are listed for admins only. Pages still enforce access themselves.
- Do keep visualization colours inside diagrams.
- Don't put difficulty in filled pills.
- Don't introduce pricing, upgrade, premium or paywall language. Tech Epitome is free.
- Every control keeps an accessible name; never remove focus rings.
- Mobile first: no horizontal page scroll at 390px; tables scroll inside their card.
