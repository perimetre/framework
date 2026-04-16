# @perimetre/ui

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
