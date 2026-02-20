# Contributing to @perimetre/ui

This guide covers how to contribute to the UI library, with a focus on creating new themes (brands) and adding components.

## Overview

The `@perimetre/ui` library uses a **visual polymorphism** architecture where components adapt their appearance based on the active brand. This is achieved through:

1. **Design Tokens** - CSS custom properties defined as JSON in `@perimetre/tokens` and generated into CSS
2. **Brand Variants** - CVA configurations that compose base + brand-specific styles

For a deep dive into the design token architecture, see [Design Token Guide](./docs/design-token-guide.md).

## Creating a New Brand/Theme

Adding a new brand spans two packages:

1. **`packages/tokens`** — Create brand token JSON and generate CSS (source of truth)
2. **`packages/ui`** — Register the brand, wire up CSS imports, add component variants

### Step 1: Create Brand Tokens (`packages/tokens`)

Brand tokens live in `packages/tokens` as W3C DTCG JSON. Only include tokens that **differ** from the acorn base.

**Create `packages/tokens/src/sets/brands/yourbrand.json`:**

```json
{
  "pui": {
    "primitive": {
      "font": {
        "sans": {
          "$value": "'Your Font', ui-sans-serif, system-ui, sans-serif",
          "$type": "fontFamily"
        }
      },
      "color": {
        "primary": {
          "9": { "$value": "#0ea5e9", "$type": "color" }
        }
      }
    },
    "color": {
      "interactive": {
        "on-primary": {
          "$value": "{pui.primitive.color.overlay.1}",
          "$type": "color"
        }
      }
    },
    "radius": {
      "button": { "$value": "0.5rem", "$type": "dimension" }
    }
  }
}
```

**Update `packages/tokens/src/sets/$themes.json`** — add the new brand:

```json
{
  "name": "yourbrand",
  "selectedTokenSets": {
    "primitives/colors": "source",
    "primitives/typography": "source",
    "primitives/shape": "source",
    "primitives/shadow": "source",
    "primitives/motion": "source",
    "semantic/base": "enabled",
    "brands/yourbrand": "enabled"
  }
}
```

**Add to `packages/tokens/src/scripts/build.ts`** — add `'yourbrand'` to the `BRANDS` array.

**Build the CSS:**

```bash
cd packages/tokens
pnpm build
# Verify css/brands/yourbrand.css contains only overrides
```

Commit both the JSON and generated CSS. See `packages/tokens/CONTRIBUTING.md` for the full token format reference.

### Step 2: Register the Brand (`packages/ui`)

Add your brand to the brands list:

```typescript
// src/brands/index.ts
export type Brand = (typeof BRANDS)[number];
export const DEFAULT_BRAND: Brand = 'acorn';
export const BRANDS = ['acorn', 'sprig', 'stelpro', 'yourbrand'] as const;
```

### Step 3: Create CSS Entry File (`packages/ui`)

**Create `src/styles/yourbrand.css`:**

```css
/**
 * YourBrand Brand CSS
 *
 * Import this file in your project to use the YourBrand brand theme.
 * Usage: import '@perimetre/ui/styles/yourbrand.css'
 *
 * Note: YourBrand extends Acorn (the base theme), so Acorn tokens are included.
 */
@import './base.css';
@import '@perimetre/tokens/brands/acorn.css';
@import '@perimetre/tokens/brands/yourbrand.css';
```

**Update `src/styles/ladle.css`** to include the new brand for development:

```css
@import '@perimetre/tokens/brands/yourbrand.css';
```

### Step 4: Add Tailwind Custom Variant (Optional)

If you want to write brand-specific styles in markup, add a custom variant:

```css
/* src/brands/tailwind.css */
/* Add with the other @custom-variant declarations */
@custom-variant pui-yourbrand (&:where([data-pui-brand=yourbrand], [data-pui-brand=yourbrand] *));
```

This enables markup like:

```html
<div class="pui:pui-yourbrand:rounded-lg pui:pui-acorn:rounded-full">
  <!-- Different radius per brand -->
</div>
```

### Step 5: Create Component Variants (Optional)

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
--pui-color-bg-default: ...;
--pui-color-interactive-primary: ...;
--pui-radius-button: ...;
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

7. **Token changes start in `packages/tokens`** - Never add CSS custom properties directly in brand CSS files. Define them as JSON in `@perimetre/tokens` and run the build.

## Resources

- [Design Token Guide](./docs/design-token-guide.md) - Complete token architecture documentation
- [@perimetre/tokens CONTRIBUTING](../tokens/CONTRIBUTING.md) - Token JSON format, adding tokens, adding brands
- [CVA Documentation](https://cva.style/) - Class Variance Authority
- [Radix UI](https://radix-ui.com/) - Accessible primitives
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS
