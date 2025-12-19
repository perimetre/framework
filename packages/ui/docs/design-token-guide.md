# Design Token Architecture Guide

A practical guide for designers and developers building visually polymorphic component libraries with Tailwind v4.

---

## What this document covers

This guide establishes our approach to design tokens: how we name them, how we decide what becomes a token, and how we break down UI components into their tokenizable parts. The goal is a shared language between design and engineering that enables radical theming without code duplication.

**Who this is for:** Designers working in Figma and developers implementing components. Both roles need to understand the same token architecture to keep design and code in sync.

---

## The core principle: Semantic tokens are the API

The fundamental insight is separation of concerns. Components never know which theme is active. They consume tokens by purpose, not by value. A button asks for "the primary action color" rather than "blue-600."

This creates a contract between components and themes:

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPONENTS                                │
│         Consume tokens by purpose, never by value               │
│         Example: "Give me the button radius"                    │
├─────────────────────────────────────────────────────────────────┤
│                    SEMANTIC TOKEN CONTRACT                       │
│         The shared language between components and themes        │
│         Example: --radius-button                                │
├─────────────────────────────────────────────────────────────────┤
│      THEME A          │     THEME B          │    THEME C       │
│      (minimal)        │     (brutalist)      │    (brand)       │
│   --radius-button:    │  --radius-button:    │ --radius-button: │
│      9999px           │       0              │     8px          │
└─────────────────────────────────────────────────────────────────┘
```

The same component code renders completely different visuals because themes implement the contract differently. A button with `rounded-button` becomes a pill in the minimal theme and a sharp rectangle in the brutalist theme.

---

## The three-tier token architecture

We organize tokens into three tiers, each with a distinct purpose. Understanding when to use each tier prevents both under-tokenization (hardcoded values that should be tokens) and over-tokenization (excessive abstraction that creates maintenance burden).

### Tier 1: Primitives — The raw palette

Primitives are the raw values that define what's possible. Think of them as the paint colors on your palette before you decide what to paint. They're named by what they are, not what they're used for.

**Naming pattern:** `{category}.primitive.{name}`

```
color.primitive.blue-500      → #3b82f6
color.primitive.gray-900      → #18181b
spacing.primitive.4           → 1rem
radius.primitive.full         → 9999px
radius.primitive.none         → 0
shadow.primitive.soft-md      → 0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow.primitive.hard-sm      → 4px 4px 0 0 currentColor
```

**The critical rule: Components never reference primitives directly.** Primitives exist only so that semantic tokens can reference them. If you find yourself writing `bg-blue-500` in a component, stop. You need a semantic token.

Why? Because if a component uses `blue-500` directly, switching themes requires changing component code. But if the component uses `color-primary` which references `blue-500`, switching themes only requires changing which primitive `color-primary` points to.

### Tier 2: Semantic tokens — The design decisions

Semantic tokens are the public API of your design system. They encode design decisions by expressing purpose and meaning. A semantic token answers "what is this for?" not "what does it look like?"

**Naming pattern:** `{category}.{subcategory}.{element}.{variant?}.{state?}`

```
color.background.default      → references color.primitive.white
color.background.subtle       → references color.primitive.gray-50
color.background.inverse      → references color.primitive.gray-900

color.foreground.default      → references color.primitive.gray-900
color.foreground.muted        → references color.primitive.gray-500
color.foreground.inverse      → references color.primitive.white

color.interactive.primary           → references color.primitive.blue-600
color.interactive.primary-hover     → references color.primitive.blue-700
color.interactive.on-primary        → references color.primitive.white

color.border.default          → references color.primitive.gray-200
color.border.focus            → references color.primitive.blue-500

shape.radius.button           → references radius.primitive.md
shape.radius.input            → references radius.primitive.md
shape.radius.card             → references radius.primitive.lg

elevation.shadow.button       → references shadow.primitive.none
elevation.shadow.button-hover → references shadow.primitive.soft-sm
elevation.shadow.card         → references shadow.primitive.soft-md

motion.duration.normal        → references duration.primitive.200
motion.easing.default         → references easing.primitive.ease-out
```

Semantic tokens are where theming happens. The minimal theme might set `shape.radius.button` to `9999px` (full pill), while the brutalist theme sets it to `0` (sharp corners). Components don't change; only the semantic token values change.

### Tier 3: Component tokens — Optional fine-tuning

Component tokens are optional. Use them when a specific component needs values that don't fit the semantic pattern, or when you want to allow per-component overrides without changing the semantic layer.

**Naming pattern:** `{component}.{element}.{property}.{variant?}.{state?}`

```
button.primary.background.default     → references color.interactive.primary
button.primary.background.hover       → references color.interactive.primary-hover
button.primary.text                   → references color.interactive.on-primary
button.primary.border                 → transparent
button.primary.shadow.default         → references elevation.shadow.button
button.primary.shadow.hover           → references elevation.shadow.button-hover

button.secondary.background.default   → transparent
button.secondary.background.hover     → references color.background.subtle
button.secondary.text                 → references color.foreground.default
button.secondary.border               → references color.border.default

input.background.default              → references color.background.default
input.background.focus                → references color.background.default
input.text                            → references color.foreground.default
input.placeholder                     → references color.foreground.subtle
input.border.default                  → references color.border.default
input.border.focus                    → references color.interactive.primary
input.border.error                    → references color.feedback.error
```

**When to use component tokens:** Use them when a theme needs to override a specific component differently than the semantic token would suggest. For example, the brutalist theme might want secondary buttons to invert colors on hover (white text on black background) even though `color.foreground.default` is black. A component token `button.secondary.text.hover` allows this override without affecting other uses of `color.foreground.default`.

**When to skip component tokens:** If a component can be fully expressed using semantic tokens, don't create component tokens. Extra abstraction layers add maintenance burden. Start with semantic tokens; add component tokens only when you encounter a case that requires them.

---

## Naming conventions in detail

Good token names are self-documenting. A designer or developer should understand what a token controls without looking up documentation.

### The anatomy of a token name

Token names follow a hierarchical structure that moves from general to specific:

```
{category}.{subcategory}.{element}.{variant}.{state}
     │           │           │         │        │
     │           │           │         │        └── hover, active, disabled, focus
     │           │           │         └── primary, secondary, subtle, muted
     │           │           └── button, input, card, text, border
     │           └── background, foreground, interactive, feedback
     └── color, spacing, shape, elevation, typography, motion
```

Not every token uses all levels. Use only what's needed for clarity:

```
color.background.default          → 3 levels (category.subcategory.element)
color.interactive.primary-hover   → 4 levels (state embedded in element name)
button.primary.background.hover   → 4 levels (component.variant.property.state)
```

### Category naming

Categories are the top-level groupings. Keep them consistent across your entire system:

| Category     | What it controls         | Examples                                                         |
| ------------ | ------------------------ | ---------------------------------------------------------------- |
| `color`      | All color values         | backgrounds, text, borders, interactive states                   |
| `spacing`    | Whitespace and gaps      | padding, margin, gap                                             |
| `shape`      | Physical form            | border-radius, border-width                                      |
| `elevation`  | Depth and layering       | shadows, z-index relationships                                   |
| `typography` | Text treatment           | font-family, font-size, font-weight, line-height, letter-spacing |
| `motion`     | Animation and transition | duration, easing, delay                                          |

### Subcategory patterns by type

**Color subcategories** express the role of the color:

```
color.background.*     → surfaces, containers, cards
color.foreground.*     → text, icons
color.border.*         → strokes, dividers
color.interactive.*    → buttons, links, form controls
color.feedback.*       → error, warning, success, info
```

**Spacing subcategories** express the spatial relationship:

```
spacing.inset.*        → internal padding (padding)
spacing.stack.*        → vertical spacing between elements
spacing.inline.*       → horizontal spacing between elements
spacing.gap.*          → spacing in flex/grid layouts
```

**Typography subcategories** express the text role:

```
typography.family.*    → font-family values
typography.size.*      → font-size scale
typography.weight.*    → font-weight values
typography.leading.*   → line-height values
typography.tracking.*  → letter-spacing values
typography.transform.* → text-transform values (uppercase, etc.)
```

### Variant naming

Variants express intensity, prominence, or alternative options:

**For prominence/intensity:**

```
default    → standard, most common use
subtle     → less prominent, lower contrast
muted      → even less prominent, de-emphasized
strong     → more prominent, higher contrast
inverse    → opposite of default (light on dark or dark on light)
```

**For semantic roles:**

```
primary    → main action or brand color
secondary  → supporting action
```

**For feedback:**

```
error      → destructive, problems
warning    → caution, attention needed
success    → positive confirmation
info       → neutral information
```

### State naming

States follow a consistent pattern across all interactive elements:

```
default    → resting state (often omitted as it's implied)
hover      → mouse over
active     → being pressed/clicked
focus      → keyboard focus
disabled   → non-interactive
selected   → chosen/checked state
```

Combine states when needed: `button.primary.background.hover` vs `button.primary.background.disabled`.

### Naming do's and don'ts

**Do:**

- Use lowercase with hyphens for multi-word segments: `primary-hover`, not `primaryHover`
- Be specific enough to understand without context: `color.interactive.primary` not `color.blue`
- Keep names pronounceable: you'll say them in meetings
- Match Figma token names exactly to CSS custom property names

**Don't:**

- Include raw values in names: `color.blue-600` belongs in primitives only
- Use abbreviations that aren't universally understood: `bg` is fine, `fgnd` is not
- Create inconsistent patterns: if buttons use `hover`, inputs should too (not `hovered`)
- Nest too deeply: 5+ levels becomes hard to parse

---

## Breaking down UI components into tokens

This is where the practical work happens. Given a UI component, how do you decide which properties become tokens?

### The decision framework

Ask these questions about each visual property:

**1. Does this change between themes?**
If a property should look different in a minimal theme versus a brutalist theme, it needs to be a token. Border-radius is the classic example: pills in one theme, sharp corners in another.

**2. Does this appear in multiple components?**
If three or more components use the same value, that value should be a semantic token. The primary action color appears on buttons, links, and form focus states, so it's `color.interactive.primary`.

**3. Does this represent a design decision?**
If changing this value would require a design discussion (not just a code change), it should be a token. "Should buttons have shadows?" is a design decision. "Should buttons use flexbox?" is an implementation detail.

**4. Does this need to sync between design and code?**
If designers specify this value in Figma and developers implement it in code, it should be a token. This is the core purpose of tokens: a shared language.

### What to tokenize vs. what to hardcode

**Always tokenize (these change between themes):**

| Property           | Why it's tokenized    | Theme variance example      |
| ------------------ | --------------------- | --------------------------- |
| Colors             | Core brand expression | Blue vs. red primary        |
| Border radius      | Shape language        | Rounded vs. sharp           |
| Shadows            | Depth perception      | Soft blur vs. hard drop     |
| Font families      | Typographic voice     | Sans-serif vs. monospace    |
| Font weights       | Visual weight         | Light vs. heavy             |
| Letter spacing     | Typographic feel      | Tight vs. tracked           |
| Text transform     | Formality level       | Sentence case vs. uppercase |
| Animation duration | Motion personality    | Smooth vs. instant          |
| Border width       | Visual weight         | 1px delicate vs. 3px bold   |

**Hardcode (these are structural, not thematic):**

| Property                 | Why it's hardcoded          |
| ------------------------ | --------------------------- |
| `display: flex`          | Layout structure            |
| `position: relative`     | Positioning context         |
| `align-items: center`    | Alignment logic             |
| `width: 100%`            | Sizing relationships        |
| `cursor: pointer`        | Interaction affordance      |
| `pointer-events: none`   | Behavior control            |
| `box-sizing: border-box` | Box model                   |
| `overflow: hidden`       | Content clipping            |
| `z-index` relationships  | Stacking within a component |

The key distinction: **Tokens control how something looks. Hardcoded values control how something works.**

### Component anatomy exercise

Let's break down a button to see the tokenization process in action:

```
┌─────────────────────────────────────────────────────────────────┐
│                           BUTTON                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐     │
│    │     ← padding-x →                                   │     │
│    │  ↑                                                  │     │
│    │  │ padding-y                                        │     │
│    │  ↓                                                  │     │
│    │        [icon]  gap  Button Label                    │     │
│    │  ↑                                                  │     │
│    │  │ padding-y                                        │     │
│    │  ↓                                                  │     │
│    │     ← padding-x →                                   │     │
│    └─────────────────────────────────────────────────────┘     │
│         ↑                                                       │
│         └── border-radius (corner shape)                       │
│         └── border-width (stroke thickness)                    │
│         └── border-color (stroke color)                        │
│         └── background-color (fill)                            │
│         └── box-shadow (elevation)                             │
│                                                                 │
│    Text properties:                                             │
│         └── font-family                                        │
│         └── font-size                                          │
│         └── font-weight                                        │
│         └── letter-spacing                                     │
│         └── text-transform                                     │
│         └── color                                              │
│                                                                 │
│    Transition properties:                                       │
│         └── transition-duration                                │
│         └── transition-timing-function                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

For each property, we apply the decision framework:

| Property                     | Tokenize? | Reasoning                                  | Token name                          |
| ---------------------------- | --------- | ------------------------------------------ | ----------------------------------- |
| `background-color`           | Yes       | Changes per theme, design decision         | `button.primary.background.default` |
| `color` (text)               | Yes       | Must contrast with background              | `button.primary.text`               |
| `border-radius`              | Yes       | Shape language varies dramatically         | `shape.radius.button`               |
| `border-width`               | Yes       | Weight varies (1px minimal, 3px brutalist) | `shape.border-width.default`        |
| `border-color`               | Yes       | May need separate control from background  | `button.primary.border`             |
| `box-shadow`                 | Yes       | Soft blur vs. hard drop shadow             | `button.primary.shadow.default`     |
| `padding-x`                  | Yes       | Proportions may vary                       | `spacing.component.padding-x`       |
| `padding-y`                  | Yes       | Proportions may vary                       | `spacing.component.padding-y`       |
| `gap`                        | Yes       | Internal spacing                           | `spacing.component.gap`             |
| `font-family`                | Yes       | Typography voice changes                   | `typography.family.ui`              |
| `font-size`                  | Yes       | Scale may vary                             | `typography.size.label`             |
| `font-weight`                | Yes       | Weight varies per theme                    | `typography.weight.label`           |
| `letter-spacing`             | Yes       | Tracking varies (0 vs. 0.15em)             | `typography.tracking.label`         |
| `text-transform`             | Yes       | Sentence case vs. uppercase                | `typography.transform.label`        |
| `transition-duration`        | Yes       | 200ms smooth vs. 0ms instant               | `motion.duration.normal`            |
| `transition-timing-function` | Yes       | Easing curve                               | `motion.easing.default`             |
| `display: inline-flex`       | No        | Structural, always flex                    | Hardcoded                           |
| `align-items: center`        | No        | Always vertically centered                 | Hardcoded                           |
| `justify-content: center`    | No        | Always horizontally centered               | Hardcoded                           |
| `cursor: pointer`            | No        | Always a pointer on buttons                | Hardcoded                           |

### Component anatomy: Input field

```
┌─────────────────────────────────────────────────────────────────┐
│                          INPUT FIELD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐     │
│    │                                                     │     │
│    │     Placeholder text or entered value               │     │
│    │                                                     │     │
│    └─────────────────────────────────────────────────────┘     │
│         ↑                                                       │
│         └── border-radius (corner shape)                       │
│         └── border-width (stroke thickness)                    │
│         └── border-color (default, focus, error states)        │
│         └── background-color (may change on focus)             │
│         └── box-shadow (focus ring style)                      │
│                                                                 │
│    Text properties:                                             │
│         └── font-family                                        │
│         └── font-size                                          │
│         └── color (input text)                                 │
│         └── placeholder color                                  │
│                                                                 │
│    States to consider:                                          │
│         └── default                                            │
│         └── focus (border change, shadow ring)                 │
│         └── error (border color, possibly background)          │
│         └── disabled (opacity, cursor)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Tokens for an input field:

```
input.background.default       → color.background.default
input.background.focus         → color.background.default (or subtle change)
input.text                     → color.foreground.default
input.placeholder              → color.foreground.subtle
input.border.default           → color.border.default
input.border.focus             → color.interactive.primary
input.border.error             → color.feedback.error

shape.radius.input             → (semantic, shared with similar form elements)
shape.border-width.default     → (semantic, used across components)
elevation.shadow.input         → none (in minimal) or subtle (in other themes)
elevation.shadow.input-focus   → focus ring style (0 0 0 3px rgba(59, 130, 246, 0.15))
```

Notice how input tokens mostly reference semantic tokens rather than defining new values. This is the ideal pattern: component tokens provide a convenient grouping but delegate to semantic tokens for actual values.

### Component anatomy: Card

```
┌─────────────────────────────────────────────────────────────────┐
│                             CARD                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐     │
│    │                                                     │     │
│    │     Card header area                                │     │
│    │     ─────────────────────────────── (divider)      │     │
│    │     Card body content                               │     │
│    │                                                     │     │
│    │     Card footer with actions                        │     │
│    │                                                     │     │
│    └─────────────────────────────────────────────────────┘     │
│         ↑                                                       │
│         └── border-radius (larger than buttons typically)      │
│         └── border-width                                       │
│         └── border-color                                       │
│         └── background-color                                   │
│         └── box-shadow (elevation, depth)                      │
│         └── padding (internal spacing)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Cards typically use semantic tokens directly without needing a component token layer:

```css
.card {
  background-color: var(--color-background-default);
  border-radius: var(--shape-radius-card);
  border: var(--shape-border-width-default) solid var(--color-border-default);
  box-shadow: var(--elevation-shadow-card);
  padding: var(--spacing-inset-lg);
}
```

The semantic tokens handle theming automatically. In a minimal theme, `elevation.shadow.card` might be a soft multi-layer shadow. In a brutalist theme, it might be a hard 8px offset black shadow. The card component code stays identical.

---

## How tokens create visual polymorphism

Understanding how the same tokens produce radically different results helps cement the architecture. Let's trace a button through two themes:

### Minimal theme values

```css
[data-theme='minimal'] {
  /* Shape: rounded, soft */
  --shape-radius-button: 9999px;
  --shape-border-width-default: 1px;

  /* Color: soft blue, subtle */
  --color-interactive-primary: #3b82f6;
  --color-interactive-primary-hover: #2563eb;
  --color-interactive-on-primary: #ffffff;

  /* Elevation: soft blur shadows */
  --elevation-shadow-button: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --elevation-shadow-button-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  /* Typography: natural, refined */
  --typography-family-ui: 'Outfit', sans-serif;
  --typography-weight-label: 500;
  --typography-tracking-label: 0.01em;
  --typography-transform-label: none;

  /* Motion: smooth, relaxed */
  --motion-duration-normal: 200ms;
  --motion-easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Result: A pill-shaped button with soft blue fill, subtle shadow that grows on hover, refined sans-serif text in sentence case, and smooth 200ms transitions.

### Brutalist theme values

```css
[data-theme='brutalist'] {
  /* Shape: sharp, bold */
  --shape-radius-button: 0;
  --shape-border-width-default: 3px;

  /* Color: stark red, high contrast */
  --color-interactive-primary: #ff0000;
  --color-interactive-primary-hover: #cc0000;
  --color-interactive-on-primary: #ffffff;

  /* Elevation: hard drop shadows */
  --elevation-shadow-button: 4px 4px 0 0 #000000;
  --elevation-shadow-button-hover: 6px 6px 0 0 #000000;

  /* Typography: bold, tracked, uppercase */
  --typography-family-ui: 'Space Mono', monospace;
  --typography-weight-label: 700;
  --typography-tracking-label: 0.15em;
  --typography-transform-label: uppercase;

  /* Motion: instant, no transitions */
  --motion-duration-normal: 0ms;
  --motion-easing-default: linear;
}
```

Result: A sharp rectangular button with bold red fill, hard black drop shadow that jumps on hover, monospace text in uppercase with wide tracking, and instant state changes with no animation.

**The button component code is identical.** Only the token values change. This is visual polymorphism.

---

## Avoiding common pitfalls

### Pitfall 1: Referencing primitives in components

**Wrong:**

```css
.button {
  background-color: var(--color-primitive-blue-600);
  border-radius: var(--radius-primitive-md);
}
```

**Right:**

```css
.button {
  background-color: var(--button-primary-background);
  border-radius: var(--shape-radius-button);
}
```

When you reference primitives directly, you bypass the theming layer. The whole point of semantic tokens is that themes can swap what they point to without changing components.

### Pitfall 2: Over-tokenizing structural properties

**Wrong:**

```css
.button {
  display: var(--button-display);
  align-items: var(--button-align-items);
  cursor: var(--button-cursor);
}
```

**Right:**

```css
.button {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
```

These properties are structural. They don't change between themes. Tokenizing them adds maintenance burden with no benefit. Save tokens for properties that actually vary.

### Pitfall 3: Inconsistent naming across tiers

**Wrong:**

```
color.bg.default           (uses 'bg')
color.foreground.primary   (uses 'foreground')
color.text.muted           (uses 'text')
```

**Right:**

```
color.background.default   (consistent naming)
color.foreground.default   (consistent naming)
color.foreground.muted     (consistent naming)
```

Pick a naming convention and stick with it. If you use `background` for surfaces, don't suddenly switch to `bg`. The full word is clearer and prevents confusion.

### Pitfall 4: Creating component tokens prematurely

**Wrong approach:** Creating `button.primary.background`, `button.secondary.background`, `card.background`, `modal.background`, `dropdown.background` before knowing if they'll ever diverge.

**Right approach:** Start with semantic tokens (`color.background.default`, `color.interactive.primary`). Add component tokens only when a specific theme requires a component to behave differently than the semantic token would suggest.

Most components can be fully expressed with semantic tokens. Component tokens are an escape hatch, not the default.

### Pitfall 5: Forgetting states

**Incomplete:**

```
button.primary.background   → only covers default state
```

**Complete:**

```
button.primary.background.default
button.primary.background.hover
button.primary.background.active
button.primary.background.disabled
```

Or, use the semantic interactive color which already has states defined:

```
color.interactive.primary
color.interactive.primary-hover
color.interactive.primary-active
color.interactive.primary-disabled
```

Interactive components have states. Plan for them from the beginning rather than adding them as afterthoughts.

---

## Token categories reference

Here's a complete reference of token categories for a visually polymorphic system. Not every project needs all of these; start with what you need and add categories as requirements emerge.

### Color tokens

```
color.primitive.{color}-{shade}      → raw palette (blue-500, gray-900)

color.background.default             → main surface color
color.background.subtle              → secondary surface (cards, sections)
color.background.muted               → tertiary surface (disabled states)
color.background.inverse             → opposite of default (dark section in light theme)

color.foreground.default             → primary text
color.foreground.muted               → secondary text, descriptions
color.foreground.subtle              → placeholder, disabled text
color.foreground.inverse             → text on inverse background

color.border.default                 → standard borders
color.border.strong                  → emphasized borders
color.border.subtle                  → barely visible borders
color.border.focus                   → focus ring color

color.interactive.primary            → primary action color
color.interactive.primary-hover      → primary hover state
color.interactive.primary-active     → primary pressed state
color.interactive.on-primary         → text/icon on primary color

color.feedback.error                 → error states
color.feedback.error-subtle          → error backgrounds
color.feedback.warning               → warning states
color.feedback.success               → success states
color.feedback.info                  → informational states
```

### Shape tokens

```
shape.radius.none                    → 0 (sharp corners)
shape.radius.sm                      → small radius (4px typical)
shape.radius.md                      → medium radius (6-8px typical)
shape.radius.lg                      → large radius (12px typical)
shape.radius.full                    → full pill (9999px)

shape.radius.button                  → semantic: button corner shape
shape.radius.input                   → semantic: input corner shape
shape.radius.card                    → semantic: card corner shape
shape.radius.badge                   → semantic: badge corner shape

shape.border-width.none              → 0
shape.border-width.default           → standard border (1px typical)
shape.border-width.strong            → emphasized border (2-3px typical)
```

### Spacing tokens

```
spacing.primitive.0                  → 0
spacing.primitive.1                  → 0.25rem (4px)
spacing.primitive.2                  → 0.5rem (8px)
spacing.primitive.3                  → 0.75rem (12px)
spacing.primitive.4                  → 1rem (16px)
spacing.primitive.6                  → 1.5rem (24px)
spacing.primitive.8                  → 2rem (32px)

spacing.component.padding-x          → horizontal padding for components
spacing.component.padding-y          → vertical padding for components
spacing.component.gap                → gap between internal elements

spacing.input.padding-x              → input horizontal padding
spacing.input.padding-y              → input vertical padding
```

### Typography tokens

```
typography.family.body               → body text font
typography.family.heading            → heading font
typography.family.ui                 → UI elements (buttons, labels)
typography.family.mono               → monospace/code font

typography.size.xs                   → 0.75rem (12px)
typography.size.sm                   → 0.875rem (14px)
typography.size.base                 → 1rem (16px)
typography.size.lg                   → 1.125rem (18px)
typography.size.xl                   → 1.25rem (20px)

typography.size.body                 → semantic: body text size
typography.size.label                → semantic: label/button text size

typography.weight.normal             → 400
typography.weight.medium             → 500
typography.weight.semibold           → 600
typography.weight.bold               → 700

typography.weight.body               → semantic: body text weight
typography.weight.heading            → semantic: heading weight
typography.weight.label              → semantic: label weight

typography.leading.tight             → 1.25
typography.leading.normal            → 1.5
typography.leading.relaxed           → 1.75

typography.tracking.tight            → -0.01em
typography.tracking.normal           → 0
typography.tracking.wide             → 0.05em
typography.tracking.wider            → 0.15em

typography.tracking.body             → semantic: body letter spacing
typography.tracking.label            → semantic: label letter spacing

typography.transform.none            → none
typography.transform.uppercase       → uppercase
typography.transform.label           → semantic: label text transform
```

### Elevation tokens

```
shadow.primitive.none                → none
shadow.primitive.sm                  → 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow.primitive.md                  → 0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow.primitive.lg                  → 0 10px 15px -3px rgb(0 0 0 / 0.1)
shadow.primitive.hard-sm             → 4px 4px 0 0 currentColor
shadow.primitive.hard-md             → 6px 6px 0 0 currentColor
shadow.primitive.hard-lg             → 8px 8px 0 0 currentColor

elevation.shadow.button              → semantic: button shadow
elevation.shadow.button-hover        → semantic: button hover shadow
elevation.shadow.card                → semantic: card shadow
elevation.shadow.input               → semantic: input shadow
elevation.shadow.input-focus         → semantic: input focus ring
elevation.shadow.dropdown            → semantic: dropdown/popover shadow
elevation.shadow.modal               → semantic: modal overlay shadow
```

### Motion tokens

```
motion.duration.instant              → 0ms
motion.duration.fast                 → 100ms
motion.duration.normal               → 200ms
motion.duration.slow                 → 300ms
motion.duration.slower               → 500ms

motion.easing.linear                 → linear
motion.easing.ease                   → ease
motion.easing.ease-in                → ease-in
motion.easing.ease-out               → ease-out
motion.easing.ease-in-out            → ease-in-out
motion.easing.default                → semantic: standard easing curve
```

### How components use tokens: Button example

Our Button component demonstrates the token architecture in practice. Instead of a single component with theme-switching CSS variables, we use a **brand variants pattern** where each brand defines its own CVA (Class Variance Authority) variant configuration.

#### File structure

```
src/components/Button/
├── index.tsx                      # Main component (brand-agnostic)
└── brands/
    ├── index.ts                   # Brand variants registry
    ├── Button.acorn.brand.ts      # Base brand (required)
    ├── Button.sprig.brand.ts      # Sprig brand overrides
    └── Button.stelpro.brand.ts    # Stelpro brand overrides
```

#### The main component

The Button component itself is brand-agnostic. It delegates styling to the active brand's variant:

```tsx
// src/components/Button/index.tsx
import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import { buttonBrandVariants, type ButtonVariantProps } from './brands';

export type ButtonProps = {
  asChild?: boolean;
} & ButtonVariantProps &
  React.ComponentProps<'button'>;

const Button: React.FC<PropsWithChildren<ButtonProps>> = ({
  asChild,
  children,
  className,
  size,
  ...props
}) => {
  const Comp = asChild ? Slot.Slot : 'button';

  // Get the pre-composed brand variant (composition happens at module load, not render)
  const buttonVariants = getBrandVariant(buttonBrandVariants);

  return (
    <Comp className={buttonVariants({ size, className })} {...props}>
      {children}
    </Comp>
  );
};
```

Key points:

- Component has **zero hardcoded brand-specific styles**
- `getBrandVariant()` returns the correct CVA function for the active brand
- Structural props (`asChild`) and variant props (`size`) are handled uniformly

#### Base brand variant (Acorn)

The base brand defines all tokenized styles and available variants:

```tsx
// src/components/Button/brands/Button.acorn.brand.ts
import { cva } from '@/lib/cva';

export const buttonAcornVariants = cva({
  base: [
    // Tokenized colors via semantic utilities
    'pui:bg-primary-6 pui:text-overlay-12',
    // Tokenized shape
    'pui:rounded-full',
    // Tokenized typography
    'pui:leading-[1.335rem] pui:font-bold pui:uppercase'
  ],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    }
  }
});
```

Notice:

- Uses `pui:` prefixed utilities that map to design tokens
- `pui:bg-primary-6` → references `--color-primary-6` token
- `pui:text-overlay-12` → references `--color-overlay-12` token
- `pui:rounded-full` → pill shape (tokenized radius)

#### Brand-specific overrides

Other brands override only what differs. They compose with the base:

```tsx
// src/components/Button/brands/Button.sprig.brand.ts
import { cva } from '@/lib/cva';

export const buttonSprigVariants = cva({
  base: ['pui:text-overlay-1'] // Override: different text color
});
```

```tsx
// src/components/Button/brands/Button.stelpro.brand.ts
import { cva } from '@/lib/cva';

export const buttonStelproVariants = cva({
  base: ['pui:text-overlay-5'] // Override: different text color
});
```

Brand variants only specify **differences from base**. Everything else is inherited.

#### How it achieves visual polymorphism

1. **App initializes brand**: `setActiveBrand('sprig')`
2. **Component renders**: `getBrandVariant(buttonBrandVariants)` returns Sprig's composed variant
3. **Classes applied**: `pui:bg-primary-6 pui:text-overlay-1 pui:rounded-full ...`
4. **CSS resolves tokens**: `pui:bg-primary-6` → `background: var(--color-primary-6)` where `--color-primary-6` is defined per-brand in CSS

The same Button component code renders different visuals per brand:

- **Acorn**: `pui:text-overlay-12` (white text on primary)
- **Sprig**: `pui:text-overlay-1` (dark text on primary)
- **Stelpro**: `pui:text-overlay-5` (different contrast)

#### Why this pattern?

| Benefit                          | Explanation                                               |
| -------------------------------- | --------------------------------------------------------- |
| **Type safety**                  | TypeScript ensures all brands implement required variants |
| **Minimal overrides**            | Brands only specify differences, not entire configs       |
| **Composition over inheritance** | CVA's `compose()` cleanly merges variant definitions      |
| **RSC compatible**               | Module-level state works in React Server Components       |
| **Build-time optimization**      | Tailwind can tree-shake unused brand classes              |

---

## Designer workflow: Figma to code

For tokens to work, designers and developers must share the same token names. Here's the workflow:

### Figma structure with Tokens Studio

Organize tokens in Tokens Studio to match the code architecture:

```
Token Sets:
├── primitives/
│   ├── colors           → color.primitive.blue-500, etc.
│   ├── spacing          → spacing.primitive.4, etc.
│   └── radii            → radius.primitive.md, etc.
├── semantic/
│   ├── colors           → color.background.default, etc.
│   ├── shape            → shape.radius.button, etc.
│   ├── typography       → typography.family.ui, etc.
│   └── elevation        → elevation.shadow.card, etc.
├── themes/
│   ├── minimal          → overrides for minimal theme
│   └── brutalist        → overrides for brutalist theme
└── components/          → optional component-specific tokens
    └── button           → button.primary.background, etc.
```

### Naming rules for designers

When creating tokens in Figma, follow these rules so names match code:

1. Use **dot notation** for hierarchy: `color.background.default` not `color-background-default`
2. Use **lowercase** throughout: `color.interactive.primary` not `Color.Interactive.Primary`
3. Use **hyphens** for multi-word segments: `primary-hover` not `primaryHover`
4. Match the **exact category names** from this guide

### Syncing to code

Tokens Studio syncs to your Git repository. The sync produces JSON files that Style Dictionary transforms into CSS custom properties:

```
Figma (Tokens Studio)
        ↓
    tokens/*.json
        ↓
  Style Dictionary build
        ↓
    CSS custom properties
```

When a designer updates a token value in Figma and pushes to GitHub, CI runs the Style Dictionary build, and the new values become available in the next package release.

---

## Summary: The key principles

1. **Primitives are private.** Raw values named by appearance, never referenced by components.

2. **Semantic tokens are the public API.** Named by purpose, referenced by all components.

3. **Component tokens are optional.** Use them only when a component needs theme-specific behavior that semantic tokens can't express.

4. **Tokenize appearance, hardcode structure.** Colors, radii, shadows, typography, and motion are tokens. Display, position, alignment, and cursor are hardcoded.

5. **Names must match everywhere.** The token name in Figma, the CSS custom property name, and the Tailwind utility name must all correspond predictably.

6. **Themes implement the contract.** A theme provides values for every semantic token. Components consume tokens without knowing which theme is active.

7. **Validate before shipping.** Utilize AI to validate that all required tokens are implemented in each theme.

The result is a component library where the same code renders completely different visual styles simply by swapping which theme CSS is loaded. That's visual polymorphism.
