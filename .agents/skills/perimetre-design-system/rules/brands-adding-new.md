---
title: Adding a New Brand Step by Step
impact: HIGH
impactDescription: comprehensive guide for extending the design system with a new brand
tags: brands, new-brand, setup, css, tokens, variants, step-by-step
---

## Adding a New Brand Step by Step

Follow these steps to add a new brand to `@perimetre/ui`. The process involves updating types, creating CSS tokens, creating a CSS entry file, and optionally adding component variant overrides.

### Step 1: Register the Brand

**Update `src/brands/index.ts`:**

```typescript
export const BRANDS = ['acorn', 'sprig', 'stelpro', 'newbrand'] as const;
// Brand type automatically updates: 'acorn' | 'sprig' | 'stelpro' | 'newbrand'
```

### Step 2: Create Brand CSS Tokens

**Create `src/brands/newbrand/styles.css`:**

Only define tokens that DIFFER from Acorn. Start minimal and add tokens as needed.

```css
@layer pui.primitive {
  [data-pui-brand='newbrand'] {
    /* Override primitive values that differ from acorn */
    --pui-primitive-color-primary-6: #8b5cf6; /* Purple primary */
  }
}

@layer pui.semantic {
  [data-pui-brand='newbrand'] {
    /* Override semantic tokens only if they can't be derived from primitives */
    --pui-color-interactive-on-primary: var(--pui-primitive-color-overlay-1);
    --pui-radius-button: 0.5rem; /* Rounded but not pill */
    --pui-radius-badge: 0.25rem;
  }
}
```

### Step 3: Create CSS Entry File

**Create `src/styles/newbrand.css`:**

```css
@import '../styles/base.css';
@import '../brands/acorn/styles.css'; /* Always include acorn base */
@import '../brands/newbrand/styles.css'; /* Brand overrides */
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

- [ ] Brand added to `BRANDS` const in `src/brands/index.ts`
- [ ] Brand CSS file created at `src/brands/newbrand/styles.css`
- [ ] CSS entry file created at `src/styles/newbrand.css`
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
@import '../styles/base.css';
@import '../brands/newbrand/styles.css'; /* Missing acorn! */

/* RIGHT: Always include acorn */
@import '../styles/base.css';
@import '../brands/acorn/styles.css';
@import '../brands/newbrand/styles.css';
```
