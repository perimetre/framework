# Building radically themeable React component libraries in 2025

**The core architectural insight for radical theming is this**: separate component structure (the DOM) from visual expression (the theme) through a well-designed semantic token contract. Components consume tokens, themes implement them. This patternâ€”used by DaisyUI, Radix Themes, and emerging in Tailwind v4â€”enables completely different visual styles without duplicating component code.

Tailwind v4's CSS-first architecture with the `@theme inline` directive now makes this pattern native to Tailwind. Combined with data-attribute theme switching, CSS layers for specificity control, and a three-tier token architecture, you can build a component library where the same `<Button className="bg-primary rounded-button">` renders as a sleek pill-shaped button in one theme and a sharp brutalist block in another.

## Tailwind v4 transforms theming architecture

Tailwind v4 represents a fundamental shift from JavaScript configuration to CSS-first configuration, making radical theming significantly more elegant than v3. The **`@theme` directive** defines CSS custom properties that automatically generate utility classes:

```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(0.65 0.15 250);
  --radius-button: 0.375rem;
  --font-heading: 'Inter', sans-serif;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

This generates `bg-primary`, `rounded-button`, `font-heading`, and `shadow-card` utilities automatically. The critical enabler for runtime theming is **`@theme inline`**, which tells Tailwind to embed the variable _value_ rather than referencing the theme variableâ€”allowing CSS cascade to work correctly when themes swap values at runtime.

```css
@import 'tailwindcss';

@theme inline {
  --color-primary: var(--primary);
  --color-surface: var(--surface);
  --radius-button: var(--btn-radius);
  --shadow-card: var(--card-shadow);
}

/* Modern theme */
[data-theme='modern'] {
  --primary: oklch(0.55 0.2 250);
  --surface: #ffffff;
  --btn-radius: 0.375rem;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Brutalist theme */
[data-theme='brutalist'] {
  --primary: #ff0000;
  --surface: #f0f0f0;
  --btn-radius: 0;
  --card-shadow: 4px 4px 0 #000;
}
```

The same markupâ€”`<button class="bg-primary rounded-button shadow-card">`â€”produces fundamentally different visuals. Custom variants extend this to theme-aware responsive behavior:

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
@custom-variant ocean (&:where([data-theme=ocean], [data-theme=ocean] *));
```

## Design tokens require a three-tier architecture

The industry consensus from Adobe Spectrum, GitHub Primer, and Shopify Polaris establishes a **primitive â†’ semantic â†’ component** token hierarchy. Primitives are raw values never directly consumed. Semantic tokens express purpose. Component tokens are optional overrides for specific elements:

| Tier          | Example                                         | Theme Behavior    |
| ------------- | ----------------------------------------------- | ----------------- |
| **Primitive** | `--blue-500: #0066cc`                           | Never changes     |
| **Semantic**  | `--color-interactive-primary: var(--blue-500)`  | Themes swap this  |
| **Component** | `--button-bg: var(--color-interactive-primary)` | Optional override |

Components should consume semantic tokens exclusively. This prevents the **NÃ—M explosion** problem: with N themes and M components, naive approaches require NÃ—M style definitions. The semantic layer reduces this to N theme definitions that all M components automatically inherit.

**Token categories for radical theming** must extend beyond colors:

```json
{
  "color": { "background": {}, "text": {}, "border": {}, "interactive": {} },
  "spacing": { "inset": {}, "stack": {}, "inline": {} },
  "border": {
    "radius": { "none": "0", "sm": "4px", "pill": "9999px" },
    "width": {}
  },
  "shadow": { "none": "none", "low": {}, "medium": {}, "high": {} },
  "typography": {
    "family": { "sans": [], "mono": [] },
    "size": {},
    "weight": {}
  },
  "motion": {
    "duration": { "instant": "0ms", "standard": "200ms" },
    "easing": {}
  }
}
```

A brutalist theme sets `border.radius.*` to `"0"`, `shadow.*` to `"none"`, and `motion.duration.*` to `"0ms"`. A soft theme uses large radii, subtle shadows, and gentle easing. Same tokens, radically different output.

## shadcn/ui model vs npm distribution involves real trade-offs

The shadcn/ui "copy code into your project" approach offers full customization controlâ€”you own the component source and can modify anything. However, **bug fixes don't propagate automatically**. When shadcn/ui patches an accessibility issue, you must manually update your local copy or miss the fix entirely.

For **multi-client scenarios**, this model creates version fragmentation: Client A has Button v1.2, Client B has Button v1.5 with local modifications, and reconciling bug fixes across both becomes manual toil. If your team maintains all themes and clients, the traditional npm package modelâ€”`@mylib/core`, `@mylib/theme-minimal`â€”provides centralized bug fixes and version consistency.

**Recommended hybrid**: publish npm packages for core components and themes, but expose internal component code through a CLI or documentation for cases requiring deep customization. Radix follows this patternâ€”Radix Primitives (npm packages) provide behavior, while Radix Themes demonstrates styled usage that teams can adapt.

## CSS-in-JS alternatives excel at type-safe token contracts

**Panda CSS** (from the Chakra team) offers the best developer experience for radical theming among CSS-in-JS options. Its native multi-theme support uses semantic tokens with condition-based values:

```typescript
// panda.config.ts
semanticTokens: {
  colors: {
    text: {
      value: {
        _pinkTheme: { base: '{colors.pink.500}', _dark: '{colors.pink.300}' },
        _blueTheme: { base: '{colors.blue.500}', _dark: '{colors.blue.300}' }
      }
    }
  }
}
```

**vanilla-extract** provides superior theme code-splitting via `createThemeContract`â€”themes can be lazy-loaded, reducing initial bundle size for apps with many themes. However, maintenance concerns exist: the project shows signs of reduced activity with many unresolved issues.

**StyleX** (Meta) delivers the most efficient CSS output through atomic deduplicationâ€”Facebook's CSS went from "tens of megabytes" to ~170KB. It's ideal for enterprise scale but has a steeper learning curve and more constrained API.

| Factor            | Panda CSS              | vanilla-extract      | StyleX          | Tailwind v4        |
| ----------------- | ---------------------- | -------------------- | --------------- | ------------------ |
| Radical theming   | âœ… Native multi-theme | âœ… Contract pattern | âœ… createTheme | âœ… @theme inline  |
| Type safety       | âœ… Full               | âœ… Full             | âœ… Full        | âš ï¸ Plugin-based |
| Bundle efficiency | JIT                    | Build-time           | Atomic (best)   | JIT                |
| Framework support | Excellent              | Excellent            | Good            | Excellent          |

Given your Tailwind preference, **Tailwind v4 with `@theme inline`** is the right choice. It provides native theming that rivals CSS-in-JS solutions while maintaining the Tailwind developer experience.

## Monorepo structure should separate themes into distinct packages

The recommended package structure treats each theme as an independent, versioned package:

```
packages/
â”œâ”€â”€ core/              # @mylib/core - Components (no styles)
â”œâ”€â”€ theme-base/        # @mylib/theme-base - Token definitions + base CSS
â”œâ”€â”€ theme-minimal/     # @mylib/theme-minimal - Minimal aesthetic
â”œâ”€â”€ theme-bold/        # @mylib/theme-bold - High-contrast, chunky
â””â”€â”€ tailwind-preset/   # @mylib/tailwind-preset - Tailwind config preset
```

**Theme injection pattern for external consumers**:

```tsx
// Consumer's layout.tsx (Next.js App Router)
import '@mylib/core/styles.css';
import '@mylib/theme-minimal/theme.css';

export default function RootLayout({ children }) {
  return (
    <html data-theme="minimal">
      <body>{children}</body>
    </html>
  );
}
```

**CSS layers prevent specificity conflicts**. Library CSS uses named layers; consumer CSS without layers automatically wins:

```css
/* @mylib/core/styles.css */
@layer mylib.reset, mylib.base, mylib.components, mylib.utilities;

@layer mylib.components {
  .mylib-button {
    background: var(--mylib-color-primary);
    padding: var(--mylib-spacing-sm) var(--mylib-spacing-md);
  }
}
```

Consumers can override without `!important`:

```css
/* Consumer's styles - no layer, wins automatically */
.mylib-button {
  background: purple;
}
```

For **React Server Components compatibility**, mark interactive components with `'use client'` but keep presentational components server-safe. Avoid CSS-in-JS requiring runtime context (styled-components, Emotion without extraction) for RSC; CSS Variables work perfectly with SSR and RSC.

## Theme switching should use data attributes over classes

The consensus pattern across DaisyUI, Radix Themes, and Park UI is **data-attribute theme switching**:

```html
<html data-theme="dark" data-color-mode="vibrant">
```

**Advantages over class-based (`.theme-dark`)**:

- More semanticâ€”themes are data, not styles
- Enables nested themes: `<section data-theme="light">` inside dark parent
- Works with CSS attribute selectors for fine-grained control
- Aligns with system preference patterns (`prefers-color-scheme`)

**JavaScript implementation with persistence**:

```javascript
function setTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme-preference', theme);
}

// React with system preference sync
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => setTheme('system'));
```

## Avoiding NÃ—M maintenance requires component contracts

The **component contract pattern** defines which CSS custom properties each component consumes. Components set themeable properties via variables; themes implement those variables:

```css
/* Component contract */
.button {
  background-color: var(--button-background);
  color: var(--button-text);
  border-radius: var(--button-radius);
  padding: var(--button-padding-y) var(--button-padding-x);

  /* Hardcoded: structural properties */
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

/* Theme implements contract */
[data-theme='modern'] {
  --button-background: var(--semantic-interactive-primary);
  --button-radius: var(--border-radius-md);
  --button-padding-y: var(--spacing-200);
}

[data-theme='brutalist'] {
  --button-background: var(--semantic-interactive-primary);
  --button-radius: 0;
  --button-padding-y: var(--spacing-400);
}
```

**What to make themeable vs. hardcode**:

| Themeable                   | Hardcoded                       |
| --------------------------- | ------------------------------- |
| Colors, spacing, typography | `display`, `position` structure |
| Border radius, width        | Flexbox/Grid alignment          |
| Shadows, opacity            | `cursor`, `pointer-events`      |
| Transitions, animations     | `box-sizing`, `overflow`        |

## Visual regression testing requires multi-theme automation

**Chromatic** (from Storybook) provides the best experience for component library testing. Configure theme modes to automatically capture screenshots across all themes:

```javascript
// .storybook/preview.js
export const parameters = {
  chromatic: {
    modes: {
      light: { theme: 'light' },
      dark: { theme: 'dark' },
      brutalist: { theme: 'brutalist' }
    }
  }
};

export const decorators = [
  (Story, context) => (
    <div data-theme={context.globals.theme}>
      <Story />
    </div>
  )
];
```

**Token completeness validation** ensures every theme implements required tokens:

```javascript
const requiredTokens = [
  'color.bg.surface',
  'color.text.primary',
  'border.radius.medium',
  'shadow.elevation.low'
];

themes.forEach((theme) => {
  test(`${theme.name} has all required tokens`, () => {
    requiredTokens.forEach((path) => {
      expect(getToken(theme, path)).toBeDefined();
    });
  });
});
```

## Complete implementation architecture

**Package structure**:

```
@mylib/core           # Components + base CSS (no theme values)
@mylib/tokens         # Design token definitions (JSON/W3C DTCG)
@mylib/theme-*        # Theme CSS implementing token values
@mylib/tailwind-preset # Tailwind v4 preset with @theme directive
```

**Core CSS with Tailwind v4**:

```css
/* @mylib/core/styles.css */
@import 'tailwindcss';
@layer mylib.reset, mylib.tokens, mylib.components;

@theme inline {
  --color-primary: var(--mylib-primary);
  --color-surface: var(--mylib-surface);
  --color-text: var(--mylib-text);
  --radius-button: var(--mylib-btn-radius);
  --shadow-card: var(--mylib-card-shadow);
  --font-body: var(--mylib-font-body);
}

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

**Theme package**:

```css
/* @mylib/theme-minimal/theme.css */
@layer mylib.tokens {
  [data-theme='minimal'],
  :root {
    --mylib-primary: oklch(0.55 0.15 250);
    --mylib-surface: #ffffff;
    --mylib-text: #1a1a1a;
    --mylib-btn-radius: 0.25rem;
    --mylib-card-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    --mylib-font-body: 'Inter', sans-serif;
  }
}
```

**Consumer integration**:

```tsx
// app/layout.tsx
import '@mylib/core/styles.css';
import '@mylib/theme-minimal/theme.css';

export default function Layout({ children }) {
  return (
    <html data-theme="minimal">
      <body className="bg-surface text-text font-body">{children}</body>
    </html>
  );
}
```

**Component example using contract pattern**:

```tsx
// Button uses only semantic utilities
export function Button({ children, variant = 'primary' }) {
  return (
    <button className="bg-primary text-primary-foreground rounded-button font-body shadow-card px-4 py-2 transition-opacity hover:opacity-90">
      {children}
    </button>
  );
}
```

This architecture delivers **radical theming** (brutalist, minimal, playful themes using identical component code), **framework compatibility** (Next.js, Remix, Astro), **maintainability** (N themes, not NÃ—M combinations), and **developer experience** (Tailwind utilities with type-safe token contracts).
