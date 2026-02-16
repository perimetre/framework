---
title: Token Naming Conventions and the pui Namespace
impact: CRITICAL
impactDescription: ensures consistency, prevents conflicts, and enables discoverability
tags: tokens, naming, conventions, namespace, pui, css-variables, categories
---

## Token Naming Conventions and the pui Namespace

All design tokens in `@perimetre/ui` are namespaced with `--pui-` to prevent conflicts when the library is consumed by other projects. Token names follow a hierarchical structure from general to specific.

### Token Name Anatomy

```
--pui-{category}-{subcategory}-{element}-{variant}-{state}
  │       │            │           │         │        │
  │       │            │           │         │        └── hover, focus, disabled
  │       │            │           │         └── default, muted, subtle, strong
  │       │            │           └── button, input, card, label
  │       │            └── bg, fg, border, interactive, input, control
  │       └── color, radius, shadow, duration, font-weight, etc.
  └── Namespace (always "pui")
```

Not every token uses all levels. Use only what's needed for clarity:

```
--pui-color-bg-default              → 3 levels
--pui-color-interactive-primary     → 3 levels
--pui-color-input-border-focus      → 4 levels (with state)
--pui-radius-button                 → 2 levels (category + element)
--pui-shadow-button-hover           → 3 levels (with state)
```

### Primitive Token Naming

Primitives are named by what they ARE:

```
--pui-primitive-color-primary-{N}     → Primary color scale (1-12)
--pui-primitive-color-overlay-{N}     → Overlay/neutral scale (1-12)
--pui-primitive-font-sans             → Sans-serif font stack
```

The number suffixes (1-12) follow a consistent scale where lower numbers are lighter/more transparent and higher numbers are darker/more opaque.

### Semantic Token Naming by Category

**Color tokens** - subcategory expresses the ROLE:

```
--pui-color-bg-*           → Background surfaces
--pui-color-fg-*           → Foreground (text, icons)
--pui-color-border-*       → Borders, strokes, dividers
--pui-color-interactive-*  → Buttons, links, form controls
--pui-color-input-*        → Form input specific colors
--pui-color-control-*      → Checkbox/radio specific colors
--pui-color-feedback-*     → Error, warning, success states
```

**Shape tokens** - element-specific:

```
--pui-radius-button        → Button corner radius
--pui-radius-input         → Input corner radius
--pui-radius-badge         → Badge corner radius
--pui-radius-control       → Checkbox/radio corner radius
--pui-border-width-default → Standard border thickness
```

**Elevation tokens** - element + state:

```
--pui-shadow-button        → Button resting shadow
--pui-shadow-button-hover  → Button hover shadow
--pui-shadow-input         → Input resting shadow
--pui-shadow-input-focus   → Input focus ring shadow
```

**Typography tokens** - role-specific:

```
--pui-font-weight-label        → Button/label weight
--pui-letter-spacing-label     → Button/label tracking
--pui-text-transform-label     → Button/label transform
--pui-field-label-font-size    → Field label size
--pui-field-label-font-weight  → Field label weight
--pui-field-label-color        → Field label color
```

**Motion tokens**:

```
--pui-duration-normal      → Standard transition duration
```

### Tailwind Utility Naming Bridge

The `@theme inline` directive bridges CSS variables to Tailwind utilities. The bridge adds a second `pui` level to create the utility namespace:

```css
@theme inline {
  /* CSS variable name          →  Tailwind utility generated */
  --color-pui-interactive-primary: var(--pui-color-interactive-primary);
  /* Usage: pui:bg-pui-interactive-primary */

  --radius-pui-button: var(--pui-radius-button);
  /* Usage: pui:rounded-pui-button */

  --shadow-pui-button: var(--pui-shadow-button);
  /* Usage: pui:shadow-pui-button */
}
```

The pattern is: `--{tailwind-namespace}-pui-{token-path}: var(--pui-{token-path})`

### Naming Rules

**Do:**

- Use lowercase with hyphens for multi-word segments: `--pui-color-bg-default`
- Be specific enough to understand without documentation: `--pui-color-interactive-primary`
- Use consistent variant names: `default`, `muted`, `subtle`, `strong`, `inverse`
- Use consistent state names: `hover`, `focus`, `disabled`, `active`
- Keep the `--pui-` prefix on ALL tokens

**Don't:**

- Include raw values in names: `--pui-color-blue-600` belongs in primitives only
- Use abbreviations beyond well-known ones: `bg` is fine, `fgnd` is not
- Create inconsistent state naming: if buttons use `hover`, inputs should too (not `hovered`)
- Nest deeper than 5 levels: `--pui-color-input-border-error-hover` is the practical maximum
- Skip the namespace: `--color-primary` could conflict with consumer styles

### When Adding New Tokens

Check these patterns before naming:

1. Does a token with similar purpose already exist? Reuse it.
2. Does the name clearly communicate purpose? A developer should understand it without docs.
3. Does it follow existing patterns? If inputs use `--pui-color-input-*`, a new input token should too.
4. Is the name consistent across categories? If borders use `default`/`focus`, don't introduce `normal`/`focused`.
