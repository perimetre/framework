# Contributing to @perimetre/tokens

This guide covers how to work with design tokens in the Perimetre design system.

## Source of Truth

**Code is the source of truth.** The flow is one-directional:

```
JSON (dev creates/modifies) → build → CSS (generated, committed)
                ↕
    Tokens Studio (Figma sync for designers to view/tweak values)
                ↓
           PR with JSON changes → dev reviews → merge → CI regenerates CSS
```

- Developers create new tokens and modify token structure
- Designers only update token values via Tokens Studio Git sync
- The build script generates CSS from JSON — never edit CSS files directly

## Adding a New Token

### 1. Determine the token tier

| Tier          | When to use                                         | Naming                            | Example                         |
| ------------- | --------------------------------------------------- | --------------------------------- | ------------------------------- |
| **Primitive** | Raw design values (color scales, font sizes, radii) | `pui.primitive.{category}.{name}` | `pui.primitive.color.primary.9` |
| **Semantic**  | Purpose-based tokens that reference primitives      | `pui.{category}.{purpose}`        | `pui.color.interactive.primary` |

Decision guide:

- Does the value change between brands? → Semantic token
- Is it a raw scale value (color step, font size, radius)? → Primitive token
- Is it used in 3+ components with the same meaning? → Semantic token
- Is it a one-off value? → Don't create a token, hardcode it

### 2. Add to the appropriate JSON file

**Primitive tokens** go in `src/sets/primitives/{category}.json`:

```json
// src/sets/primitives/colors.json
{
  "pui": {
    "primitive": {
      "color": {
        "purple": {
          "9": {
            "$value": "#7c3aed",
            "$type": "color"
          }
        }
      }
    }
  }
}
```

**Semantic tokens** go in `src/sets/semantic/base.json`:

```json
// src/sets/semantic/base.json
{
  "pui": {
    "color": {
      "accent": {
        "$value": "{pui.primitive.color.purple.9}",
        "$type": "color"
      }
    }
  }
}
```

### 3. Add brand overrides (if needed)

If the token value differs for a brand, add it to `src/sets/brands/{brand}.json`:

```json
// src/sets/brands/sprig.json
{
  "pui": {
    "color": {
      "accent": {
        "$value": "{pui.primitive.color.primary.9}",
        "$type": "color"
      }
    }
  }
}
```

Only add tokens that **differ** from the acorn base. Brands inherit everything else.

### 4. Add the Tailwind bridge (if needed)

If the new token should be usable as a Tailwind utility (e.g., `bg-pui-accent`, `text-pui-accent`), add it to the `@theme inline` block in `packages/ui/src/brands/tailwind.css`:

```css
@theme inline {
  /* Bridge: --{tailwind-namespace}-pui-{token-path}: var(--pui-{token-path}) */
  --color-pui-accent: var(--pui-color-accent);
}
```

This follows the bridge pattern documented in the token naming conventions: `--{tailwind-namespace}-pui-{token-path}: var(--pui-{token-path})`.

### 5. Rebuild CSS

```bash
cd packages/tokens
pnpm build
```

This regenerates `dist/brands/*.css`. Commit both the JSON changes and the regenerated CSS.

## Adding a New Brand

Adding a brand spans two packages: tokens first (source of truth), then UI (consuming the generated CSS).

### Step 1: Create the brand JSON file

**Create `src/sets/brands/newbrand.json`.**

Only include tokens that differ from acorn. The brand JSON can contain both primitive overrides and semantic overrides in one file:

```json
{
  "pui": {
    "primitive": {
      "font": {
        "sans": {
          "$value": "'BrandFont', ui-sans-serif, system-ui, sans-serif",
          "$type": "fontFamily"
        }
      },
      "color": {
        "primary": {
          "9": { "$value": "#ff6600", "$type": "color" }
        }
      }
    },
    "color": {
      "interactive": {
        "on-primary": {
          "$value": "{pui.primitive.color.overlay.1}",
          "$type": "color"
        }
      }
    },
    "radius": {
      "button": { "$value": "0.5rem", "$type": "dimension" },
      "badge": { "$value": "0.25rem", "$type": "dimension" }
    }
  }
}
```

Tokens under `pui.primitive.*` generate into `@layer pui.primitive`. Everything else generates into `@layer pui.semantic`.

### Step 2: Update `$themes.json`

Add the new brand to the themes array in `src/sets/$themes.json`:

```json
{
  "name": "newbrand",
  "selectedTokenSets": {
    "primitives/colors": "source",
    "primitives/typography": "source",
    "primitives/shape": "source",
    "primitives/shadow": "source",
    "primitives/motion": "source",
    "semantic/base": "enabled",
    "brands/newbrand": "enabled"
  }
}
```

- **"source"** — Primitives are resolved (available for references) but NOT output directly in brand CSS
- **"enabled"** — Token sets whose values appear in the generated CSS

### Step 3: Add to build script

Add the brand name to the `BRANDS` array in `src/scripts/build.ts`:

```typescript
const BRANDS = ['acorn', 'sprig', 'stelpro', 'cima', 'newbrand'] as const;
```

### Step 4: Rebuild and verify

```bash
pnpm build
```

Check that `dist/brands/newbrand.css` was generated and contains **only the overrides** (not the full acorn base). The generated file should look like:

```css
@layer pui.primitive {
  [data-pui-brand='newbrand'] {
    --pui-primitive-font-sans:
      'BrandFont', ui-sans-serif, system-ui, sans-serif;
    --pui-primitive-color-primary-9: #ff6600;
  }
}

@layer pui.semantic {
  [data-pui-brand='newbrand'] {
    --pui-color-interactive-on-primary: var(--pui-primitive-color-overlay-1);
    --pui-radius-button: 0.5rem;
    --pui-radius-badge: 0.25rem;
  }
}
```

### Step 5: Commit both JSON and CSS

Always commit the JSON source **and** the regenerated CSS files together.

### Step 6: Wire up in `@perimetre/ui`

After the tokens are in place, the brand needs to be registered in the UI package:

1. **Register the brand** — Add to `BRANDS` const in `packages/ui/src/brands/index.ts`
2. **Create CSS entry file** — Create `packages/ui/src/styles/newbrand.css`:
   ```css
   @import './base.css';
   @import '@perimetre/tokens/brands/acorn.css';
   @import '@perimetre/tokens/brands/newbrand.css';
   ```
3. **Add custom variant** — Add `@custom-variant pui-newbrand` to `packages/ui/src/brands/tailwind.css`
4. **Update Ladle** — Add `@import '@perimetre/tokens/brands/newbrand.css';` to `packages/ui/src/styles/ladle.css`
5. **Add component variant overrides** (only if CSS class structure differs, not just token values) — See `@perimetre/ui` CONTRIBUTING.md for CVA brand variant patterns
6. **Test** — Start Ladle, switch to the new brand, verify all components render correctly

## Token Naming Conventions

### Primitives

```
--pui-primitive-{category}-{name}

Categories: color, font, leading, radius, shadow, duration
```

Color scales follow [Radix's 12-step philosophy](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale):

- Steps 1-2: Backgrounds
- Steps 3-5: Component backgrounds
- Steps 6-8: Borders
- Steps 9-10: Solid/accent
- Steps 11-12: Text

### Semantic Tokens

```
--pui-{category}-{purpose}[-{modifier}]

Categories: color, radius, shadow, border-width, font-weight,
            letter-spacing, text-transform, typo, field, duration
```

Examples:

- `--pui-color-bg-default` — Default background
- `--pui-color-interactive-primary` — Primary interactive color
- `--pui-color-button-hover` — Button hover state
- `--pui-radius-input` — Input border radius
- `--pui-typo-heading-1-size` — Heading 1 font size

## JSON Format Reference

All tokens follow the [W3C DTCG specification](https://tr.designtokens.org/format/):

| Field          | Required | Description                                                                                           |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `$value`       | Yes      | The token value (literal or `{reference}`)                                                            |
| `$type`        | Yes      | Token type: `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `shadow`, `duration`, `other` |
| `$description` | No       | Human-readable description (appears as CSS comment)                                                   |

### References

Use `{dot.path}` syntax to reference other tokens:

```json
{
  "$value": "{pui.primitive.color.primary.9}",
  "$type": "color"
}
```

This generates `var(--pui-primitive-color-primary-9)` in CSS.

### DTCG Collision Rule

A JSON node **cannot** be both a token (has `$value`) and a group (has children). If you have `--pui-color-error` and `--pui-color-error-strong`, use compound keys:

```json
{
  "pui": {
    "primitive": {
      "color": {
        "error": {
          "$value": "#dc3d43",
          "$type": "color"
        },
        "error-strong": {
          "$value": "#e5484d",
          "$type": "color"
        }
      }
    }
  }
}
```

`error` and `error-strong` are siblings, not parent-child.

## Build Script

The build script (`src/scripts/build.ts`) uses Style Dictionary v5 with `@tokens-studio/sd-transforms`:

```bash
pnpm build    # tsx src/scripts/build.ts
```

What it does:

1. For each brand, loads the relevant JSON token sets
2. Outputs CSS with `@layer pui.primitive` and `@layer pui.semantic` blocks
3. Preserves original values (HSL colors, `var()` references)
4. Brand CSS files contain only overrides, not the full merged set

### Token Collision Warnings

During build, you may see "Token collisions detected" warnings. These are **expected** — they indicate brand values overriding base values (e.g., sprig's `#69c14c` overriding acorn's `hsl(172, 96%, 53%)` for primary-9). The build script suppresses these by default.

## Workflow Checklist

- [ ] Add/modify tokens in the appropriate JSON file under `src/sets/`
- [ ] Run `pnpm build` to regenerate CSS
- [ ] Verify the generated CSS in `dist/brands/` looks correct
- [ ] If the token needs a Tailwind utility, add the bridge in `packages/ui/src/brands/tailwind.css`
- [ ] Commit both JSON changes and regenerated CSS
- [ ] Create a changeset: `pnpm changeset` (select `@perimetre/tokens`)
- [ ] If the change affects `@perimetre/ui`, update and test that package too

## Common Mistakes

| Mistake                                             | Fix                                                      |
| --------------------------------------------------- | -------------------------------------------------------- |
| Editing `dist/brands/*.css` directly                | Edit `src/sets/*.json` and run `pnpm build`              |
| Creating a token node that is both a leaf and group | Use compound keys (`error` + `error-strong` as siblings) |
| Adding all acorn values to a brand override file    | Only add values that **differ** from acorn               |
| Forgetting to commit regenerated CSS                | Always commit both JSON and CSS changes                  |
| Using `value` instead of `$value` in JSON           | DTCG format requires the `$` prefix: `$value`, `$type`   |
| Forgetting to add the brand to `build.ts`           | Add to the `BRANDS` array in `src/scripts/build.ts`      |
