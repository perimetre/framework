---
name: create-tokens
description: Creates, updates, and overrides design tokens in the Perimetre design system — primitives (raw palette), semantic tokens (the public API components consume), brand overrides (per-brand value changes in Sprig/Stelpro/Cima/Microbird), and synthetic/component tokens. Also wires new tokens into the Tailwind bridge so they become `pui:` utilities. Use this skill whenever the user asks to add, change, override, tweak, expose, or rebuild a design token, give a designer control over a color/radius/shadow/typography/motion value per brand, "make this tokenizable", "add a pui token", "override the button radius for Sprig", "expose a new semantic token for the Card component", "regenerate the tokens CSS", or "turn this hardcoded value into a token Vuong can change".
license: MIT
metadata:
  author: perimetre
  version: '1.0.0'
---

# Create / Update Design Tokens

Design tokens are the shared vocabulary between design and developers. They are how the same component code renders differently per brand, and how a designer can adjust the look of the system without touching code. This skill covers the full token workflow: choosing the right tier, writing the JSON in `@perimetre/tokens`, bridging to Tailwind in `@perimetre/ui`, and rebuilding the generated CSS.

---

## Step 0 — Read the Canonical Docs First

Always anchor on these files. They are the source of truth — if this skill disagrees with them, the canonical docs win.

| When you need to…                                                  | Read                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| See the narrative design-token doc (what designers/devs both read) | `packages/ui/src/docs/DesignTokens.stories.mdx`                 |
| Check the naming conventions (`pui` namespace, hierarchy)          | `packages/ui/src/docs/TokenNamingConventions.stories.mdx`       |
| Understand the tokens package architecture & build pipeline        | `packages/tokens/README.md`                                     |
| See the exact JSON format and "add a token / add a brand" workflow | `packages/tokens/CONTRIBUTING.md`                               |
| See current primitives                                             | `packages/tokens/src/sets/primitives/*.json`                    |
| See current semantic tokens                                        | `packages/tokens/src/sets/semantic/base.json`                   |
| See a brand override                                               | `packages/tokens/src/sets/brands/{sprig,stelpro,cima,...}.json` |
| Check the Tailwind bridge (utility generation)                     | `packages/ui/src/brands/tailwind.css` (`@theme inline` block)   |
| See the brand list                                                 | `packages/ui/src/brands/index.ts` (`BRANDS` const)              |

Do not rely on memory; open these files. Token names and structure evolve.

---

## Core Principles (internalize before touching JSON)

1. **Code is the source of truth.** JSON → build → CSS. Never edit `packages/tokens/dist/brands/*.css` by hand. Never add raw `--pui-*` custom properties to `packages/ui` CSS files.
2. **Three tiers, one direction.** Primitives feed semantic tokens. Semantic tokens feed components. Components never reference primitives.
3. **Acorn is the base; brands override only what differs.** A brand JSON with 200 entries is almost certainly wrong.
4. **Tokenize appearance, hardcode structure.** Colors/radii/shadows/typography/motion → tokens. Display/position/alignment → hardcoded utilities.
5. **Pragmatic by default.** Don't create a token for every value. Create one when (a) it varies between brands, (b) it's used in 3+ components with the same meaning, or (c) a designer would adjust it during a brand exercise.

---

## The Three Ways to Style — Which One Does This Task Need?

When the user asks for a visual change, the right tier is often not "a new token." Run this ladder:

1. **Override an existing token per brand.** If the semantic already exists (e.g. `--pui-radius-button`) and the value just needs to differ for Sprig, the answer is "edit `brands/sprig.json`, rebuild." No new token, no component code change. **This is usually the right answer.**
2. **Add a new CVA brand variant.** If the brand needs a _different class_ (e.g. a completely different text-color token), that belongs in `{Component}.{brand}.brand.ts`, not in the token layer. Route the user to the `create-ui-component` skill.
3. **Add a new semantic token.** Only when no existing token expresses the purpose AND the value is something a designer should control AND the value is reused or expected to vary.
4. **Add a primitive.** Rare. Only when you genuinely need a new raw value (e.g. a new accent hue step, a new font family) that semantic tokens can reference.
5. **Add a synthetic / component-scoped token.** Last resort. For a cross-brand, cross-component value gap that neither primitives nor existing semantics can fill — e.g. `--pui-color-alertbar-first-fg` (AlertBar needed per-variant fg colors that varied per brand and no generic semantic covered it).

If you're routinely creating synthetic tokens, that's a signal the semantic vocabulary is under-developed — promote repeat patterns into core semantics.

---

## Framework Mindset

Everything in `@perimetre/framework` is consumed by multiple apps. Every token is an ergonomic for a designer **and** an API for every consumer app.

Ask these questions before committing a new token:

- **Will a designer want to tweak this?** If yes → token. If not → hardcode.
- **Will multiple brands need different values?** If yes → semantic token with brand overrides. If no → probably hardcode.
- **Will this be used by 3+ components?** If yes → semantic token. If no → arbitrary Tailwind value or hardcode until the pattern emerges.
- **Does a similar token already exist?** If yes → reuse. Token proliferation is real and costly.

We are intentionally _behind_ on full semantic token coverage. The healthy pattern: when a designer (Vuong or other) asks "how can I change X per brand?" and the current answer is "you can't without code," that's the moment to add the token. Not before.

---

## Where Tokens Live

```
packages/tokens/
├── src/
│   ├── sets/                          ← Source of truth (W3C DTCG JSON)
│   │   ├── primitives/                ← Tier 1: raw palette
│   │   │   ├── colors.json            ← 12-step scales + feedback colors
│   │   │   ├── typography.json        ← Font families, sizes, weights, leading
│   │   │   ├── shape.json             ← Border radii
│   │   │   ├── shadow.json            ← Box shadows
│   │   │   └── motion.json            ← Durations
│   │   ├── semantic/
│   │   │   └── base.json              ← Tier 2: all semantic tokens (acorn defaults)
│   │   ├── brands/                    ← Per-brand overrides (only differences)
│   │   │   ├── sprig.json
│   │   │   ├── stelpro.json
│   │   │   ├── cima.json
│   │   │   └── microbird-*.json
│   │   └── $themes.json               ← Tokens Studio theme composition
│   └── scripts/build.ts               ← JSON → CSS (Style Dictionary v5)
└── dist/brands/                        ← Generated, committed to git
    ├── acorn.css                       ← Full primitives + semantics
    └── {brand}.css                     ← Brand overrides only

packages/ui/src/brands/
└── tailwind.css                        ← @theme inline bridge (token → utility)
```

---

## Naming — Non-Negotiable Rules

Every token name starts with the `pui` namespace. Lowercase with hyphens for multi-word segments. From general to specific:

```
--pui-{category}-{subcategory}-{element}-{variant}-{state}
```

Use only as many levels as you need for clarity. Examples that already exist in the system (check the Tailwind bridge for the current set):

```
--pui-color-bg-default
--pui-color-fg-muted
--pui-color-interactive-primary
--pui-color-interactive-on-primary
--pui-color-input-border-focus
--pui-color-feedback-error
--pui-radius-button
--pui-shadow-input-focus
--pui-duration-normal
--pui-typo-heading-1-size
```

Consistency is the enforcement mechanism:

- Use the same subcategory vocabulary: `bg`, `fg`, `border`, `interactive`, `input`, `control`, `feedback`.
- Use the same state vocabulary: `default`, `hover`, `focus`, `active`, `disabled`.
- Use the same modifier vocabulary: `default`, `subtle`, `muted`, `strong`, `inverse`.
- Do not invent synonyms. If inputs use `focus`, don't introduce `focused`.
- Never include raw values in names. `--pui-color-blue-600` is fine as a _primitive_, never as a semantic.
- Never skip the `pui-` prefix — consumer projects rely on namespacing to avoid collisions.

Primitives follow `--pui-primitive-{category}-{name}` (e.g. `--pui-primitive-color-primary-9`). Components **never** consume primitives directly.

---

## Workflows

### A. Add a primitive (Tier 1 — raw palette)

Rare. Only when a new raw value is needed for semantic tokens to reference.

1. Open `packages/tokens/src/sets/primitives/{category}.json` (`colors.json`, `typography.json`, `shape.json`, `shadow.json`, `motion.json`).
2. Add the value in W3C DTCG format:
   ```json
   {
     "pui": {
       "primitive": {
         "color": {
           "purple": {
             "9": { "$value": "#7c3aed", "$type": "color" }
           }
         }
       }
     }
   }
   ```
3. Primitives are usually _not_ bridged to Tailwind directly — they exist to feed semantic tokens. Only bridge a primitive to Tailwind if components need a raw scale step directly (e.g. `pui:text-pui-overlay-12`), and even then, prefer creating a semantic alias.
4. Rebuild (`pnpm build` in `packages/tokens`), commit both JSON and generated CSS.

### B. Add a semantic token (Tier 2 — the public API)

This is where ~90% of token work lives.

1. Open `packages/tokens/src/sets/semantic/base.json`.
2. Add the token, referencing a primitive via `{dot.path}`:
   ```json
   {
     "pui": {
       "color": {
         "card": {
           "bg": {
             "$value": "{pui.primitive.color.overlay.1}",
             "$type": "color",
             "$description": "Default surface color for Card components."
           }
         }
       }
     }
   }
   ```
3. If the value should differ for specific brands, add the override in each `packages/tokens/src/sets/brands/{brand}.json` — **only** for the brands that differ. Other brands inherit the Acorn/base value.
4. **Bridge to Tailwind** in `packages/ui/src/brands/tailwind.css` inside the `@theme inline` block. The bridge shape is always `--{tailwind-namespace}-pui-{token-path}: var(--pui-{token-path})`:
   ```css
   @theme inline {
     --color-pui-card-bg: var(--pui-color-card-bg);
   }
   ```
   Tailwind namespaces to use: `--color-*` (colors), `--radius-*` (border-radius), `--shadow-*` (box-shadow), `--font-*` (font-family), `--ease-*` (transition-timing-function). Match the namespace to the Tailwind utility you want to generate. See existing entries in `tailwind.css` for the patterns.
5. Rebuild: `cd packages/tokens && pnpm build`. Verify `dist/brands/acorn.css` contains the new token and `dist/brands/{brand}.css` contains only the override if you added one.
6. Commit the JSON _and_ the regenerated CSS _and_ the `tailwind.css` bridge edit.
7. Consumers now write `pui:bg-pui-card-bg` in components.

### C. Override an existing token for a brand

By far the most common task. No semantic vocabulary change — just a different value for one brand.

1. Open `packages/tokens/src/sets/brands/{brand}.json`.
2. Add only the tokens that differ. Reference existing primitives via `{dot.path}`:
   ```json
   {
     "pui": {
       "color": {
         "interactive": {
           "on-primary": {
             "$value": "{pui.primitive.color.overlay.1}",
             "$type": "color"
           }
         }
       },
       "radius": {
         "badge": { "$value": "0", "$type": "dimension" }
       }
     }
   }
   ```
3. Rebuild. The generated `{brand}.css` must contain **only** overrides — if it looks like a full copy of acorn.css, the brand JSON is wrong.
4. Commit both JSON and regenerated CSS. No Tailwind bridge change is needed — the token name already exists.

### D. Add a new brand

See `packages/tokens/CONTRIBUTING.md` for the definitive checklist. Summary:

1. Create `packages/tokens/src/sets/brands/{newbrand}.json` with only overrides.
2. Add the brand to `packages/tokens/src/sets/$themes.json`.
3. Add the brand to the `BRANDS` array in `packages/tokens/src/scripts/build.ts`.
4. `pnpm build` in `packages/tokens`, commit JSON + CSS.
5. In `@perimetre/ui`:
   - Add to the `BRANDS` const in `packages/ui/src/brands/index.ts`.
   - Create `packages/ui/src/styles/{newbrand}.css` importing base, acorn, then the new brand.
   - Create `packages/ui/src/tailwind/{newbrand}.css` for the source-level (no Tailwind runtime) entry.
   - Add `@custom-variant pui-{newbrand} (&:where([data-pui-brand={newbrand}], [data-pui-brand={newbrand}] *));` to `packages/ui/src/brands/tailwind.css`.
   - Import the new brand's CSS into `packages/ui/src/styles/ladle.css` so it's visible in Ladle.
6. If (and only if) the brand needs **different class strings** in any component (not just different token values), add a `{Component}.{newbrand}.brand.ts` file and register it in `brands/index.ts`. Otherwise token overrides alone are enough — components pick up values automatically.
7. Test in Ladle by switching the brand.

### E. Add a synthetic token (last resort)

When neither existing primitives nor semantics cover a real gap. Must satisfy all of:

- No existing semantic token covers the need.
- Used in 2+ component surfaces now, or clearly planned across a family.
- Has a stable semantic meaning (not a one-off tweak).
- Reduces complexity across brands/components more than it adds token surface area.

Naming: `--pui-{category}-{purpose}-{modifier?}` (semantic-first) or `--pui-{component}-{part}-{property}` (component-scoped, rare). Add a `$description` field explaining the rationale. Reference: `packages/ui/src/docs/DesignTokens.stories.mdx`'s "Synthetic tokens" section and the `--pui-color-alertbar-first-fg` family as a worked example.

### F. Regenerate / rebuild the tokens CSS

```bash
cd packages/tokens
pnpm build
```

This reads JSON from `src/sets/` and writes CSS to `dist/brands/`. Both are committed to git — consumers never run the build themselves. "Token collisions detected" warnings are expected (they indicate brand overrides winning) and are suppressed by default.

---

## DTCG JSON Format Reminders

| Field          | Required | Notes                                                                                     |
| -------------- | -------- | ----------------------------------------------------------------------------------------- |
| `$value`       | Yes      | Literal (`"#7c3aed"`, `"0.5rem"`) or a `{dot.path}` reference                             |
| `$type`        | Yes      | `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `shadow`, `duration`, `other` |
| `$description` | No       | Shows up as a CSS comment in the generated file — use it generously for synthetic tokens  |

**Collision rule (important):** a JSON node _cannot_ be both a value (has `$value`) and a group (has children). If you need `--pui-color-error` _and_ `--pui-color-error-strong`, use compound keys as siblings:

```json
{
  "pui": {
    "color": {
      "error": { "$value": "#dc3d43", "$type": "color" },
      "error-strong": { "$value": "#e5484d", "$type": "color" }
    }
  }
}
```

Not:

```json
{
  "error": {
    "$value": "#dc3d43",
    "strong": { "$value": "#e5484d" }
  }
}
```

---

## Review Checklist

Before finishing any token change:

- [ ] JSON edited in `packages/tokens/src/sets/` — never directly in `dist/` or in `packages/ui` CSS
- [ ] Primitive added only if a new raw value was needed; otherwise reused existing primitives via `{dot.path}`
- [ ] Semantic token follows naming conventions (`--pui-{category}-{subcategory}-{element}-{state}`)
- [ ] `$type` field present on every new token
- [ ] No DTCG collision (no node that is both value and group)
- [ ] Brand override files contain **only** differences from acorn — not a full copy
- [ ] If consumed as a Tailwind utility: bridge added to `packages/ui/src/brands/tailwind.css` under `@theme inline`
- [ ] `pnpm build` run in `packages/tokens/`
- [ ] Generated `dist/brands/*.css` reviewed — acorn has the new token, other brands only show overrides they define
- [ ] Both JSON source files AND generated CSS committed in the same change
- [ ] Changeset created (`pnpm changeset`) if publishing: usually `@perimetre/tokens` and, if the bridge changed, `@perimetre/ui`
- [ ] Components don't reference primitives directly (semantic only)

---

## Common Mistakes

| Mistake                                                           | Fix                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Editing generated `dist/brands/*.css` directly                    | Edit JSON in `src/sets/` and run `pnpm build`                             |
| Adding tokens directly as `--pui-*` in `packages/ui` CSS files    | Token values live in `@perimetre/tokens` JSON; `ui` only has the bridge   |
| Copying all of Acorn's values into a brand override file          | Override only what differs — brands inherit everything else               |
| Forgetting to add the Tailwind bridge entry                       | New tokens need `--{ns}-pui-{path}: var(--pui-{path})` in `tailwind.css`  |
| Using `value` / `type` instead of `$value` / `$type`              | DTCG requires the `$` prefix                                              |
| Creating a node that is both leaf and group (collision)           | Use compound sibling keys (e.g. `error` and `error-strong`)               |
| Creating a semantic token for a one-off value                     | Use a Tailwind arbitrary utility; tokens are for repeated / brand-varying |
| Creating a token whose name includes a raw value (`--pui-teal-9`) | Raw values belong in primitives; semantics name purpose                   |
| Forgetting to commit regenerated CSS                              | Always commit JSON + CSS together                                         |
| Forgetting to add a new brand to `BRANDS` in `build.ts`           | Without it, the brand CSS is not generated                                |
| Creating a synthetic token for a single-component layout tweak    | Hardcode the single-component case; synthetics are for cross-brand reuse  |
| Wrong brand list in examples                                      | Always read `packages/ui/src/brands/index.ts` — brands change over time   |

---

## Related Skills

- `create-ui-component` — for scaffolding the component that will consume these tokens. If the task is "make component X designer-controllable," most of the work is usually in _this_ skill (adding the right semantic tokens), and only a thin component-scaffold pass is needed afterward.
