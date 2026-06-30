# @perimetre/ui

## 16.8.1

### Patch Changes

- 7e8d721: fix(ui): align Tabs active underline across tabs when labels wrap

  Stretch tab triggers to equal height and bottom-align their labels so every underline rests on the list baseline, instead of floating above it when a sibling tab's text wraps to two lines.

  The source fix landed in #161 but its changeset was consumed without bumping the version, so it never shipped in a published build. This changeset re-triggers a release (16.8.0 → 16.8.1) so the fix reaches consumers.

## 16.8.0

### Minor Changes

- 75e607b: Add a brand-themeable `tone` variant to `Badge` — a generic, project-agnostic semantic color scale (`neutral`, `info`, `success`, `warning`, `danger`). The design system stays domain-neutral; consumer projects alias the tones to their own labels (e.g. `info`="New", `warning`="Coming soon", `danger`="Discontinued", `neutral`="Unavailable").
  - **`@perimetre/tokens`** — new semantic `color/badge/*-bg` and `*-fg` tokens (one bg/fg pair per tone: `neutral`, `info`, `success`, `warning`, `danger`). Acorn ships neutral, undesigned defaults; brands recolor per-tone from their own palette. Stelpro overrides `info` and `danger` (from Figma Badges/Tags `554:5225`) and inherits the neutral defaults for `neutral`/`success`/`warning`. Stelpro's `radius.badge: none` override is dropped so its badges inherit the semantic pill (`radius.full`).
  - **`@perimetre/ui`** — `Badge` gains an optional `tone` CVA variant wired to the new `--pui-color-badge-*` tokens (themeable per brand). Omit `tone` for the existing color-agnostic badge driven by `className`. Stelpro's brand override adopts the Figma Caption type ramp (14px / regular / 1.5) with fixed 6px/10px padding. Existing usage is unchanged — `tone` is opt-in.

### Patch Changes

- 667199f: fix(ui): align Tabs active underline across tabs when labels wrap

  Stretch tab triggers to equal height and bottom-align their labels so every underline rests on the list baseline, instead of floating above it when a sibling tab's text wraps to two lines.

- Updated dependencies [75e607b]
  - @perimetre/tokens@0.9.0

## 16.7.1

### Patch Changes

- Updated dependencies [2d6f059]
  - @perimetre/tokens@0.8.1

## 16.7.0

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

### Patch Changes

- Updated dependencies [b50e914]
  - @perimetre/tokens@0.8.0

## 16.6.1

### Patch Changes

- Updated dependencies [7baf2e5]
  - @perimetre/tokens@0.7.1

## 16.6.0

### Minor Changes

- 15fe670: Implement Stelpro Accordion from the STEL Figma design (Menu/Accordion).
  - **tokens**: Stelpro overrides — `fg-default`/`fg-body` → overlay-11 (#2E2E2E, Figma `color/text/primary`), `typo-accordion-title` → Body/lg (Aktiv Grotesk Regular 20 / 150%).
  - **ui**: new `Accordion.stelpro.brand.ts` — flat gray (`bg-subtle`) item cards with no dividers and 12px gaps, 12px/16px trigger padding, 24px icon box (dark when closed, brand red when open), and a white answer panel with 12px/32px padding.

- 82bf993: Implement Stelpro primary and secondary buttons from the STEL Figma design system.
  - **tokens**: new semantic tokens `--pui-color-button-inactive-label` (disabled button label), `--pui-color-button-secondary-hover`, `--pui-color-button-secondary-active`, and `--pui-color-button-secondary-label` (all default to existing Acorn values). Stelpro overrides: slate primary fills for default/hover/active/disabled states, white `on-primary` label, navy secondary hover/active fills with dark `text-primary` label, `radius-button: 0`, and `typo-button` weight/tracking/transform (Aktiv Grotesk Regular, no uppercase).
  - **ui**: bridge the new button tokens to Tailwind; Stelpro Button brand variants now implement the Figma spec — min-height 44px, 8px/20px padding, 10px gap, Body/md typography, a 1px red inset focus frame, full hover/active/disabled state classes for `primary`, and a `secondary` variant (white fill, navy hover/active with white frame, focus state inverting to the primary dark fill).

### Patch Changes

- Updated dependencies [15fe670]
- Updated dependencies [82bf993]
  - @perimetre/tokens@0.7.0

## 16.5.4

### Patch Changes

- 90e6b20: Fix MagnifyImage lens revealing the unmagnified image underneath when the source image has transparency — the lens now defaults to a white background, overridable via `magnifierClassName`. Also restore free cursor movement: the lens follows the cursor all the way to the container edges and is allowed to visually extend beyond the container instead of being clamped and clipped.

## 16.5.3

### Patch Changes

- 06eb054: Fix MagnifyImage lens revealing the unmagnified image underneath when the source image has transparency. The lens now defaults to a white background, which can be overridden via `magnifierClassName`.

## 16.5.2

### Patch Changes

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

- Updated dependencies [7d797cd]
  - @perimetre/tokens@0.6.0

## 16.5.1

### Patch Changes

- 7017688: Fix `MagnifyImage` lens being clipped at container edges. The lens center is now clamped to `[lensRadius, size - lensRadius]` so the full circle stays inside the container regardless of cursor position.

## 16.5.0

### Minor Changes

- 645d67c: Add microbird brand support to `FieldGooglePlacesAutocomplete`

### Patch Changes

- 1d02951: Fixed button sizes for extra large screens
- 1d02951: Changed all buttons on micro bird to be 16px on all screen sizes
- Updated dependencies [645d67c]
  - @perimetre/tokens@0.5.0

## 16.4.1

### Patch Changes

- 9985c24: Fixed button sizes for extra large screens

## 16.4.0

### Minor Changes

- 8f8ae9c: Add `Collapse` component — a brand-aware, motion-animated disclosure with `CollapseTrigger`, `CollapseHeading`, `CollapseEyebrow`, `CollapseTitle`, `CollapseIcon`, and `CollapseContent` subcomponents for rich-text bodies.

### Patch Changes

- 8f8ae9c: Drop the top border from the first row of the Acorn brand `Accordion`. The component is almost always nested inside a section or card whose own boundary already provides the top edge, so the `first:border-t` rule was visually doubling up. The `--pui-color-border-accordion-first` semantic token is still exported from `tailwind.css`; consumers who want the top border back can add `pui:first:border-t pui:first:border-t-pui-border-accordion-first` via the Accordion's `className` prop.
- 24997c3: Fixed hover colors for primaryLight on microbird-commercial

## 16.3.0

### Minor Changes

- fec470e: Add `Collapse` component — a brand-aware, motion-animated disclosure with `CollapseTrigger`, `CollapseHeading`, `CollapseEyebrow`, `CollapseTitle`, `CollapseIcon`, and `CollapseContent` subcomponents for rich-text bodies.

### Patch Changes

- @perimetre/icons@0.0.3

## 16.2.8

### Patch Changes

- 7bba9c2: Fix avoid intercepting events on drawer

## 16.2.7

### Patch Changes

- cadf667: keep black bg and switch text to white on hover for microbird secondary

## 16.2.6

### Patch Changes

- b129d90: Standardizing button font sizes for both commercial and school brands
- b129d90: Added line-height styling for mobile on Section Headers
- b129d90: Fixing tabs border spacing

## 16.2.5

### Patch Changes

- adee8b5: fix(button): fill in microbird-commercial primary and primaryLight variants so buttons render correctly instead of unstyled
- 089d906: Fixes google autocomplete race condition

## 16.2.4

### Patch Changes

- d2b2d4e: Added line-height styling for mobile on Section Headers

## 16.2.3

### Patch Changes

- 63a626d: Fix brand registry losing the active brand during the client-component SSR
  pass. The previous `cache()`-based ref only worked inside React Server
  Component renders, so when Next.js SSR'd a client component (e.g.
  `FieldCheckboxRadio`), `getActiveBrand()` returned the default brand and
  the SSR'd HTML used acorn variants while the client hydration used the
  real brand. This produced hydration mismatches like
  `pui:size-4` (server) vs `pui:size-4.5` (client) on Sprig checkboxes.

  The registry now uses `AsyncLocalStorage` on the server, which propagates
  through the entire request — RSC render, client component SSR, and any
  `await` in between — while remaining concurrency-safe across simultaneous
  requests. Public API (`setActiveBrand`/`getActiveBrand`/`getBrandVariant`)
  is unchanged.

## 16.2.2

### Patch Changes

- 1a6e40f: Adds defaultValue to fields

## 16.2.1

### Patch Changes

- ca4e8b8: Make brand registry RSC-safe.

  `setActiveBrand` / `getActiveBrand` / `getBrandVariant` now store the
  active brand in a `cache()`-scoped ref on the server, so concurrent
  RSC renders (Next.js Cache Components, parallel prerenders) don't
  race on a shared module-level variable. Client behavior is unchanged.

  Fixes a bug where Button and other brand-aware components could render
  with the wrong brand's CVA output when multiple brands were prerendered
  in the same process.

  **Required setup:** `setActiveBrand` must be called per request (e.g. in
  the brand-scoped root layout) before rendering brand-aware components.
  Requests that render before `setActiveBrand` runs fall back to the
  default brand.

- ca4e8b8: fixing ComboboxOptions type compatibility
- ca4e8b8: Make brand registry RSC-Safe

## 16.2.0

### Minor Changes

- 8bcbdda: fix(ui/button): use bg-black for secondary variant

## 16.1.0

### Minor Changes

- 5b6b747: Update StatItem Styling and add secondary variant button

## 16.0.1

### Patch Changes

- 3bbc646: Bump version

## 16.0.0

### Major Changes

- aa7061c: microbird brand variants for StatItem

### Minor Changes

- 0f87278: Add responsive font size to SectionCenteredHeader title
- 1f47436: StatItem responsive layout
- acfab60: Fixing mobile styles for section horizontal header

## 15.5.0

### Minor Changes

- 658e1d6: Adding updated button colors
- 53b6d19: Add `ImageSequence360` component — a 360° product spin viewer built on `@mediamonks/fast-image-sequence` and `@use-gesture/react`. Supports mouse drag, touch, and touchpad with axis-locked horizontal gestures, and resizes responsively with its container.
- 658e1d6: Removed transparent variant

## 15.4.0

### Minor Changes

- 748797c: Created Tabs Component
- 866bb37: add PaginatedCarousel component to framework

### Patch Changes

- 748797c: Moved tab styles from base.css to tailwind.css

## 15.3.0

### Minor Changes

- 58a4e5c: Created Tabs Component

## 15.2.2

### Patch Changes

- 88e724a: fix SectionCenteredHeader : remove <p> for a <div>

## 15.2.1

### Patch Changes

- Updated dependencies [5e03749]
  - @perimetre/tokens@0.4.1

## 15.2.0

### Minor Changes

- d683e3c: Add MagnifyImage component — wraps any image element and overlays a circular magnifying lens on hover/tap. Supports lensRadius, scale, className, and magnifierClassName props. Lens position is driven by CSS custom properties updated via rAF, bypassing React state for smooth per-frame tracking.

## 15.1.0

### Minor Changes

- a3ab7d8: Changing p tag into span tag in eyebrow field
- a3ab7d8: Created SectionHorizontalHeader component
- a3ab7d8: Added mobile styles to SectionHorizontalHeader

### Patch Changes

- Updated dependencies [a3ab7d8]
- Updated dependencies [a3ab7d8]
  - @perimetre/tokens@0.4.0

## 15.0.0

### Major Changes

- ce62430: microbird brand variants for StatItem

## 14.4.0

### Minor Changes

- 496ae71: Changing p tag into span tag in eyebrow field
- 496ae71: Created SectionHorizontalHeader component

### Patch Changes

- Updated dependencies [496ae71]
- Updated dependencies [496ae71]
  - @perimetre/tokens@0.3.0

## 14.3.0

### Minor Changes

- 00b3faa: Created SectionHorizontalHeader component

### Patch Changes

- Updated dependencies [00b3faa]
  - @perimetre/tokens@0.2.0

## 14.2.0

### Minor Changes

- e4c7add: Microbird initial color and typography

### Patch Changes

- Updated dependencies [e4c7add]
  - @perimetre/tokens@0.1.0

## 14.1.4

### Patch Changes

- Updated dependencies [2471a6b]
  - @perimetre/tokens@0.0.5

## 14.1.3

### Patch Changes

- Updated dependencies
  - @perimetre/tokens@0.0.4

## 14.1.2

### Patch Changes

- 60c55a4: Fixes opacity also affecting thumbnail borders

## 14.1.1

### Patch Changes

- 8be5581: Fixes consumer group classes not being generated

## 14.1.0

### Minor Changes

- 860384f: Update tokens and add new styles for ImageCarousel buttons on sprig

### Patch Changes

- Updated dependencies [860384f]
  - @perimetre/tokens@0.0.3

## 14.0.3

### Patch Changes

- b100a6f: Make sprig's thumbnail size square

## 14.0.2

### Patch Changes

- d5bbbcf: add Sprig brand variant for ImageCarouselViewport

## 14.0.1

### Patch Changes

- 90f216e: add data-pui-component prop to ImageCarousel sub-components and add border-none
- 90f216e: fix(ui): update ImageCarouselThumbnail Sprig brand border styles

## 14.0.0

### Major Changes

- bd8f21e: fix(ui): update ImageCarouselThumbnail Sprig brand border styles

## 13.11.2

### Patch Changes

- 8e94204: Adds FieldRadioGroup

## 13.11.1

### Patch Changes

- c403833: Update sprig link color
- Updated dependencies [c403833]
  - @perimetre/tokens@0.0.2

## 13.11.0

### Minor Changes

- d32a405: Updating namespace

## 13.10.0

### Minor Changes

- 28df067: Exporting tailwind for consumers

## 13.9.2

### Patch Changes

- Updated dependencies [7117601]
  - @perimetre/classnames@0.2.0

## 13.9.1

### Patch Changes

- 8dee454: Updated AlertBar font size

## 13.9.0

### Minor Changes

- 8cdbdc4: New <AlertBar /> component

## 13.8.7

### Patch Changes

- 8d35b6a: Fixes google input event

## 13.8.6

### Patch Changes

- 26745c1: Added new formatDisplayValue field to place input

## 13.8.5

### Patch Changes

- fd86533: Fixes more inheritance on google

## 13.8.4

### Patch Changes

- 88c4c11: Fixes font inheritance on PlacesAutocomplete

## 13.8.3

### Patch Changes

- 275ddd2: Fixes <FieldAutocomplete immediate mode

## 13.8.2

### Patch Changes

- 056ea1e: Fixes controlled input behavior

## 13.8.1

### Patch Changes

- 2ede989: Fixes exported dependencies

## 13.8.0

### Minor Changes

- 1a546de: Added <FieldAutocomplete /> component
- 1a546de: Added <FieldGooglePlacesAutocomplete /> component

## 13.7.2

### Patch Changes

- 04b381c: Fixes <FieldSelect /> placeholder, and update SPRIG branded colors

## 13.7.1

### Patch Changes

- 99ecdcb: Fixed sprig input color tokens

## 13.7.0

### Minor Changes

- 62c1856: Added <FieldSelect input

## 13.6.0

### Minor Changes

- 228eee3: Updated sprig brand

## 13.5.1

### Patch Changes

- ceccf05: Makes motion a peer deps package

## 13.5.0

### Minor Changes

- 297178a: Updated sprig design. New Drawer component

### Patch Changes

- Updated dependencies [8649398]
  - @perimetre/classnames@0.1.0

## 13.4.2

### Patch Changes

- 59e5eb6: Updated docs

## 13.4.1

### Patch Changes

- 3e7a22d: Fix module load brand configuration

## 13.4.0

### Minor Changes

- 957e6e5: Added thumbnails option to ImageCarousel

## 13.3.3

### Patch Changes

- a203567: Fix image wrapper flex container

## 13.3.2

### Patch Changes

- 0ae3b1b: Fix image wrapper height

## 13.3.1

### Patch Changes

- ac3fdf0: Fixes image carousel height for centralization

## 13.3.0

### Minor Changes

- bbba3e2: Added image carousel component

## 13.2.0

### Minor Changes

- 5fb0425: Added badge component

## 13.1.4

### Patch Changes

- 20e696a: Fixes radio button scoping

## 13.1.3

### Patch Changes

- 0d163f1: Splitting tailwind utilities

## 13.1.2

### Patch Changes

- 87f1246: Updates preflight declaration

## 13.1.1

### Patch Changes

- 49fcd47: Fix TypeScript declaration file resolution for deep imports. The package.json exports now correctly maps type declarations to match the nested directory structure created by vite-plugin-dts. This supports both directory imports (e.g., `@perimetre/ui/components/Field/FieldInput` → `./dist/components/Field/FieldInput/index.d.ts`) and direct file imports (e.g., `@perimetre/ui/components/Button/brands/Button.acorn.brand.js` → `./dist/components/Button/brands/Button.acorn.brand.d.ts`).

## 13.1.0

### Minor Changes

- 7b8b010: Tokenizing ui

## 13.0.0

### Major Changes

- 027a5a5: UI Refactor

## 0.0.1

### Patch Changes

- 1a4325a: Initial export
