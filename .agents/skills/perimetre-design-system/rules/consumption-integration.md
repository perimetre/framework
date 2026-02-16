---
title: RSC Compatibility, Bundle Optimization, and Integration Patterns
impact: MEDIUM
impactDescription: ensures correct consumption in Next.js and other React frameworks
tags: rsc, bundle, imports, css, initialization, next.js, tree-shaking, lazy-loading
---

## RSC Compatibility, Bundle Optimization, and Integration Patterns

`@perimetre/ui` is designed to work with React Server Components, optimize bundle size through tree-shaking, and integrate cleanly with consumer projects.

### Brand Initialization in Next.js App Router

Brand must be initialized at two levels for RSC compatibility:

```tsx
// app/layout.tsx (Server Component)
import { setActiveBrand } from '@perimetre/ui';
import '@perimetre/ui/styles/sprig.css';

// Server-side initialization
setActiveBrand('sprig');

export default function RootLayout({ children }) {
  return (
    <html>
      <body data-pui-brand="sprig">
        <BrandInitializer />
        {children}
      </body>
    </html>
  );
}
```

```tsx
// components/BrandInitializer.tsx
'use client';
import { setActiveBrand } from '@perimetre/ui';

// Client-side initialization (for client components)
setActiveBrand('sprig');

export default function BrandInitializer() {
  return null;
}
```

**Why both?** The brand registry uses module-level state. In RSC, server and client modules have separate state. `setActiveBrand()` must be called in both contexts.

**The `data-pui-brand` attribute** is required on the root element. All CSS tokens are scoped to `[data-pui-brand]`, so without this attribute, no styles apply.

### Why Module-Level State Instead of Context

```typescript
// src/lib/brand-registry.ts
let activeBrand: Brand = DEFAULT_BRAND;

export function setActiveBrand(brand?: Brand): Brand {
  activeBrand = isValidBrand(brand) ? brand : DEFAULT_BRAND;
  return activeBrand;
}

export function getActiveBrand(): Brand {
  return activeBrand;
}
```

**React Context doesn't work for this because:**

1. Context requires a Provider component wrapping the tree
2. Providers are Client Components (`'use client'`)
3. Server Components can't consume Context
4. Module-level state works identically in both Server and Client Components

### Import Patterns for Tree-Shaking

**Per-component imports (RECOMMENDED for consumers):**

```tsx
import Button from '@perimetre/ui/components/Button';
import FieldInput from '@perimetre/ui/components/Field/FieldInput';
import Badge from '@perimetre/ui/components/Badge';
```

This ensures only the imported component's code is bundled.

**Root import (convenient, but can pull more than needed depending on consumer bundler):**

```tsx
import { Button, Badge, FieldInput } from '@perimetre/ui';
```

Prefer per-component imports for predictable bundle size.

### CSS Import (One Per App)

Import exactly ONE brand CSS file per application:

```tsx
// For Sprig brand
import '@perimetre/ui/styles/sprig.css';

// For Acorn brand
import '@perimetre/ui/styles/acorn.css';

// Optional: preflight CSS reset
import '@perimetre/ui/styles/preflight.css';
```

**Do NOT import multiple brand CSS files.** Each brand file includes its own copy of Tailwind utilities.

### Build Output Structure

```
dist/
├── es/                    # ES modules (tree-shakeable)
│   ├── index.js           # Barrel export
│   ├── components/
│   │   ├── Button.js
│   │   ├── Badge.js
│   │   └── Field/
│   │       ├── FieldInput.js
│   │       └── ...
│   ├── lib/
│   │   ├── brand-registry.js
│   │   └── cva/index.js
│   └── brands/index.js
├── cjs/                   # CommonJS (legacy)
│   └── (same structure)
├── styles/                # CSS files
│   ├── acorn.css
│   ├── sprig.css
│   ├── stelpro.css
│   └── preflight.css
└── *.d.ts                 # TypeScript declarations
```

### Package Exports Configuration

```json
{
  "exports": {
    ".": {
      "import": "./dist/es/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/index.d.ts"
    },
    "./*": {
      "import": "./dist/es/*.js",
      "require": "./dist/cjs/*.js",
      "types": ["./dist/*.d.ts", "./dist/*/index.d.ts"]
    },
    "./styles/*.css": "./dist/styles/*.css"
  }
}
```

### Peer Dependencies

Consumers must have these installed:

```json
{
  "react": ">= 19.0",
  "react-dom": ">= 19.0",
  "motion": "^12.0.0"
}
```

React and react-dom are externalized from the build. Motion is a peer dependency for components that use animated features (for example, Drawer).

### Lazy Loading Components

For heavy components (like ImageCarousel with Embla), consumers can lazy-load:

```tsx
import dynamic from 'next/dynamic';

const ImageCarousel = dynamic(
  () => import('@perimetre/ui/components/ImageCarousel'),
  { ssr: false }
);
```

### Tailwind Integration in Consumer Projects

If the consumer uses Tailwind CSS, `@perimetre/ui`'s styles don't conflict because:

1. All utilities use the `pui:` prefix
2. All tokens use the `--pui-` namespace
3. All styles are scoped to `[data-pui-brand]`

The consumer's Tailwind classes and the library's `pui:` classes coexist without conflicts.

### Common Integration Mistakes

**Missing `data-pui-brand` attribute:**

```tsx
// WRONG: No data attribute, no styles apply
<body>
  <Button>Click me</Button> {/* Unstyled! */}
</body>

// RIGHT: Brand attribute enables token scoping
<body data-pui-brand="sprig">
  <Button>Click me</Button> {/* Styled correctly */}
</body>
```

**Calling setActiveBrand() only on client:**

```tsx
// WRONG: Server Components won't have the brand set
'use client';
setActiveBrand('sprig'); // Only affects client modules

// RIGHT: Call in both server and client contexts
// Server: in layout.tsx (before rendering)
// Client: in BrandInitializer.tsx
```

**Importing multiple brand CSS files:**

```tsx
// WRONG: Conflicting styles, bloated bundle
import '@perimetre/ui/styles/acorn.css';
import '@perimetre/ui/styles/sprig.css';

// RIGHT: One brand CSS per app
import '@perimetre/ui/styles/sprig.css';
```

**Using consumer Tailwind classes to override pui: styles:**

```tsx
// WRONG: unscoped consumer utility may not override library tokenized styles as expected
<Button className="bg-blue-500">Click me</Button>

// RIGHT: use pui-prefixed overrides or update brand tokens
<Button className="pui:shadow-none">Click me</Button>
```
