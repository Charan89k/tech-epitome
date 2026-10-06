# Tech Epitome design system

Structure, type and shape follow the AlgoMaster reference (a dense, dark-first
developer tool). Colour is Tech Epitome's own: charcoal surfaces and a single
**ember** accent. Where the reference uses green, we use ember.

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
| Status          | `text-success`, `text-warning`, `text-destructive`                 |                                                                        |
| Visuals         | `viz-*`, `ember-*` on `.viz-canvas`                                | Only inside diagrams and visualizations                                |

Headline accent: wrap **one phrase** of a hero headline in `.text-gradient-ember`.
A hero may sit on `.bg-hero-haze`.

## Type

Inter everywhere (`font-sans`); Geist Mono for code and numbers (`font-mono`).

| Use           | Classes                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Hero display  | `text-5xl sm:text-6xl lg:text-7xl font-bold tracking-display`                                   |
| Page title    | `text-2xl sm:text-3xl font-bold tracking-headline` (or `<PageHeader>`)                          |
| Section title | `text-lg font-semibold tracking-headline`                                                       |
| Card title    | `text-base font-semibold`                                                                       |
| Body          | `text-sm` (app), `text-base`/`text-lg` (marketing)                                              |
| Meta / labels | `text-xs text-muted-foreground`; eyebrows `text-[0.68rem] font-medium uppercase tracking-wider` |
| Long reading  | `.reading` (17px / 1.75)                                                                        |

## Shape and depth

- Flat. Depth comes from tonal steps and 1px borders, not shadows. At most `shadow-sm`.
- **Pills (`rounded-full`)** for marketing CTAs, eyebrow chips, tags, "New" badges.
- **6–8px** (`rounded-md`/`rounded-lg`) for app buttons, inputs, small cards.
- **12px (`rounded-xl`)** for app panels, tables and list sections; nav icon tiles.
- **16px (`rounded-2xl`)** for marketing and feature cards.

## Layout

- Shell: sticky 56px header with section menus (`SiteHeader`), floating icon rail
  (`AppRail`), page in `main`. Do not add page-level sidebars that duplicate nav.
- App page container: `mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8`.
  Reading pages: three panes (chapter tree, ~44rem content, "On this page").
- Marketing content: `max-w-5xl` centre column, 3-up card grids with `gap-6`,
  sections `py-16 sm:py-20`.
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
- Do keep visualization colours inside diagrams.
- Don't put difficulty in filled pills.
- Don't introduce pricing, upgrade, premium or paywall language. Tech Epitome is free.
- Every control keeps an accessible name; never remove focus rings.
- Mobile first: no horizontal page scroll at 390px; tables scroll inside their card.
