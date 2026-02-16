---
title: Pragmatic Token Creation - When to Create vs Hardcode
impact: CRITICAL
impactDescription: prevents token bloat while ensuring flexibility where it matters
tags: tokens, pragmatism, decision-framework, over-tokenization, under-tokenization
---

## Pragmatic Token Creation

The biggest risk in a token system is creating too many tokens. Every token adds maintenance cost, cognitive load, and documentation burden. Create tokens ONLY when they provide real value.

### The Decision Framework

Ask these four questions in order. If any answer is YES, create a token:

**1. Does this value change between brands?**

If Acorn uses `9999px` radius and Stelpro uses `0`, that's a token.

```css
/* YES - create a token */
--pui-radius-button: 9999px; /* Acorn: pill */
--pui-radius-button: 0; /* Stelpro: sharp */

/* NO - don't tokenize */
display: inline-flex; /* Same in every brand */
```

**2. Does it appear in 3+ components with the same semantic meaning?**

If the primary action color appears on buttons, links, and form focus states, it deserves a token.

```css
/* YES - used in Button, Badge, FieldInput focus, FieldCheckboxRadio */
--pui-color-interactive-primary: var(--pui-primitive-color-primary-6);

/* NO - only used in ImageCarousel's loading spinner */
/* Just use an arbitrary value or existing utility */
```

**3. Would a designer need to adjust this during a brand exercise?**

If a designer reviewing brand consistency would want to change this value, it's a token.

```css
/* YES - designer controls border radius philosophy */
--pui-radius-input: 0.375rem;

/* NO - designer doesn't care about flexbox alignment */
align-items: center;
```

**4. Does this need to sync between Figma and code?**

If the value has a corresponding token in the Figma design system, it should be a code token too.

### What NOT to Tokenize

**One-off values:**

```tsx
// WRONG: Token for a single-use value
// Don't create --pui-carousel-thumbnail-gap
'pui:gap-2'; // Just use Tailwind's spacing utility directly

// RIGHT: Use arbitrary values for one-offs
'pui:leading-[1.335rem]'; // Specific to button text, doesn't need a token
```

**Structural properties:**

```tsx
// WRONG: Tokenizing layout
--pui-button-display: inline-flex;  // Never changes between brands
--pui-input-position: relative;     // Never changes between brands

// RIGHT: Hardcode them
'pui:inline-flex pui:items-center pui:justify-center'
```

**Values with no semantic meaning across components:**

```tsx
// WRONG: Token because "it's a number"
--pui-carousel-slides-per-view: 3;  // Configuration, not a design token

// WRONG: Token for z-index
--pui-dropdown-z-index: 50;  // Context-dependent, not thematic
```

**Spacing that follows Tailwind's scale:**

```tsx
// WRONG: Creating tokens for standard spacing
--pui-spacing-button-x: 2rem;  // Just use pui:px-8
--pui-spacing-button-y: 0.625rem;  // Just use pui:py-2.5

// RIGHT: Use Tailwind utilities directly for spacing
'pui:px-8 pui:py-2.5'  // Standard Tailwind spacing
```

Exception: Create spacing tokens only when the SAME semantic spacing must be consistent across 3+ components AND might change between brands.

### Practical Examples from the Codebase

**Tokens that exist and SHOULD exist:**

```css
--pui-color-interactive-primary     /* Changes per brand, used in 5+ components */
--pui-radius-button                 /* Shape language varies dramatically */
--pui-shadow-input-focus            /* Focus ring style is a brand decision */
--pui-color-feedback-error          /* Error color must be consistent */
```

**Values that are NOT tokens and SHOULD NOT be:**

```tsx
'pui:px-5'; /* Button small padding - follows Tailwind scale */
'pui:text-base'; /* Font size - follows Tailwind scale */
'pui:inline-flex'; /* Layout - structural, never varies */
'pui:cursor-pointer'; /* Interaction - behavioral, never varies */
```

### Token Audit Checklist

When reviewing existing tokens or proposed new ones:

- [ ] Does removing this token break brand switching? If no, consider removing.
- [ ] Is this token referenced by only 1 component? If yes, consider inlining.
- [ ] Does this token duplicate Tailwind's built-in scale? If yes, use Tailwind directly.
- [ ] Can this token be expressed as an existing semantic token? If yes, reuse.
- [ ] Would a designer understand what this token controls? If no, rename or reconsider.

### The "Three Strikes" Rule

Don't create a token preemptively. Wait until you see the value used in 3 places with the same semantic meaning, OR until a brand needs a different value. Premature tokenization creates maintenance burden without benefit.

```
First use:  Hardcode it (or use Tailwind utility)
Second use: Note the duplication, still hardcode
Third use:  Now create a token - the pattern is clear
```

Exception: Values that are KNOWN to change between brands (like primary color) should be tokens from the start. The three-strikes rule applies to values where brand variance is uncertain.
