---
title: Three-Tier Token Architecture
impact: CRITICAL
impactDescription: foundation of the entire theming and brand-switching system
tags: tokens, primitives, semantic, component, three-tier, css-variables, theming
---

## Three-Tier Token Architecture

The design system uses a three-tier token architecture where each tier has a distinct purpose. Understanding when to use each tier prevents both under-tokenization (hardcoded values that should be tokens) and over-tokenization (excessive abstraction).

### Tier 1: Primitives - The Raw Palette

Primitives are raw values named by what they ARE, not what they're used FOR. They define what's possible.

```css
@layer pui.primitive {
  [data-pui-brand] {
    --pui-primitive-color-primary-6: hsl(172, 96%, 53%);
    --pui-primitive-color-overlay-1: #fdfdfc;
    --pui-primitive-color-overlay-12: #1b1b18;
    --pui-primitive-font-sans: 'Inter', sans-serif;
  }
}
```

**CRITICAL RULE: Components NEVER reference primitives directly.**

Primitives exist ONLY so that semantic tokens can reference them. If you find a component using `var(--pui-primitive-*)`, it's wrong.

### Tier 2: Semantic Tokens - The Design Decisions

Semantic tokens are the PUBLIC API. They express purpose and meaning, answering "what is this for?" not "what does it look like?"

```css
@layer pui.semantic {
  [data-pui-brand] {
    /* Background surfaces */
    --pui-color-bg-default: var(--pui-primitive-color-overlay-1);
    --pui-color-bg-subtle: var(--pui-primitive-color-overlay-2);

    /* Foreground / text */
    --pui-color-fg-default: var(--pui-primitive-color-overlay-12);
    --pui-color-fg-muted: var(--pui-primitive-color-overlay-11);

    /* Interactive elements */
    --pui-color-interactive-primary: var(--pui-primitive-color-primary-6);
    --pui-color-interactive-on-primary: var(--pui-primitive-color-overlay-12);

    /* Shape */
    --pui-radius-button: 9999px;
    --pui-radius-input: 0.375rem;

    /* Elevation */
    --pui-shadow-button: none;
    --pui-shadow-button-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1);

    /* Motion */
    --pui-duration-normal: 200ms;
  }
}
```

**Semantic tokens are where theming happens.** Brands override semantic tokens to change the visual expression:

```css
/* Acorn (base): teal primary, pill buttons */
--pui-color-interactive-primary: var(
  --pui-primitive-color-primary-6
); /* hsl(172, 96%, 53%) */
--pui-radius-button: 9999px;

/* Sprig (override): green primary, keeps pill buttons */
--pui-color-interactive-primary: var(
  --pui-primitive-color-primary-6
); /* #69c14c (redefined primitive) */

/* Stelpro (override): red primary, squared badges */
--pui-color-interactive-primary: var(
  --pui-primitive-color-primary-6
); /* #fe322a (redefined primitive) */
--pui-radius-badge: 0;
```

### Tier 3: Component Tokens - Optional Fine-Tuning

Component tokens are OPTIONAL. Use them ONLY when a specific component needs values that the semantic layer can't express.

**When to use component tokens:**

A brand needs a component to behave differently than the semantic token suggests. Example: The brutalist theme wants secondary buttons to invert colors on hover, but `color.foreground.default` shouldn't change globally.

**When NOT to use component tokens:**

If a component can be fully expressed with semantic tokens, DON'T create component tokens. Most components in `@perimetre/ui` use semantic tokens directly without a component token layer.

### Current Token Categories

The system defines these token categories:

**Color Tokens:**

```
--pui-color-bg-default          → Main surface color
--pui-color-bg-subtle           → Secondary surface
--pui-color-bg-muted            → Tertiary surface / disabled
--pui-color-fg-default          → Primary text
--pui-color-fg-muted            → Secondary text
--pui-color-fg-subtle           → Placeholder, disabled text
--pui-color-border-default      → Standard borders
--pui-color-border-focus        → Focus ring color
--pui-color-interactive-primary → Primary action color
--pui-color-interactive-on-primary → Text on primary color
--pui-color-input-bg            → Input background
--pui-color-input-border        → Input border (default)
--pui-color-input-border-focus  → Input border (focused)
--pui-color-input-text          → Input text color
--pui-color-input-placeholder   → Input placeholder color
--pui-color-control-unchecked-bg → Checkbox/radio unchecked background
--pui-color-control-checked-bg  → Checkbox/radio checked background
--pui-color-control-checkmark   → Checkmark/radio dot color
--pui-color-feedback-error      → Error state color
--pui-color-feedback-error-strong → Strong error (text on error bg)
--pui-color-feedback-error-light → Light error (error background)
```

**Shape Tokens:**

```
--pui-radius-button             → Button corner radius
--pui-radius-input              → Input corner radius
--pui-radius-badge              → Badge corner radius
--pui-radius-control            → Checkbox/radio corner radius
--pui-border-width-default      → Standard border thickness
```

**Elevation Tokens:**

```
--pui-shadow-button             → Button resting shadow
--pui-shadow-button-hover       → Button hover shadow
--pui-shadow-input              → Input resting shadow
--pui-shadow-input-focus        → Input focus ring shadow
```

**Typography Tokens:**

```
--pui-font-weight-label         → Button/label font weight
--pui-letter-spacing-label      → Button/label letter spacing
--pui-text-transform-label      → Button/label text transform
--pui-field-label-font-size     → Field label font size
--pui-field-label-line-height   → Field label line height
--pui-field-label-font-weight   → Field label font weight
--pui-field-label-color         → Field label color
```

**Motion Tokens:**

```
--pui-duration-normal           → Standard animation duration
```

### How Tokens Flow Through the System

```
Component uses:  pui:bg-pui-interactive-primary
        ↓
@theme inline defines:
  --color-pui-interactive-primary: var(--pui-color-interactive-primary)
        ↓
Semantic layer defines (per brand):
  --pui-color-interactive-primary: var(--pui-primitive-color-primary-6)
        ↓
Primitive layer defines (per brand):
  Acorn:   --pui-primitive-color-primary-6: hsl(172, 96%, 53%)  → Teal
  Sprig:   --pui-primitive-color-primary-6: #69c14c              → Green
  Stelpro: --pui-primitive-color-primary-6: #fe322a              → Red
```

### Adding a New Token

Before creating a new token, run through this checklist:

1. Does it change between brands? If no, consider hardcoding.
2. Is it used in 3+ components? If no, consider using an arbitrary Tailwind value.
3. Does it have a clear semantic purpose? If no, it shouldn't be a semantic token.
4. Can it be expressed by an existing token? If yes, use the existing one.

If all checks pass:

1. Add the primitive in `brands/acorn/styles.css` under `@layer pui.primitive`
2. Add the semantic token in `brands/acorn/styles.css` under `@layer pui.semantic`
3. Bridge it to Tailwind in `brands/tailwind.css` under `@theme inline`
4. Override the primitive or semantic value in other brand CSS files as needed
