---
title: Adding a New Brand Step by Step
impact: HIGH
impactDescription: comprehensive guide for extending the design system with a new brand
tags: brands, new-brand, setup, css, tokens, variants, step-by-step
---

## Adding a New Brand Step by Step

Follow these steps to add a new brand to `@perimetre/ui`. The process involves updating types, creating CSS tokens, creating a CSS entry file, and optionally adding component variant overrides.

### Step 1: Create Token JSON in `packages/tokens`

**Create `packages/tokens/src/sets/brands/newbrand.json`:**

Only include tokens that DIFFER from acorn. The JSON can contain both primitive and semantic overrides:

```json
{
  "pui": {
    "primitive": {
      "color": {
        "$type": "color",
        "primary": {
          "9": { "$value": "#8b5cf6" }
        }
      }
    },
    "color": {
      "$type": "color",
      "interactive": {
        "on-primary": { "$value": "{pui.primitive.color.overlay.1}" }
      }
    },
    "radius": {
      "$type": "borderRadius",
      "button": { "$value": "0.5rem" },
      "badge": { "$value": "0.25rem" }
    }
  }
}
```

**Update `packages/tokens/src/sets/$themes.json`** to add the new brand theme.

**Add brand to `BRANDS` array** in `packages/tokens/src/scripts/build.ts`.

**Build:** `cd packages/tokens && pnpm build` → generates `dist/brands/newbrand.css`.

Commit both JSON and generated CSS.

### Step 2: Register the Brand in `packages/ui`

**Update `packages/ui/src/brands/index.ts`:**

```typescript
export const BRANDS = ['acorn', 'sprig', 'stelpro', 'newbrand'] as const;
```

### Step 3: Create CSS Entry File

**Create `packages/ui/src/styles/newbrand.css`:**

```css
@import './base.css';
@import '@perimetre/tokens/brands/acorn.css';
@import '@perimetre/tokens/brands/newbrand.css';
```

### Step 4: Add to Build Entry Points

The build system auto-discovers CSS files in `src/styles/`, but verify the Vite config includes the new file in the entry glob.

### Step 5: Add Component Variant Overrides (If Needed)

Only create variant files for components where the CLASS STRUCTURE differs. If only token values differ, CSS handles it automatically.

**If a class override IS needed:**

```tsx
// src/components/Button/brands/Button.newbrand.brand.ts
import { cva } from '@/lib/cva';

export const buttonNewbrandVariants = cva({
  base: ['pui:text-pui-overlay-1'] // Light text on purple
});
```

**Update the component's brand registry:**

```tsx
// src/components/Button/brands/index.ts
import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { buttonNewbrandVariants } from './Button.newbrand.brand';

export const buttonBrandVariants = {
  acorn: buttonAcornVariants,
  sprig: compose(buttonAcornVariants, buttonSprigVariants),
  stelpro: compose(buttonAcornVariants, buttonStelproVariants),
  newbrand: compose(buttonAcornVariants, buttonNewbrandVariants)
} as const satisfies BrandVariants<typeof buttonAcornVariants>;
```

### Step 6: Add to Ladle Dev Environment

**Update `.ladle/components.tsx`** to include the new brand in the control options (it should pick up from `BRANDS` automatically if using the const).

**Update `src/styles/ladle.css`** to import the new brand's CSS for development:

```css
@import '../brands/newbrand/styles.css';
```

### Step 7: Test

1. Start Ladle: `pnpm dev`
2. Switch to the new brand via the brand control
3. Verify all existing components render correctly
4. Check that token overrides apply as expected
5. Verify no regressions in other brands

### Checklist for New Brand

- [ ] Brand JSON created at `packages/tokens/src/sets/brands/newbrand.json`
- [ ] Brand added to `$themes.json` and `build.ts` BRANDS array in tokens package
- [ ] Tokens built (`pnpm build` in tokens) and generated CSS committed
- [ ] Brand added to `BRANDS` const in `packages/ui/src/brands/index.ts`
- [ ] CSS entry file created at `packages/ui/src/styles/newbrand.css` (imports from `@perimetre/tokens`)
- [ ] Tailwind entry file created at `packages/ui/src/tailwind/newbrand.css` (imports from `@perimetre/tokens`)
- [ ] Custom variant added to `packages/ui/src/brands/tailwind.css`
- [ ] Only DIFFERENT primitive/semantic values overridden (not all)
- [ ] Component variant overrides created ONLY where class structure differs
- [ ] Brand registry updated for affected components
- [ ] Ladle CSS updated to include new brand for development
- [ ] All existing components tested with new brand
- [ ] CSS bundle size is reasonable (should be similar to other brands)

### Common Mistakes When Adding Brands

**Duplicating all of Acorn's tokens:**

```css
/* WRONG: Don't copy all of acorn's tokens */
@layer pui.primitive {
  [data-pui-brand='newbrand'] {
    --pui-primitive-color-primary-1: #faf5ff;
    --pui-primitive-color-primary-2: #f3e8ff;
    /* ... copying 50+ tokens that are the same as acorn */
    --pui-primitive-color-primary-6: #8b5cf6; /* Only this one differs! */
  }
}

/* RIGHT: Only override what's different */
@layer pui.primitive {
  [data-pui-brand='newbrand'] {
    --pui-primitive-color-primary-6: #8b5cf6;
  }
}
```

**Creating variant overrides when tokens suffice:**

If the only difference is the primary color VALUE, CSS tokens handle it. No variant file needed.

**Forgetting to import acorn base in the CSS entry:**

```css
/* WRONG: Missing acorn base */
@import './base.css';
@import '@perimetre/tokens/brands/newbrand.css'; /* Missing acorn! */

/* RIGHT: Always include acorn */
@import './base.css';
@import '@perimetre/tokens/brands/acorn.css';
@import '@perimetre/tokens/brands/newbrand.css';
```

**Forgetting to update tokens package:**

Adding tokens only in `packages/ui/src/brands/` CSS files without also adding them to `packages/tokens/src/sets/` JSON. Both must stay in sync.
