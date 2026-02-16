---
title: CSS Layers, Brand Files, and Token Override Architecture
impact: HIGH
impactDescription: controls specificity, token resolution, and brand CSS bundling
tags: css, layers, brands, tokens, tailwind, specificity, cascade
---

## CSS Layers, Brand Files, and Token Override Architecture

The CSS architecture uses named layers to control specificity and ensure predictable token resolution across brands.

### Layer Stack

```css
@layer pui.tw.theme, pui.tw.base, pui.tw.utilities;
@layer pui.primitives, pui.semantic, pui.theme, pui.components;
```

**Resolution order (lowest to highest specificity):**

1. `pui.tw.theme` - Tailwind's theme layer
2. `pui.tw.base` - Tailwind's base/preflight layer
3. `pui.primitives` / `pui.primitive` - Primitive token definitions (raw values)
4. `pui.semantic` - Semantic token definitions (purpose-mapped)
5. `pui.theme` - Theme-level component styles
6. `pui.components` - Component-specific styles
7. `pui.tw.utilities` - Tailwind utilities (highest, always wins)

Note: current `packages/ui` brand files use `@layer pui.primitive` (singular). Follow existing naming in this package unless you are intentionally doing a full layer-name migration.

### Brand CSS File Structure

Each brand has a CSS entry file that imports progressively:

**Acorn entry (`styles/acorn.css`):**

```css
@import '../styles/base.css';
@import '../brands/acorn/styles.css';
```

**Sprig entry (`styles/sprig.css`):**

```css
@import '../styles/base.css';
@import '../brands/acorn/styles.css'; /* Always include acorn as base */
@import '../brands/sprig/styles.css'; /* Sprig overrides */
```

**Stelpro entry (`styles/stelpro.css`):**

```css
@import '../styles/base.css';
@import '../brands/acorn/styles.css'; /* Always include acorn as base */
@import '../brands/stelpro/styles.css'; /* Stelpro overrides */
```

**Key insight:** Acorn tokens are ALWAYS loaded. Brand overrides sit on top and use CSS specificity to win:

```css
/* Acorn defines for all brands */
@layer pui.primitive {
  [data-pui-brand] {
    --pui-primitive-color-primary-6: hsl(172, 96%, 53%);
  }
}

/* Sprig overrides for its specific brand */
@layer pui.primitive {
  [data-pui-brand='sprig'] {
    --pui-primitive-color-primary-6: #69c14c;
  }
}
```

The `[data-pui-brand='sprig']` selector is more specific than `[data-pui-brand]`, so it wins when the brand is active.

### The Base CSS File

```css
/* src/styles/base.css */
@layer pui.tw.theme, pui.tw.base, pui.tw.utilities;
@layer pui.primitives, pui.semantic, pui.theme, pui.components;

@import 'tailwindcss/theme.css' layer(pui.tw.theme) prefix(pui);
@import 'tw-animate-css';
@import '../brands/tailwind.css';

[data-pui-brand] {
  @import 'tailwindcss/utilities.css' prefix(pui);
}
```

- Tailwind theme and utilities are imported with the `pui` prefix
- Utilities are scoped to `[data-pui-brand]` to prevent leaking outside the design system
- This ensures `pui:` prefixed utilities only work within a brand-scoped element

### The Tailwind Bridge (brands/tailwind.css)

This file bridges CSS custom properties to Tailwind utilities:

```css
@layer pui.tw.theme, pui.tw.base;
@layer pui.primitives, pui.semantic, pui.theme, pui.components;

@theme inline {
  /* Color tokens → Tailwind color utilities */
  --color-pui-primary-6: var(--pui-primitive-color-primary-6);
  --color-pui-interactive-primary: var(--pui-color-interactive-primary);
  --color-pui-interactive-on-primary: var(--pui-color-interactive-on-primary);
  --color-pui-fg-default: var(--pui-color-fg-default);

  /* Shape tokens → Tailwind radius utilities */
  --radius-pui-button: var(--pui-radius-button);
  --radius-pui-input: var(--pui-radius-input);

  /* Shadow tokens → Tailwind shadow utilities */
  --shadow-pui-button: var(--pui-shadow-button);
  --shadow-pui-button-hover: var(--pui-shadow-button-hover);

  /* Font tokens → Tailwind font utilities */
  --font-pui-sans: var(--pui-primitive-font-sans);
}
```

The `@theme inline` directive is critical: it tells Tailwind to embed the variable VALUE rather than referencing the theme variable, allowing CSS cascade to work when brands swap values at runtime.

### Brand Override Patterns

**Override a primitive (changes all semantics that reference it):**

```css
/* Override the primary color for Sprig */
@layer pui.primitive {
  [data-pui-brand='sprig'] {
    --pui-primitive-color-primary-6: #69c14c;
  }
}
```

**Override a semantic token (more targeted):**

```css
/* Override only the interactive primary color, not all uses of primary */
@layer pui.semantic {
  [data-pui-brand='sprig'] {
    --pui-color-interactive-on-primary: var(--pui-primitive-color-overlay-1);
  }
}
```

**Override a shape/elevation token:**

```css
@layer pui.semantic {
  [data-pui-brand='stelpro'] {
    --pui-radius-badge: 0; /* Sharp badges for Stelpro */
  }
}
```

### Consumer CSS Import

Consumers import ONE brand CSS file:

```tsx
// app/layout.tsx
import '@perimetre/ui/styles/sprig.css'; // Only Sprig CSS (~15KB)
```

This gives them:

- Tailwind base + utilities (scoped to `[data-pui-brand]`)
- Acorn token definitions (base)
- Sprig token overrides

### Custom Variants for Brand-Specific Classes

```css
@custom-variant pui-acorn (&:where([data-pui-brand=acorn], [data-pui-brand=acorn] *));
@custom-variant pui-sprig (&:where([data-pui-brand=sprig], [data-pui-brand=sprig] *));
@custom-variant pui-stelpro (&:where([data-pui-brand=stelpro], [data-pui-brand=stelpro] *));
```

These allow brand-specific utility classes in edge cases:

```tsx
'pui-sprig:pui:text-green-500'; // Only applies when brand is Sprig
```

**Use sparingly.** Prefer CSS token overrides over brand-specific utility classes. Brand variants in CVA and CSS token overrides should handle 99% of cases.

### CSS Bundle Sizes

Each brand CSS file includes Tailwind base + all tokens:

```
acorn.css    → ~14.7KB (gzipped)
sprig.css    → ~15.0KB (gzipped)
stelpro.css  → ~14.8KB (gzipped)
preflight.css → ~4.8KB (gzipped, optional CSS reset)
```
