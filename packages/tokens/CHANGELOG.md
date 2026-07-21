# @perimetre/tokens

## 0.11.0

### Minor Changes

- 6321d8e: Align OIQ "Place pour toi" link & icon tokens with the Figma design system, and add the supporting base semantics.
  - **OIQ brand**: `fg.link-primary` now resolves to brand purple (`#921acc`) and `fg.icon` to the darkest neutral (`#0b0b0b`, matching Figma's black icons) instead of the near-black / mid-gray Acorn defaults.
  - **Base (all brands)**: added `fg.link-hover` (→ `primary-10`) and `fg.icon-active` (→ `interactive-primary`), exposed as the `pui:text-pui-fg-link-hover` and `pui:text-pui-fg-icon-active` utilities via the Tailwind bridge. OIQ inherits these and resolves them to `#801cad` / `#921acc` through its existing primary-scale override — no per-brand override needed.

## 0.10.0

### Minor Changes

- 20b0747: Add "OIQ - Place pour toi" (`oiq-place-pour-toi`) brand with its color system.

  Introduces the OIQ brand across the token and component packages: a purple
  12-step primary scale (hero `#921acc`), an OIQ neutral scale, brand-blue
  borders/headings, red eyebrows, pale-green secondary buttons, OIQ's background
  palette (page, dark, accent-light), square button corners, and a two-family
  type system (Antique Olive Nord D for headings H1–H5, Roboto for H6 and body) —
  all sourced from the OIQ PPT Design System Figma. Registered in the token build,
  `$themes`/`$metadata`, the `@perimetre/ui` brand registry, the Tailwind
  `pui-oiq-place-pour-toi` custom variant, and Ladle.

  Adds a `Button.oiq-place-pour-toi.brand.ts` variant implementing the OIQ primary and
  secondary buttons (Figma nodes 191:608 and 428:7325): square corners, the
  signature hard offset drop shadow (solid black, no blur), and a press-down
  interaction on hover/press/focus (the button slides toward its shadow while the
  shadow shrinks), plus a solid focus frame and disabled styling. Primary is a
  filled purple button; secondary is white with a 3px purple border and purple
  label whose border darkens on hover/press.

  Adds a new brand-aware `Tag` component (`@perimetre/ui/Tag`) — a compact chip
  for filters/selections with `small`/`large` sizes, `selected`/`disabled`
  visual states, and an optional dismiss (×) button (Figma node 644:452). Fully
  token-driven via new semantic `tag-*` color tokens (`--pui-color-tag-bg`,
  `-bg-selected`, `-bg-disabled`, `-fg`, `-fg-disabled`) with Acorn defaults;
  OIQ recolors them (pale-lime default, brand-green selected) and renders square
  via its badge radius — no per-brand CVA needed.

  Also adds new semantic tokens to the shared token API, each with a neutral
  Acorn default that brands can override:
  - Surfaces: `--pui-color-surface-dark`, `--pui-color-surface-accent`
  - Foreground: `--pui-color-fg-heading`, `--pui-color-fg-eyebrow`,
    `--pui-color-fg-inverse`
  - Border: `--pui-color-border-dark`
  - Button states: `--pui-color-button-focus`, `--pui-color-button-focus-border`,
    `--pui-color-button-secondary-focus`,
    `--pui-color-button-secondary-focus-border`,
    `--pui-color-button-secondary-inactive`,
    `--pui-color-button-secondary-inactive-label`

  Note: these button focus/disabled tokens are wired into the token layer, but
  the `Button` component does not yet render focus/active/disabled states — a
  follow-up component change is needed for them to take visual effect.

  All are bridged to Tailwind (`pui:bg-pui-surface-dark`, `pui:text-pui-fg-heading`,
  `pui:border-pui-border-dark`, etc.).

## 0.9.0

### Minor Changes

- 75e607b: Add a brand-themeable `tone` variant to `Badge` — a generic, project-agnostic semantic color scale (`neutral`, `info`, `success`, `warning`, `danger`). The design system stays domain-neutral; consumer projects alias the tones to their own labels (e.g. `info`="New", `warning`="Coming soon", `danger`="Discontinued", `neutral`="Unavailable").
  - **`@perimetre/tokens`** — new semantic `color/badge/*-bg` and `*-fg` tokens (one bg/fg pair per tone: `neutral`, `info`, `success`, `warning`, `danger`). Acorn ships neutral, undesigned defaults; brands recolor per-tone from their own palette. Stelpro overrides `info` and `danger` (from Figma Badges/Tags `554:5225`) and inherits the neutral defaults for `neutral`/`success`/`warning`. Stelpro's `radius.badge: none` override is dropped so its badges inherit the semantic pill (`radius.full`).
  - **`@perimetre/ui`** — `Badge` gains an optional `tone` CVA variant wired to the new `--pui-color-badge-*` tokens (themeable per brand). Omit `tone` for the existing color-agnostic badge driven by `className`. Stelpro's brand override adopts the Figma Caption type ramp (14px / regular / 1.5) with fixed 6px/10px padding. Existing usage is unchanged — `tone` is opt-in.

## 0.8.1

### Patch Changes

- 2d6f059: Align microbird-school `heading-2` font size with microbird-commercial (`5rem`/80px → `3.75rem`/60px). All font sizes now match across the two microbird brands.

## 0.8.0

### Minor Changes

- b50e914: Add Stelpro brand styling for `ImageCarousel` (PDP product gallery).

  **@perimetre/ui**
  - New Stelpro brand variants for the carousel: `CarouselButton` (white circular
    control with a `#2e2e2e` chevron + Figma drop shadow), `ImageCarouselViewport`
    (square frame, 1px `border-default` hairline), `ImageCarouselControls`
    (hover-revealed arrows, ~18px mobile / ~30px desktop insets),
    `ImageCarouselThumbnail` + `ImageCarouselThumbnailsContainer` (5-column grid,
    full-opacity thumbnails, 2px slate selected border with no ring/transition),
    `ImageCarouselDot` + `ImageCarouselDotsContainer` (equal-size dots, accent-red
    active, flowed below the image), and `ImageCarouselLazyLoadContainer`
    (square corners).
  - New `dotsPlacement?: 'overlay' | 'below'` prop on `ImageCarousel`. Defaults to
    `'overlay'` — the existing behavior (dots absolutely positioned over the image,
    suppressed when thumbnails are shown), so all existing callers are unaffected.
    `'below'` renders the dots as a sibling beneath the viewport and lets dots and
    thumbnails coexist, so a consumer can show both and CSS-toggle which is visible
    per breakpoint (one carousel instance for desktop thumbnails + mobile dots).
  - Fix: the carousel dot's `data-pui-isSelected` DOM attribute is now lowercase
    (`data-pui-isselected`), removing a React "unknown prop" console warning for all
    brands. The attribute was non-functional (stripped by React) before.

  **@perimetre/tokens**
  - Stelpro `color.border.default` now resolves to `overlay.4` (`#e5e5e5`, Figma
    `color/border/default`) instead of inheriting acorn's `overlay.5` (`#d4d4d4`).

## 0.7.1

### Patch Changes

- 7baf2e5: Update microbird-commercial `primary-9` hero blue from `#004883` to `#00467E`.

## 0.7.0

### Minor Changes

- 15fe670: Implement Stelpro Accordion from the STEL Figma design (Menu/Accordion).
  - **tokens**: Stelpro overrides — `fg-default`/`fg-body` → overlay-11 (#2E2E2E, Figma `color/text/primary`), `typo-accordion-title` → Body/lg (Aktiv Grotesk Regular 20 / 150%).
  - **ui**: new `Accordion.stelpro.brand.ts` — flat gray (`bg-subtle`) item cards with no dividers and 12px gaps, 12px/16px trigger padding, 24px icon box (dark when closed, brand red when open), and a white answer panel with 12px/32px padding.

- 82bf993: Implement Stelpro primary and secondary buttons from the STEL Figma design system.
  - **tokens**: new semantic tokens `--pui-color-button-inactive-label` (disabled button label), `--pui-color-button-secondary-hover`, `--pui-color-button-secondary-active`, and `--pui-color-button-secondary-label` (all default to existing Acorn values). Stelpro overrides: slate primary fills for default/hover/active/disabled states, white `on-primary` label, navy secondary hover/active fills with dark `text-primary` label, `radius-button: 0`, and `typo-button` weight/tracking/transform (Aktiv Grotesk Regular, no uppercase).
  - **ui**: bridge the new button tokens to Tailwind; Stelpro Button brand variants now implement the Figma spec — min-height 44px, 8px/20px padding, 10px gap, Body/md typography, a 1px red inset focus frame, full hover/active/disabled state classes for `primary`, and a `secondary` variant (white fill, navy hover/active with white frame, focus state inverting to the primary dark fill).

## 0.6.0

### Minor Changes

- 7d797cd: Update Stelpro brand tokens to official branding (replacing the manual testing values) and add a new `typo.display-xl` semantic token.

  **`@perimetre/tokens`**
  - **Stelpro primitive color scales** rebuilt from official Figma variables:
    - `primitive.color.primary.1–12` — full 12-step Stelpro Red scale (`#cc0000` at step 9 / hero)
    - `primitive.color.overlay.1–12` — Stelpro neutral grayscale (pure grays, replacing acorn's sand-tinted neutrals)
  - **Stelpro typography** wired from Figma Design System node 11:209:
    - `primitive.font.sans` switched to Aktiv Grotesk
    - Full overrides for `typo.display-xl`, `typo.heading-1..4`, `typo.label`, `typo.large`, `typo.base`, `typo.small`, `typo.tagline` (Eyebrow), and `typo.navbar`
  - **New semantic token** `typo.display-xl` added to the base set for hero/display headings larger than `heading-1`. Defaults to existing `heading-1` dimensions, so other brands inherit safely without behavior change.

  **`@perimetre/ui`**
  - Added `@utility typo-display-xl` so `pui:typo-display-xl` resolves the new token. Falls back to `pui-primitive-font-display` then `pui-primitive-font-sans`.

## 0.5.0

### Minor Changes

- 645d67c: Add microbird brand support to `FieldGooglePlacesAutocomplete`

## 0.4.1

### Patch Changes

- 5e03749: Adds more microbird colors

## 0.4.0

### Minor Changes

- a3ab7d8: Changing p tag into span tag in eyebrow field
- a3ab7d8: Created SectionHorizontalHeader component

## 0.3.0

### Minor Changes

- 496ae71: Changing p tag into span tag in eyebrow field
- 496ae71: Created SectionHorizontalHeader component

## 0.2.0

### Minor Changes

- 00b3faa: Created SectionHorizontalHeader component

## 0.1.0

### Minor Changes

- e4c7add: Microbird initial color and typography

## 0.0.5

### Patch Changes

- 2471a6b: Adding theme colors to microbird brands

## 0.0.4

### Patch Changes

- Update design tokens from Figma Tokens Studio

## 0.0.3

### Patch Changes

- 860384f: Update tokens and add new styles for ImageCarousel buttons on sprig

## 0.0.2

### Patch Changes

- c403833: Update sprig link color
