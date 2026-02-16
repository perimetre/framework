---
name: perimetre-design-system
description: Expert guidance for implementing and extending the @perimetre/ui design system - a brand-aware, visually polymorphic React component library built on Tailwind CSS v4, CVA, and Radix UI primitives. Use when creating new components, adding brand variants, defining design tokens, reviewing UI component code, implementing accessible form fields, extending the token system, or working with the brand registry. Triggers on tasks involving design tokens, brand variants, CVA patterns, component theming, visual polymorphism, Tailwind v4 @theme, semantic tokens, pui prefix, data-pui-brand, component library architecture, accessible components, or form field components.
license: MIT
metadata:
  author: perimetre
  version: '1.0.0'
---

# Perimetre Design System Expert

Expert guide for implementing and extending `@perimetre/ui` - a brand-aware React component library that achieves visual polymorphism through a three-tier design token architecture, CVA-based brand variants, and Tailwind CSS v4.

## When to Apply

Reference these guidelines when:

- Creating new components for `@perimetre/ui`
- Adding or modifying brand variants (Acorn, Sprig, Stelpro)
- Defining or extending design tokens (CSS custom properties)
- Reviewing UI component code for pattern compliance
- Implementing accessible form fields or interactive components
- Debugging brand-switching or token resolution issues
- Consuming `@perimetre/ui` in a Next.js or React project

## Rule Categories by Priority

| Priority | Category                  | Impact   | Prefix           |
| -------- | ------------------------- | -------- | ---------------- |
| 1        | Component Architecture    | CRITICAL | `architecture-`  |
| 2        | Token Architecture        | CRITICAL | `tokens-`        |
| 3        | Brand System              | HIGH     | `brands-`        |
| 4        | Accessibility             | HIGH     | `accessibility-` |
| 5        | Consumption & Integration | MEDIUM   | `consumption-`   |

## Source of Truth

Always prioritize current implementation details from `packages/ui` over generic design-system advice.

- Primary docs:
  - `packages/ui/docs/design-token-guide.md`
  - `packages/ui/docs/building-radically-themeable-react-component-libraries.md`
- Primary code:
  - `packages/ui/src/brands/*`
  - `packages/ui/src/components/*`
  - `packages/ui/src/lib/brand-registry.ts`
  - `packages/ui/src/lib/cva/index.ts`
  - `packages/ui/src/styles/*`

## Quick Reference

### 1. Component Architecture (CRITICAL)

- `architecture-component-structure` - File structure, brand variant composition, and props patterns for every component
- `architecture-cva-patterns` - CVA configuration, compose(), twMerge integration, and variant design
- `architecture-styling-rules` - What to tokenize vs hardcode, pui: prefix usage, structural vs thematic properties

### 2. Token Architecture (CRITICAL)

- `tokens-three-tier-system` - Primitives, semantic tokens, and component tokens: when to use each tier
- `tokens-naming-conventions` - Token naming patterns, categories, and the pui namespace
- `tokens-pragmatic-creation` - Decision framework for when to create tokens vs use direct values
- `tokens-synthetic-tokens` - How to create synthetic tokens only when semantic/component coverage is insufficient

### 3. Brand System (HIGH)

- `brands-variant-composition` - How brands compose with CVA compose(), acorn-as-base pattern
- `brands-css-architecture` - CSS layers, brand CSS files, token override patterns
- `brands-adding-new` - Step-by-step guide for adding a new brand

### 4. Accessibility (HIGH)

- `accessibility-patterns` - ARIA patterns, keyboard navigation, focus management, form fields

### 5. Consumption & Integration (MEDIUM)

- `consumption-integration` - RSC compatibility, bundle optimization, CSS imports, brand initialization

## Architecture Overview

```
packages/ui/src/
├── brands/                          # Brand definitions + CSS tokens
│   ├── index.ts                     # Brand type, BRANDS const, DEFAULT_BRAND
│   ├── tailwind.css                 # @theme inline bridge + custom variants
│   ├── acorn/styles.css             # Base brand: all primitives + semantics
│   ├── sprig/styles.css             # Overrides only what differs
│   └── stelpro/styles.css           # Overrides only what differs
├── components/
│   └── ComponentName/
│       ├── index.tsx                # Brand-agnostic component
│       └── brands/
│           ├── index.ts             # Brand variants registry
│           ├── ComponentName.acorn.brand.ts   # Base (required)
│           ├── ComponentName.sprig.brand.ts   # Optional overrides
│           └── ComponentName.stelpro.brand.ts # Optional overrides
├── lib/
│   ├── brand-registry.ts            # Module-level brand state (RSC-safe)
│   └── cva/index.ts                 # CVA + twMerge integration
└── styles/
    ├── base.css                     # Tailwind imports + brand scoping
    ├── acorn.css                    # Brand CSS entry: base + acorn
    ├── sprig.css                    # Brand CSS entry: base + acorn + sprig
    └── stelpro.css                  # Brand CSS entry: base + acorn + stelpro
```

## Core Principles

### 1. Components Never Know the Active Brand

Components consume tokens by PURPOSE, never by value. A button asks for "the primary action color" (`pui:bg-pui-interactive-primary`), never "teal" or "green". The brand registry + CSS tokens handle resolution.

### 2. Acorn is Always the Base

Every brand inherits from Acorn. Brand variants only specify DIFFERENCES. If Sprig's button is identical to Acorn's except for text color, the Sprig variant file contains only the text color override.

### 3. Tokenize Appearance, Hardcode Structure

Colors, radii, shadows, typography, and motion are tokens. Display, position, alignment, and cursor are hardcoded. If changing a value requires a design discussion, it's a token. If it's an implementation detail, hardcode it.

### 4. Pragmatic Token Creation

Do NOT create tokens for every possible value. Create a token ONLY when:

- The value changes between brands (e.g., primary color)
- The value appears in 3+ components with the same semantic meaning
- A designer would need to adjust it during a brand exercise

When generated/system tokens are not enough, create a synthetic token only if it has a clear cross-component or cross-brand purpose. Do not create synthetic tokens for one-off layout tweaks.

### 5. Accessibility is Non-Negotiable

Every interactive component must be keyboard-accessible. Use Radix primitives for complex interactions. Support `aria-invalid`, `aria-describedby`, and focus-visible rings on all form elements.

## Decision Flowcharts

### Should I Create a New Token?

```
Does this value change between brands?
├── Yes → Create a semantic token
└── No
    ├── Is it used in 3+ components with the same purpose?
    │   ├── Yes → Create a semantic token
    │   └── No → Use a Tailwind utility directly
    └── Would a designer need to adjust this during a brand exercise?
        ├── Yes → Create a semantic token
        └── No → Hardcode it
```

### Should I Create a Component Token (Tier 3)?

```
Can the component be fully expressed with existing semantic tokens?
├── Yes → Don't create component tokens
└── No
    ├── Does a specific brand need this component to behave
    │   differently than the semantic token suggests?
    │   ├── Yes → Create a component token referencing the semantic token
    │   └── No → Extend the semantic token set instead
    └── Is this a one-off value only this component uses?
        ├── Yes → Hardcode it in the component
        └── No → Create a semantic token
```

## Common Mistakes

| Mistake                                      | Fix                                                               |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Using raw color values in components         | Use `pui:bg-pui-interactive-primary` etc.                         |
| Creating tokens for `display`, `position`    | Hardcode structural properties                                    |
| Missing `pui:` prefix on utilities           | All utilities must use the `pui:` prefix                          |
| Creating brand variant for identical styling | Only create brand files when styles differ                        |
| Using React Context for brand state          | Use module-level `brand-registry.ts` (RSC-safe)                   |
| Importing from barrel without need           | Use per-component imports for tree-shaking                        |
| Missing `data-pui-brand` on root element     | Required for CSS token scoping                                    |
| Creating component tokens prematurely        | Start with semantic tokens; add component tokens only when needed |
| Creating synthetic tokens for one-off styles | Synthetic tokens need clear multi-use or cross-brand value        |
| Tokenizing one-off values                    | Only tokenize values that repeat or vary between brands           |

## Review Checklist

When reviewing `@perimetre/ui` code, check:

- [ ] Component uses `getBrandVariant()` for styling, not hardcoded classes
- [ ] All color/shape/motion classes reference semantic tokens via `pui:` prefix
- [ ] Structural properties (display, align, cursor) are hardcoded, not tokenized
- [ ] Brand variant files only contain DIFFERENCES from Acorn base
- [ ] `BrandVariants<T>` type is satisfied with `acorn` key required
- [ ] Interactive elements have proper focus states (`focus-visible:shadow-pui-input-focus`)
- [ ] Form elements support `aria-invalid` and `aria-describedby`
- [ ] Component accepts and merges `className` prop via CVA
- [ ] Props extend `React.ComponentProps<'element'>` for native attributes
- [ ] No React Context used for brand state (use `brand-registry.ts`)
- [ ] New tokens follow naming convention: `--pui-{category}-{name}`
- [ ] Token is justified: changes between brands OR used in 3+ components
- [ ] Synthetic token (if added) has explicit rationale and no existing semantic alternative

## Reference Files

For detailed guidance on specific topics:

- [architecture-component-structure.md](rules/architecture-component-structure.md) - Component file structure, props, and brand variant composition
- [architecture-cva-patterns.md](rules/architecture-cva-patterns.md) - CVA configuration, compose(), and variant design
- [architecture-styling-rules.md](rules/architecture-styling-rules.md) - Token usage in components, pui: prefix, hardcoded vs tokenized
- [tokens-three-tier-system.md](rules/tokens-three-tier-system.md) - Primitive, semantic, and component token architecture
- [tokens-naming-conventions.md](rules/tokens-naming-conventions.md) - Token naming, categories, and the pui namespace
- [tokens-pragmatic-creation.md](rules/tokens-pragmatic-creation.md) - When to create tokens, when to hardcode
- [tokens-synthetic-tokens.md](rules/tokens-synthetic-tokens.md) - When synthetic tokens are appropriate and how to name/use them
- [brands-variant-composition.md](rules/brands-variant-composition.md) - Brand CVA composition and override patterns
- [brands-css-architecture.md](rules/brands-css-architecture.md) - CSS layers, brand files, token overrides
- [brands-adding-new.md](rules/brands-adding-new.md) - Adding a new brand step by step
- [accessibility-patterns.md](rules/accessibility-patterns.md) - ARIA, keyboard navigation, form accessibility
- [consumption-integration.md](rules/consumption-integration.md) - RSC, bundle size, CSS imports, initialization
