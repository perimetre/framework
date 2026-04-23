---
'@perimetre/ui': patch
---

Make brand registry RSC-safe.

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
