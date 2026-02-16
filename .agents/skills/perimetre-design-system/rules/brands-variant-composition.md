---
title: Brand Variant Composition with CVA compose()
impact: HIGH
impactDescription: enables visual polymorphism across brands with minimal code
tags: brands, variants, compose, cva, acorn, sprig, stelpro, override
---

## Brand Variant Composition with CVA compose()

Each brand in `@perimetre/ui` can override component styling at two levels: CSS tokens (appearance values) and CVA variants (class combinations). Most brand differences are handled by CSS tokens alone. CVA variant overrides are needed only when the CLASS STRUCTURE differs.

### When CSS Tokens Are Sufficient (Most Cases)

If the only difference between brands is the VALUE of a color, radius, or shadow, CSS tokens handle it automatically. No brand variant file needed.

```css
/* Acorn: teal primary */
--pui-primitive-color-primary-6: hsl(172, 96%, 53%);

/* Sprig: green primary */
--pui-primitive-color-primary-6: #69c14c;
```

Components using `pui:bg-pui-interactive-primary` automatically get the correct color per brand. No variant override needed.

### When CVA Brand Variants Are Needed

Brand variants are needed when:

- A brand uses DIFFERENT Tailwind utility classes (not just different token values)
- A brand needs a different text color that can't be expressed via the existing token
- A brand needs additional or different classes entirely

**Example: Different text color class**

Acorn uses `pui:text-pui-overlay-12` (dark text). Sprig needs `pui:text-pui-overlay-1` (light text on primary). This isn't a token value change - it's a different token reference.

```tsx
// Button.acorn.brand.ts
export const buttonAcornVariants = cva({
  base: ['pui:text-pui-overlay-12'] // Dark text
});

// Button.sprig.brand.ts
export const buttonSprigVariants = cva({
  base: ['pui:text-pui-overlay-1'] // Light text (overrides via twMerge)
});
```

### The Brand Variants Registry Pattern

```tsx
// brands/index.ts
import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';

export const componentBrandVariants = {
  acorn: componentAcornVariants,
  sprig: compose(componentAcornVariants, componentSprigVariants),
  stelpro: compose(componentAcornVariants, componentStelproVariants)
} as const satisfies BrandVariants<typeof componentAcornVariants>;
```

**Key rules:**

1. `acorn` is NEVER composed - it IS the base
2. Other brands ALWAYS compose with acorn first: `compose(acorn, brand)`
3. The `satisfies BrandVariants<T>` ensures type safety
4. Acorn is REQUIRED, other brands are OPTIONAL in the type

### The BrandVariants Type

```typescript
// From src/lib/brand-registry.ts
export type BrandVariants<T> = { acorn: T } & Partial<
  Record<Exclude<Brand, 'acorn'>, T>
>;
```

This means:

- `acorn` key is always required
- All other brand keys are optional
- If a brand isn't specified, `getBrandVariant()` falls back to acorn

### Minimal Override Pattern

Brand override files should be as small as possible:

**Correct - minimal override:**

```tsx
// Button.sprig.brand.ts
import { cva } from '@/lib/cva';

export const buttonSprigVariants = cva({
  base: ['pui:text-pui-overlay-1']
});
```

**Incorrect - duplicating base styles:**

```tsx
// WRONG: Duplicating everything from acorn
export const buttonSprigVariants = cva({
  base: [
    'pui:bg-pui-interactive-primary pui:text-pui-overlay-1',
    'pui:rounded-pui-button',
    'pui:shadow-pui-button pui:hover:shadow-pui-button-hover',
    'pui:inline-flex pui:items-center pui:justify-center'
    // ... duplicating ALL of acorn's styles
  ]
});
```

### Variant Overrides

Brands can override specific variant values:

```tsx
// Component.acorn.brand.ts
export const acornVariants = cva({
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg'
    }
  }
});

// Component.sprig.brand.ts - override only the small size
export const sprigVariants = cva({
  variants: {
    size: {
      small: 'pui:px-4 pui:py-1' // Different small padding for Sprig
    }
  }
});
```

When composed, Sprig gets acorn's `default` size and its own `small` size.

### Empty Brand Variants

If a brand has no class-level differences (all differences handled by CSS tokens), you can either:

1. Omit the brand from the registry (falls back to acorn)
2. Export an empty CVA for explicitness

```tsx
// Option 1: Omit from registry
export const componentBrandVariants = {
  acorn: componentAcornVariants,
  sprig: compose(componentAcornVariants, componentSprigVariants)
  // stelpro omitted - falls back to acorn
} as const satisfies BrandVariants<typeof componentAcornVariants>;

// Option 2: Empty variant (explicit)
export const componentStelproVariants = cva({
  base: []
});
```

### How getBrandVariant() Works

```typescript
// From brand-registry.ts
export function getBrandVariant<T>(variants: BrandVariants<T>): T {
  const brand = getActiveBrand();
  return variants[brand] ?? variants.acorn;
}
```

At module load time (not render time), it:

1. Gets the active brand from module-level state
2. Looks up the composed variant for that brand
3. Falls back to acorn if the brand isn't in the registry

This is RSC-safe because it uses module-level state, not React Context.
