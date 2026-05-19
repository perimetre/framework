# @perimetre/tokens

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
