---
'@perimetre/ui': minor
'@perimetre/tokens': minor
---

Add Stelpro brand styling for `ImageCarousel` (PDP product gallery).

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
