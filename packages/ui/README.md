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

### 1. Set Up Styles

Import the UI styles in your app's entry point or layout:

```css
/* In your global CSS file */
@import '@perimetre/ui/styles';
```

Or import directly in your layout component:

```tsx
import '@perimetre/ui/styles';
```

### 2. Wrap Components with Brand Scope

Components must be rendered within an element that has the `data-pui-brand` attribute:

```tsx
import Button from '@perimetre/ui/components/Button';

function App() {
  return (
    <div data-pui-brand="acorn">
      <Button size="default">Click me</Button>
    </div>
  );
}
```

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

```typescript
// Main entry - includes CSS
import '@perimetre/ui';

// Individual components
import Button from '@perimetre/ui/components/Button';

// Styles only
import '@perimetre/ui/styles';
```

## Peer Dependencies

- `react` >= 19.0
- `react-dom` >= 19.0

## Related Packages

- `@perimetre/classnames` - Utility combining clsx and tailwind-merge
- `@perimetre/icons` - Accessible React icon wrapper

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding new components and creating brand themes.
