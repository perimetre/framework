---
name: create-ui-component
description: Creates brand-aware React components in the @perimetre/ui library following the canonical Perimetre design system patterns (three-tier tokens, CVA brand variants with compose(), pui: prefix, Acorn-as-base). Use this skill whenever the user asks to create, scaffold, add, or build a new UI component in @perimetre/ui or packages/ui, set up the brands/ subfolder pattern, wire up the Acorn base + brand override files, or ensure a component can be restyled per brand by a designer. Triggers on phrases like "new UI component", "create a component in @perimetre/ui", "scaffold a component", "add a branded component", "make this a pui component", "component with brand variants", "create a component Vuong can restyle", "component using semantic tokens", or "add PaginatedCarousel/Button/Card/etc. to the library".
license: MIT
metadata:
  author: perimetre
  version: '1.0.0'
---

# Create a `@perimetre/ui` Component

Scaffold and implement a new React component in `packages/ui` that inherits the design system's brand-aware styling pipeline: semantic design tokens, `pui:`-prefixed Tailwind utilities, CVA brand variants composed from an Acorn base, and RSC-safe brand resolution via `getBrandVariant`.

The goal is always the same: **every visual decision that might differ between brands or that a designer might want to tweak lives in a token or a CVA brand file, not as a raw value inside the component.**

---

## Step 0 — Read the Canonical Docs First

These files are the source of truth. Read them before designing the component — do not rely on memory of past patterns.

| When you need to…                                              | Read                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| Understand the overall UI contribution workflow                | `packages/ui/CONTRIBUTING.md`                                   |
| Understand the three-tier token architecture (narrative)       | `packages/ui/src/docs/DesignTokens.stories.mdx`                 |
| Check naming conventions (`pui` namespace, hierarchy)          | `packages/ui/src/docs/TokenNamingConventions.stories.mdx`       |
| Check existing semantic token vocabulary                       | `packages/ui/src/brands/tailwind.css` (`@theme inline` block)   |
| Check the current brand list                                   | `packages/ui/src/brands/index.ts`                               |
| Review the CVA wrapper (`cva`, `compose`, twMerge hook)        | `packages/ui/src/lib/cva/index.ts`                              |
| Review the brand registry (`BrandVariants`, `getBrandVariant`) | `packages/ui/src/lib/brand-registry.ts`                         |
| See a simple reference implementation                          | `packages/ui/src/components/Button/` (and its `brands/` folder) |
| See a multi-variant / alertbar-style example                   | `packages/ui/src/components/AlertBar/`                          |
| See a compound-component pattern (Root/Viewport/etc.)          | `packages/ui/src/components/PaginatedCarousel/`                 |
| Add a new semantic token a component needs                     | invoke the `create-tokens` skill                                |

Prefer the files in this repo over anything you recall about design systems in general. If the canonical docs disagree with this skill, the canonical docs win — tell the user and flag it.

---

## The Three Ways to Style (Decision Order)

When implementing a component, every visual property you're tempted to hardcode must first be evaluated against this order:

1. **Reuse an existing semantic token.** `pui:bg-pui-interactive-primary`, `pui:rounded-pui-button`, `pui:typo-heading-3`, etc. If a token already expresses what you need, use it — even if its current value is "wrong" visually, the right fix is usually a brand override, not a new token.
2. **Override a token per brand.** If the value exists semantically but needs to differ for a brand, edit that brand's JSON in `packages/tokens/src/sets/brands/{brand}.json`. No component change required.
3. **Add a CVA brand variant.** If the brand needs a _different class_ (not just a different token value), add the class in `{Component}.{brand}.brand.ts`. This is for cases like "Sprig needs a completely different text-color class" or "Stelpro adds an underline".
4. **Create a new semantic token.** If no existing token fits AND the value is something a designer would want to control (color, radius, shadow, typography, motion), add a token via the `create-tokens` skill. Prefer semantic tokens named by purpose (e.g. `--pui-color-card-bg`) over component-scoped tokens.
5. **Hardcode it.** _Only_ for structural properties (display, position, alignment, cursor, width patterns, overflow). Anything visual / thematic should not land here.

Always prefer the earliest option that works. A reader-test: imagine the designer asks "can you change the card background on Stelpro?" — if the answer requires a code change and not a token change, you've probably under-tokenized.

---

## Framework Mindset

This library is consumed by multiple apps across multiple brands. When implementing, keep asking:

- **How will this be used on other apps/projects?** A component that looks perfect for one app but hardcodes that app's exact spacing is a bug. Spacing/padding/typography that vary across apps should either be tokenized or accept a `className` override.
- **How would the designer control this?** In the ideal state, the designer hands you a Figma with different Button/Card/Carousel looks per brand and you ship it with zero component code changes — only token JSON edits. We are not fully there yet. When you notice a new axis of variation ("oh, the card shadow differs between brands"), that's usually the moment to create a new semantic token.

We don't need 100% semantic token coverage on day one. Add tokens _pragmatically_ as real variation appears — see `tokens-pragmatic-creation` logic in the `create-tokens` skill.

---

## Required File Structure

```
packages/ui/src/components/ComponentName/
├── index.tsx                              # Brand-agnostic component
├── ComponentName.stories.tsx              # Ladle story
└── brands/
    ├── index.ts                           # Brand variants registry (compose)
    ├── ComponentName.acorn.brand.ts       # Base — REQUIRED, has full CVA config
    ├── ComponentName.sprig.brand.ts       # Only if class-structure differs
    ├── ComponentName.stelpro.brand.ts     # Only if class-structure differs
    └── ...other brands as needed          # Same rule: only when classes differ
```

Compound components (multiple sub-components) follow the same structure per sub-component. See `PaginatedCarousel/` for a full example.

The brand list and order come from `packages/ui/src/brands/index.ts` (`BRANDS` const). Check that list before adding brand files — it may include `cima`, `microbird-commercial`, `microbird-school`, etc. Never hardcode a brand list in the skill output; read the current source.

---

## Scaffold — Step by Step

### 1. Acorn base (`ComponentName.acorn.brand.ts`)

Acorn contains **all** structural and default styles. Every other brand composes from this.

```ts
import { cva } from '@/lib/cva';

/**
 * Acorn brand ComponentName variants (default/base theme).
 * Uses semantic tokens for themeable properties:
 * - bg-pui-...: list the semantic tokens used so overrides are discoverable
 * - rounded-pui-...: same
 */
export const componentNameAcornVariants = cva({
  base: [
    // Tokenized appearance (brand-variable)
    'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
    'pui:rounded-pui-button',
    'pui:shadow-pui-button pui:hover:shadow-pui-button-hover',
    'pui:transition-shadow pui:duration-pui-normal',
    // Structural (always the same across brands — hardcoded)
    'pui:inline-flex pui:items-center pui:justify-center pui:gap-2',
    // Typography via semantic utility
    'pui:typo-button'
  ],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5',
      default: 'pui:px-8 pui:py-2.5'
    },
    variant: {
      primary:
        'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
      outline:
        'pui:bg-transparent pui:text-pui-interactive-primary pui:border pui:border-pui-interactive-primary'
    }
  },
  defaultVariants: {
    size: 'default',
    variant: 'primary'
  }
});
```

Notes:

- List the semantic tokens in the JSDoc so the next reader (and any designer looking at the file) can trace overrides fast.
- Every utility uses the `pui:` prefix. No exceptions inside `@perimetre/ui`.
- Typography: prefer semantic typo utilities (`pui:typo-heading-1`, `pui:typo-button`, `pui:typo-label`) over raw `text-*`/`font-*` combinations so brands can retune typography globally.

### 2. Brand override files (only when class-structure differs)

Most brand differences are already handled by CSS tokens. Only create a brand file when the brand needs a **different class string** (e.g. a different text-color token, an added underline, different padding for its small size).

```ts
// ComponentName.sprig.brand.ts
import { cva } from '@/lib/cva';

/**
 * Sprig override — only the overlay-1 text color differs.
 * Everything else is inherited from Acorn via compose().
 */
export const componentNameSprigVariants = cva({
  base: ['pui:text-pui-overlay-1']
});
```

If a brand has _no_ class-level difference, you have two valid options:

- **Omit it from the registry** (it falls back to Acorn). Cleanest.
- **Export an empty `cva({ base: [] })`** and still compose it. Slightly more explicit when you expect the brand to diverge soon.

Avoid duplicating Acorn's base styles in a brand file — `compose()` + twMerge handle merging automatically, and duplication creates subtle drift when Acorn changes.

### 3. Brand registry (`brands/index.ts`)

```ts
import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { componentNameAcornVariants } from './ComponentName.acorn.brand';
import { componentNameSprigVariants } from './ComponentName.sprig.brand';
import { componentNameStelproVariants } from './ComponentName.stelpro.brand';

export const componentNameBrandVariants = {
  acorn: componentNameAcornVariants,
  sprig: compose(componentNameAcornVariants, componentNameSprigVariants),
  stelpro: compose(componentNameAcornVariants, componentNameStelproVariants)
} as const satisfies BrandVariants<typeof componentNameAcornVariants>;

export type ComponentNameVariantProps = VariantProps<
  typeof componentNameAcornVariants
>;
```

Rules:

- `acorn` is **never** composed with itself — it is the base.
- `compose(acornVariants, brandVariants)` — Acorn first, brand second (so brand wins conflicts via twMerge).
- `satisfies BrandVariants<T>` makes Acorn required and other brand keys optional/type-checked.
- Extract `VariantProps` from the Acorn base (it's the one that defines all possible variants).

### 4. The component (`index.tsx`)

```tsx
import { getBrandVariant } from '@/lib/brand-registry';
import { Slot } from 'radix-ui';
import type { PropsWithChildren } from 'react';
import {
  componentNameBrandVariants,
  type ComponentNameVariantProps
} from './brands';

export type ComponentNameProps = {
  asChild?: boolean;
} & ComponentNameVariantProps &
  React.ComponentProps<'button'>;

/**
 * ComponentName — short description of its purpose.
 *
 * Automatically uses the correct brand variant based on the active brand
 * set via setActiveBrand() or defaults to 'acorn'.
 *
 * @example
 * <ComponentName variant="primary" size="default">Label</ComponentName>
 */
const ComponentName: React.FC<PropsWithChildren<ComponentNameProps>> = ({
  asChild,
  children,
  className,
  size,
  variant,
  ...props
}) => {
  const Comp = asChild ? Slot.Slot : 'button';
  const variants = getBrandVariant(componentNameBrandVariants);

  return (
    <Comp className={variants({ size, variant, className })} {...props}>
      {children}
    </Comp>
  );
};

export default ComponentName;
```

Key rules:

- The component is **brand-agnostic**. No `if (brand === 'sprig')`, no `useContext`, no prop-drilled brand.
- Props extend both the CVA `VariantProps` and the underlying HTML element's native props (`React.ComponentProps<'button' | 'div' | ...>`).
- `className` is passed **into** the CVA call (not concatenated separately) — twMerge inside CVA resolves consumer overrides correctly.
- Add a JSDoc block. ESLint on this repo requires JSDoc on exported component functions.
- For form inputs, use `React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>`.
- `asChild` + Radix `Slot` is the standard way to let consumers swap the wrapper element; include it when it makes sense (e.g. buttons that sometimes act as links).

### 5. Ladle story (`ComponentName.stories.tsx`)

Minimal story pattern (mirror what exists in `Button/Button.stories.tsx`). At minimum:

- A `Default` story binding.
- One story per variant, and one per size if sizes exist.
- An `AllVariants` composition story for visual review across brands.

Ladle is where designers review components across brands. If the component only looks right on one brand, the brand-agnostic pattern isn't being followed — check that no raw colors/values leaked into the Acorn file.

---

## Structural vs Thematic — the Cut Line

Use this quick reference. When in doubt, ask: "Would a designer want to change this in Figma?" Yes → token. No → hardcode.

| Tokenize (thematic)                                              | Hardcode (structural)                              |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Background/text/border colors (`pui:bg-pui-*`, `pui:text-pui-*`) | `pui:inline-flex`, `pui:grid`, `pui:block`         |
| Border radius (`pui:rounded-pui-*`)                              | `pui:items-center`, `pui:justify-center`           |
| Shadows (`pui:shadow-pui-*`)                                     | `pui:cursor-pointer`, `pui:pointer-events-none`    |
| Typography utilities (`pui:typo-*`)                              | `pui:relative`, `pui:absolute`, z-index            |
| Motion durations (`pui:duration-pui-normal`)                     | `pui:w-full`, `pui:overflow-hidden`                |
| Letter spacing / text transforms when brand-specific             | Tailwind arbitrary values for single-use specifics |

Spacing is the grey zone: standard Tailwind scale values (`pui:px-8`, `pui:py-2.5`) are fine as-is. Only tokenize spacing if the _same semantic spacing_ must be consistent across 3+ components AND varies between brands.

---

## Accessibility Baseline

- Keyboard-reachable: every interactive element must be tabbable.
- Focus-visible: use `pui:focus-visible:shadow-pui-input-focus` (or the relevant focus token) instead of relying on default browser outlines when styled.
- Form fields: support `aria-invalid` and `aria-describedby` for error associations.
- Complex interactions (menus, dialogs, tabs, disclosures): use Radix primitives (`radix-ui`) rather than hand-rolling, and pass `data-pui-brand`-scoped styles through their slots.
- Never strip native `role` / label semantics without replacing them.

---

## Review Checklist (self-check before finishing)

- [ ] Component uses `getBrandVariant()` — no hardcoded brand logic
- [ ] All Tailwind utilities inside `@perimetre/ui` use the `pui:` prefix
- [ ] All color / radius / shadow / motion values reference semantic tokens (not primitives, not raw hex)
- [ ] Brand files only contain **differences** from Acorn — no base-style duplication
- [ ] `brands/index.ts` uses `as const satisfies BrandVariants<typeof acornVariants>`
- [ ] `acorn` is never composed with itself
- [ ] JSDoc block is present on exported component(s)
- [ ] Props extend the native HTML element's props (`React.ComponentProps<'button'>` etc.)
- [ ] `className` flows through the CVA call so consumer overrides win via twMerge
- [ ] Focus-visible state exists for interactive elements
- [ ] Component renders correctly across all brands in Ladle
- [ ] If a new semantic token was needed, it was added via the `create-tokens` skill and bridged in `packages/ui/src/brands/tailwind.css`
- [ ] If new tokens were added, the user ran `pnpm build` in `packages/tokens` and both JSON + generated CSS were committed

---

## Common Mistakes

| Mistake                                                 | Fix                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Using a raw color (`bg-[#69c14c]`, `bg-blue-500`)       | Use `pui:bg-pui-*` semantic token or add one via `create-tokens`                  |
| Missing `pui:` prefix                                   | Every utility in the library requires it — consumer apps don't                    |
| Referencing a primitive directly in a component         | Components read semantic tokens only; primitives are plumbing                     |
| Duplicating Acorn styles in a brand override file       | `compose()` handles merging — override only what differs                          |
| Creating a brand file when only token values differ     | CSS tokens resolve automatically — no CVA file needed                             |
| Using React Context for the active brand                | Use the module-level `brand-registry.ts`; it is RSC-safe                          |
| Forgetting to extend `React.ComponentProps<'elem'>`     | Consumers need native attributes (`onClick`, `id`, `aria-*`, etc.)                |
| Hardcoding brand list in component                      | Always read `BRANDS` from `packages/ui/src/brands/index.ts`                       |
| Creating a semantic token for a one-off value           | Use a Tailwind arbitrary value instead — tokens are for repeated value            |
| Adding token CSS directly into `ui/brands/tailwind.css` | Token _values_ live in `packages/tokens` JSON; `tailwind.css` only has the bridge |

---

## Related Skills

- `create-tokens` — for adding the semantic / primitive / brand / synthetic tokens a new component needs before or during scaffolding.
