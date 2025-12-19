# Contributing to @perimetre/ui

This guide covers how to contribute to the UI library, with a focus on creating new themes (brands) and adding components.

## Overview

The `@perimetre/ui` library uses a **visual polymorphism** architecture where components adapt their appearance based on the active brand. This is achieved through:

1. **Design Tokens** - CSS custom properties that define visual values
2. **Brand Variants** - CVA configurations that compose base + brand-specific styles

For a deep dive into the design token architecture, see [Design Token Guide](./docs/design-token-guide.md).

## Creating a New Brand/Theme

Adding a new brand involves three steps:

1. Register the brand
2. Define CSS tokens
3. Create component variants (optional)

### Step 1: Register the Brand

Add your brand to the brands list:

```typescript
// src/brands/index.ts
export type Brand = (typeof BRANDS)[number];
export const DEFAULT_BRAND: Brand = 'acorn';
export const BRANDS = ['acorn', 'sprig', 'stelpro', 'yourbrand'] as const;
```

### Step 2: Define CSS Tokens

Create a CSS file for your brand's design tokens:

```css
/* src/brands/yourbrand/styles.css */
@layer pui.primitive {
  [data-pui-brand='yourbrand'] {
    /**
     * PRIMITIVE TOKENS
     *
     * Raw design values named by what they ARE, not what they're FOR.
     * These are NEVER directly consumed by components.
     * Only semantic tokens should reference these.
     */

    /* Typography */
    --pui-primitive-font-sans:
      'Your Font', ui-sans-serif, system-ui, sans-serif;

    /* Primary color scale (following Radix color scale convention) */
    --pui-primitive-color-primary-1: #f0f9ff;
    --pui-primitive-color-primary-2: #e0f2fe;
    --pui-primitive-color-primary-3: #bae6fd;
    --pui-primitive-color-primary-4: #7dd3fc;
    --pui-primitive-color-primary-5: #38bdf8;
    --pui-primitive-color-primary-6: #0ea5e9; /* Main brand color */
    --pui-primitive-color-primary-7: #0284c7;
    --pui-primitive-color-primary-8: #0369a1;
    --pui-primitive-color-primary-9: #075985;
    --pui-primitive-color-primary-10: #0c4a6e;
    --pui-primitive-color-primary-11: #082f49;
    --pui-primitive-color-primary-12: #0a1929;

    /* Overlay/gray scale */
    --pui-primitive-color-overlay-1: #ffffff;
    --pui-primitive-color-overlay-2: #fafafa;
    /* ... continue scale ... */
    --pui-primitive-color-overlay-12: #171717;
  }
}

@layer pui.semantic {
  [data-pui-brand='yourbrand'] {
    /**
     * SEMANTIC TOKENS
     *
     * Purpose-based tokens that express design intent.
     * These are the PUBLIC API consumed by components.
     * Override these to change how components look.
     */

    /* Example semantic overrides if needed */
  }
}
```

Import your brand's CSS in the brands index:

```css
/* src/brands/styles.css */
@import './acorn/styles.css';
@import './sprig/styles.css';
@import './stelpro/styles.css';
@import './yourbrand/styles.css';
```

### Step 3: Add Tailwind Custom Variant (Optional)

If you want to write brand-specific styles in markup, add a custom variant:

```css
/* src/brands/tailwind.css */
/* Add at the end of the file */
@custom-variant yourbrand (&:where([data-pui-brand=yourbrand], [data-pui-brand=yourbrand] *));
```

This enables markup like:

```html
<div class="pui:yourbrand:rounded-lg pui:acorn:rounded-full">
  <!-- Different radius per brand -->
</div>
```

### Step 4: Create Component Variants (Optional)

If your brand needs component-specific style overrides beyond what CSS tokens provide, create brand variants:

```typescript
// src/components/Button/brands/Button.yourbrand.brand.ts
import { cva } from '@/lib/cva';

/**
 * YourBrand button variants
 * Only override what differs from the base (acorn) variant
 */
export const buttonYourbrandVariants = cva({
  base: [
    'pui:text-overlay-1', // Different text color
    'pui:rounded-lg' // Different border radius
  ]
});
```

Register the variant in the component's brand index:

```typescript
// src/components/Button/brands/index.ts
import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { buttonAcornVariants } from './Button.acorn.brand';
import { buttonSprigVariants } from './Button.sprig.brand';
import { buttonStelproVariants } from './Button.stelpro.brand';
import { buttonYourbrandVariants } from './Button.yourbrand.brand';

export const buttonBrandVariants = {
  acorn: buttonAcornVariants,
  sprig: compose(buttonAcornVariants, buttonSprigVariants),
  stelpro: compose(buttonAcornVariants, buttonStelproVariants),
  yourbrand: compose(buttonAcornVariants, buttonYourbrandVariants)
} as const satisfies BrandVariants<typeof buttonAcornVariants>;

export type ButtonVariantProps = VariantProps<typeof buttonAcornVariants>;
```

## Token Naming Conventions

Follow these conventions for consistent token naming:

### Primitives

Pattern: `--pui-primitive-{category}-{name}`

```css
--pui-primitive-font-sans: ...;
--pui-primitive-color-primary-6: ...;
--pui-primitive-color-overlay-12: ...;
```

### Semantic Tokens

Pattern: `--pui-{category}-{subcategory}-{element}-{state?}`

```css
--pui-color-background-default: ...;
--pui-color-interactive-primary-hover: ...;
--pui-shape-radius-button: ...;
```

### What to Tokenize

**Always tokenize (changes between brands):**

- Colors (backgrounds, text, borders)
- Border radius
- Shadows
- Font families and weights
- Letter spacing
- Text transform

**Hardcode (structural, doesn't change):**

- `display`, `position`, `align-items`
- `cursor`, `pointer-events`
- `width: 100%`, `overflow: hidden`

For complete guidelines, see [Design Token Guide](./docs/design-token-guide.md).

## Adding Components

### Component Structure

```
src/components/YourComponent/
├── index.tsx                    # Main component (brand-agnostic)
├── YourComponent.stories.tsx    # Ladle stories
└── brands/
    ├── index.ts                 # Brand variants registry
    ├── YourComponent.acorn.brand.ts    # Base brand (required)
    ├── YourComponent.sprig.brand.ts    # Optional overrides
    └── YourComponent.stelpro.brand.ts  # Optional overrides
```

### Component Implementation

1. **Create the base brand variant** (required):
2. **Create the brand variants registry**
3. **Create the component**:
4. **Create stories for Ladle**:

## Changesets

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for versioning guidelines.

## Best Practices

1. **Components never reference primitives directly** - Always use semantic tokens or Tailwind utilities that map to them

2. **Brand variants only override differences** - Use CVA's `compose()` to inherit from base

3. **Keep component logic brand-agnostic** - Styling logic lives in brand variants, not components

4. **Use the `pui:` prefix** - All Tailwind utilities should use the prefix to stay scoped

5. **Test all brands** - Use Ladle to verify appearance across brands

6. **Document token usage** - Add comments explaining which tokens a component uses

## Resources

- [Design Token Guide](./docs/design-token-guide.md) - Complete token architecture documentation
- [CVA Documentation](https://cva.style/) - Class Variance Authority
- [Radix UI](https://radix-ui.com/) - Accessible primitives
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS
