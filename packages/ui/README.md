# @perimetre/ui

A React component library with composable, brand-aware theming built on Tailwind CSS v4 and Radix UI primitives.

## Features

- **Visual Polymorphism** - Same components render different visual styles per brand
- **Design Token Architecture** - Three-tier token system (primitives, semantic, component) for radical theming
- **RSC Compatible** - Module-level brand registry works in both Server and Client Components
- **CVA Composition** - Brand variants use CVA (Class Variance Authority) with tailwind-merge for conflict resolution
- **Tailwind CSS v4** - Built on the latest Tailwind with custom `pui:` prefix scoping
- **Radix UI Primitives** - Accessible, unstyled primitives as the foundation

## Installation

```bash
pnpm add @perimetre/ui
```

## Quick Start

### 1. Import Brand-Specific Styles

Import **only one** brand CSS file in your app's entry point or layout. Each brand CSS file is self-contained and includes all necessary base styles.

```tsx
// For Acorn brand (default)
import '@perimetre/ui/styles/acorn.css';

// OR for Sprig brand
import '@perimetre/ui/styles/sprig.css';

// OR for Stelpro brand
import '@perimetre/ui/styles/stelpro.css';
```

**Important:**

- Only import ONE brand CSS file. Each file contains only the styles for that specific brand, keeping your bundle size minimal.
- The brand CSS files do NOT include Tailwind's preflight (CSS reset). If your app doesn't already use Tailwind CSS, you should import the optional preflight file first:

```tsx
// Optional: Only if your app doesn't already have Tailwind CSS
import '@perimetre/ui/styles/preflight.css';

// Then import your brand CSS
import '@perimetre/ui/styles/sprig.css';
```

### Alternative: Compile with Your Own Tailwind (Advanced)

If your project uses Tailwind CSS v4 and you want maximum tree-shaking (only include CSS for components you actually use), you can compile the styles yourself instead of using pre-built CSS.

**Step 1:** Import the source CSS for your brand:

```css
/* In your app's main CSS file */
@import 'tailwindcss';

/* Import brand tokens (choose one) */
@import '@perimetre/ui/src/styles/acorn.css';
/* OR @import "@perimetre/ui/src/styles/sprig.css"; */
/* OR @import "@perimetre/ui/src/styles/stelpro.css"; */
```

**Step 2:** Tailwind will automatically scan your app's bundled code and only generate CSS for the `pui:*` classes used by components you import.

**Trade-offs:**

| Approach         | Pros                          | Cons                                         |
| ---------------- | ----------------------------- | -------------------------------------------- |
| Pre-built CSS    | Zero config, works everywhere | Includes all utility classes (~14KB gzipped) |
| Compile yourself | Only includes classes you use | Requires Tailwind v4, longer build times     |

For most projects, the pre-built CSS is recommended. The compile-yourself approach is useful for large apps where every kilobyte matters.

### 2. Initialize Brand at App Startup

Set the active brand at module load time in your root layout. This must be done **before** any components render:

```tsx
// app/layout.tsx (Next.js App Router)
import { setActiveBrand } from '@perimetre/ui';
import '@perimetre/ui/styles/sprig.css';

// Initialize brand at module load time (runs once when this module loads)
setActiveBrand('sprig');

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* data-pui-brand provides CSS scoping */}
        <div data-pui-brand="sprig">{children}</div>
      </body>
    </html>
  );
}
```

**Important:**

- Call `setActiveBrand()` at the top level of your layout module (not inside a component)
- Also set the `data-pui-brand` attribute for CSS scoping
- Both must use the same brand value
- Components will automatically use the correct brand variants via `getBrandVariant()`

## Design Token Architecture

The UI library uses a three-tier token architecture for visual polymorphism. See [Design Token Guide](./docs/design-token-guide.md) for the complete documentation.

### Token Tiers

1. **Primitives** - Raw values (`--pui-primitive-color-primary-6`)
2. **Semantic** - Purpose-based tokens that reference primitives
3. **Component** - Optional component-specific overrides

### CSS Layers

Styles are organized in CSS layers for proper cascade control:

```css
@layer pui.tw.theme, pui.tw.base;
@layer pui.primitives, pui.semantic, pui.theme, pui.components;
```

### Tailwind Integration

The library uses Tailwind v4 with:

- Custom `pui:` prefix for all utilities
- Scoping via `important: '[data-pui-brand]'` in config
- Custom variants for brand-specific styles: `pui:acorn:`, `pui:sprig:`, `pui:stelpro:`

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Commands

```bash
# Start development server (Ladle)
pnpm dev

# Build the library
pnpm build

# Type check
pnpm typecheck
```

### Ladle

The package uses [Ladle](https://ladle.dev/) for component development and documentation. Run `pnpm dev` to browse available components and their variants.

## Exports

The package avoids barrel exports for optimal tree-shaking. Import exactly what you need:

```typescript
// Brand initialization (call at module load time in root layout)
import { setActiveBrand } from '@perimetre/ui';

// Brand utilities (rarely needed - components use these internally)
import { getActiveBrand, getBrandVariant, BRANDS } from '@perimetre/ui';

// Individual components (tree-shakeable - import from specific paths)
import Button from '@perimetre/ui/components/Button';
import { FieldInput } from '@perimetre/ui/components/Field/FieldInput';

// Brand-specific CSS (import only ONE)
import '@perimetre/ui/styles/acorn.css'; // ~14.7KB
import '@perimetre/ui/styles/sprig.css'; // ~15.0KB
import '@perimetre/ui/styles/stelpro.css'; // ~14.8KB

// Optional preflight (CSS reset) - only if your app doesn't have Tailwind CSS
import '@perimetre/ui/styles/preflight.css'; // ~4.8KB
```

### CSS Bundle Sizes (gzipped)

| File      | Size    | Gzipped |
| --------- | ------- | ------- |
| Preflight | 4.8 KB  | 1.3 KB  |
| Acorn     | 14.7 KB | 3.3 KB  |
| Sprig     | 15.0 KB | 3.3 KB  |
| Stelpro   | 14.8 KB | 3.3 KB  |

## Peer Dependencies

- `react` >= 19.0
- `react-dom` >= 19.0

## Related Packages

- `@perimetre/classnames` - Utility combining clsx and tailwind-merge
- `@perimetre/icons` - Accessible React icon wrapper

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding new components and creating brand themes.
