# @perimetre/tokens

Design tokens for the Perimetre design system. Contains the single source of truth as W3C DTCG JSON token sets, plus a build pipeline that generates CSS custom properties.

## Architecture

```
Code is the source of truth. The flow is one-directional: JSON → CSS.

Devs create/modify tokens in JSON → build script generates CSS →
Tokens Studio syncs JSON for designers to view/tweak values →
designer changes come back as a PR → dev reviews → CI regenerates CSS.
```

### Package Structure

```
packages/tokens/
├── src/
│   ├── sets/                        ← Source of truth (W3C DTCG JSON)
│   │   ├── primitives/
│   │   │   ├── colors.json          ← Primary, overlay, red, green, amber, blue scales
│   │   │   ├── typography.json      ← Font families, sizes, weights, leading
│   │   │   ├── shape.json           ← Border radius values
│   │   │   ├── shadow.json          ← Box shadow values
│   │   │   └── motion.json          ← Duration values
│   │   ├── semantic/
│   │   │   └── base.json            ← All semantic tokens (acorn defaults)
│   │   ├── brands/
│   │   │   ├── sprig.json           ← Only overrides from acorn base
│   │   │   ├── stelpro.json         ← Only overrides from acorn base
│   │   │   └── cima.json            ← Only overrides from acorn base
│   │   └── $themes.json             ← Tokens Studio theme composition config
│   └── scripts/
│       └── build.ts                 ← JSON → CSS (Style Dictionary v5)
├── dist/                             ← Generated CSS (committed to git)
│   └── brands/
│       ├── acorn.css                ← Full primitives + semantics
│       ├── sprig.css                ← Brand overrides only
│       ├── stelpro.css              ← Brand overrides only
│       └── cima.css                 ← Brand overrides only
└── package.json
```

## Token Format

Tokens use the [W3C Design Token Community Group (DTCG)](https://tr.designtokens.org/format/) JSON format, compatible with [Tokens Studio](https://docs.tokens.studio/):

```json
{
  "pui": {
    "primitive": {
      "color": {
        "primary": {
          "9": {
            "$value": "hsl(172, 96%, 53%)",
            "$type": "color",
            "$description": "Hero/accent color"
          }
        }
      }
    }
  }
}
```

Semantic tokens reference primitives using `{dot.path}` syntax:

```json
{
  "pui": {
    "color": {
      "interactive": {
        "primary": {
          "$value": "{pui.primitive.color.primary.9}",
          "$type": "color"
        }
      }
    }
  }
}
```

## Generated CSS

The build script produces CSS with `@layer` blocks scoped to `[data-pui-brand]` selectors:

**`acorn.css`** — Base theme (all tokens):

```css
@layer pui.primitive {
  [data-pui-brand] {
    --pui-primitive-color-primary-9: hsl(172, 96%, 53%);
    /* ... all primitives */
  }
}

@layer pui.semantic {
  [data-pui-brand] {
    --pui-color-interactive-primary: var(--pui-primitive-color-primary-9);
    /* ... all semantics with var() references */
  }
}
```

**`sprig.css`** — Brand overrides only:

```css
@layer pui.primitive {
  [data-pui-brand='sprig'] {
    --pui-primitive-color-primary-9: #69c14c;
    /* ... only what differs from acorn */
  }
}
```

## Usage

### In `@perimetre/ui` (internal)

The UI package imports token CSS via the workspace dependency:

```css
/* packages/ui/src/styles/sprig.css */
@import './base.css';
@import '@perimetre/tokens/brands/acorn.css';
@import '@perimetre/tokens/brands/sprig.css';
```

### In consumer apps (via Tailwind integration)

Consumer apps can import token CSS directly for their own Tailwind JIT build:

```css
/* globals.css */
@import 'tailwindcss';
@import '@perimetre/tokens/brands/acorn.css';
@import '@perimetre/tokens/brands/sprig.css';
@import '@perimetre/ui/tailwind';
```

This gives consumer apps minimal CSS — Tailwind JIT only generates utilities actually used.

### Raw JSON access

Token sets are also exported for tooling (Tokens Studio sync, custom transforms):

```ts
import tokens from '@perimetre/tokens/sets/primitives/colors.json';
```

## Exports

| Import path                            | Contents                                      |
| -------------------------------------- | --------------------------------------------- |
| `@perimetre/tokens/brands/acorn.css`   | Full acorn token CSS (primitives + semantics) |
| `@perimetre/tokens/brands/sprig.css`   | Sprig override CSS                            |
| `@perimetre/tokens/brands/stelpro.css` | Stelpro override CSS                          |
| `@perimetre/tokens/brands/cima.css`    | Cima override CSS                             |
| `@perimetre/tokens/sets/*`             | Raw JSON token sets                           |

## Build

```bash
pnpm build    # Runs: tsx src/scripts/build.ts
```

This reads JSON from `src/sets/` and generates CSS into `dist/brands/`. The generated CSS is committed to git so consumers don't need to run the build.

## Tokens Studio Integration

The `src/sets/` directory is designed for [Tokens Studio](https://tokens.studio/) Git sync:

- `$themes.json` defines theme composition (which token sets are active per brand)
- Token sets use "source" (primitives — resolved but not exported) and "enabled" (semantics/brands — active)
- Designers can update token values via Tokens Studio, which creates a PR with JSON changes
- After review and merge, CI regenerates the CSS files

### Theme Composition

Each brand theme composes multiple token sets:

| Theme   | Primitives | Semantic Base | Brand Override |
| ------- | ---------- | ------------- | -------------- |
| Acorn   | source     | enabled       | —              |
| Sprig   | source     | enabled       | enabled        |
| Stelpro | source     | enabled       | enabled        |
| Cima    | source     | enabled       | enabled        |

## Adding a New Brand

1. Create `src/sets/brands/newbrand.json` with only tokens that differ from acorn
2. Add the brand to `src/sets/$themes.json`
3. Add the brand to the `BRANDS` array in `src/scripts/build.ts`
4. Run `pnpm build` — generates `dist/brands/newbrand.css` with only overrides
5. Commit both the JSON and generated CSS
6. Wire up in `@perimetre/ui` (register brand, create CSS entry, update Ladle)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full step-by-step guide with examples.

## Build Pipeline

The build uses [Style Dictionary v5](https://styledictionary.com/) with [@tokens-studio/sd-transforms](https://github.com/tokens-studio/sd-transforms):

1. For each brand, loads the relevant JSON token sets
2. Generates CSS with a custom `dist/pui-brand` format that:
   - Separates tokens into `@layer pui.primitive` and `@layer pui.semantic`
   - Scopes declarations to `[data-pui-brand]` or `[data-pui-brand='name']`
   - Preserves original values (HSL, `var()` references) from JSON
   - For brand overrides, only outputs tokens from the brand file (not the full merged set)

## Related Packages

- `@perimetre/ui` — React component library that consumes these tokens
