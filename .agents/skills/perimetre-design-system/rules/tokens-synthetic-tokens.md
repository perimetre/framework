---
title: Synthetic Token Strategy (Pragmatic by Default)
impact: CRITICAL
impactDescription: enables flexibility without token explosion
tags: tokens, synthetic, semantic, component, pragmatism, naming
---

## Synthetic Token Strategy (Pragmatic by Default)

Synthetic tokens are code-defined tokens created when existing primitive + semantic tokens cannot express a recurring design need cleanly.

In `@perimetre/ui`, treat synthetic tokens as an escape hatch, not the default path.

### What "Synthetic" Means Here

- Primitive tokens: raw values (`--pui-primitive-*`)
- Semantic tokens: public API consumed by components (`--pui-color-*`, `--pui-radius-*`)
- Synthetic tokens: additional code-authored semantic/component-level tokens introduced to solve real gaps

Synthetic tokens are useful when:

- A repeated UI behavior cannot be represented by current semantic tokens
- Multiple brands need a consistent named contract for the same concept
- A component family needs a shared visual primitive without polluting global semantics

### When to Create a Synthetic Token

Create one only when all are true:

1. Existing semantic tokens cannot express the requirement cleanly
2. The value has a stable semantic meaning (not a one-off tweak)
3. It is used in 2+ component surfaces now, or clearly planned across a component family
4. It improves maintainability more than it increases token surface area

If any condition fails, do not create it.

### When NOT to Create One

- One-off spacing/size adjustments in a single component
- Structural layout concerns (`display`, `position`, `grid`, `flex`)
- Temporary experimentation values
- Brand-specific quirks that can stay in a brand override CVA class

### Naming Pattern

Prefer semantic-first naming. Keep names explicit and short.

- Semantic synthetic: `--pui-{category}-{purpose}-{state?}`
- Component synthetic (rare): `--pui-{component}-{part}-{property}-{state?}`

Examples:

- Good: `--pui-color-surface-raised`
- Good: `--pui-shadow-focus-strong`
- Good (component-scoped): `--pui-field-addon-offset-inline`
- Bad: `--pui-special-value-1`
- Bad: `--pui-button-random-green`

### Implementation Pattern in This Repo

1. Define the token in brand CSS (`packages/ui/src/brands/*/styles.css`)
2. Keep Acorn as baseline; override only where needed in Sprig/Stelpro
3. Bridge to Tailwind utility in `packages/ui/src/brands/tailwind.css` using `@theme inline`
4. Consume via `pui:` utilities in CVA/component classes

Example:

```css
/* brands/acorn/styles.css */
@layer pui.semantic {
  [data-pui-brand] {
    --pui-shadow-focus-strong: 0 0 0 3px var(--pui-color-border-focus);
  }
}

/* brands/tailwind.css */
@theme inline {
  --shadow-pui-focus-strong: var(--pui-shadow-focus-strong);
}
```

```ts
// component variant
'pui:focus-visible:shadow-pui-focus-strong';
```

### Synthetic Token Governance

- Add a short rationale comment where the token is introduced
- Prefer extending existing semantic categories before adding new categories
- Audit synthetic tokens regularly; remove unused or single-use tokens
- If a synthetic token becomes broadly useful, promote it into core semantic vocabulary

### Practical Rule

Default to no new token.

Add a synthetic token only when it reduces overall complexity across brands and components.
