# @perimetre/ui-behaviors

Unstyled, accessible UI behaviours for Périmètre projects, built on [UI SDK](https://ui-sdk.dev).

**This package replaces [`@perimetre/ui`](../ui) for new work.** `@perimetre/ui` stays published and working for the projects that already use it, but gets no new components. See [Migrating from @perimetre/ui](docs/migrating-from-perimetre-ui.md) for what each old component becomes.

## Status: built on a beta

UI SDK is new and in beta. Its first release was on 2026-11-12, and it published 15 betas in its first 12 days. Expect its API to change, and expect this package to need attention each time it does.

|                              |                                                    |
| ---------------------------- | -------------------------------------------------- |
| Built against                | `@ui-sdk/core` and `@ui-sdk/react` `0.1.0-beta.17` |
| That version published       | 2026-11-24                                         |
| Last reviewed against UI SDK | 2026-11-24                                         |

**Before relying on this package, check whether UI SDK has moved on:**

```bash
npm view @ui-sdk/react version time.modified
```

If that shows a version newer than the one above, or the last review above is more than a month old, this package is due for a review. Follow [Updating UI SDK](docs/updating-ui-sdk.md), or raise it with whoever maintains the framework repo. Do this even when everything appears to work: the point is to not forget.

What this means in practice:

- **The UI SDK version is pinned exactly**, as a peer dependency. A project must install that exact version of `@ui-sdk/core` and `@ui-sdk/react`. Moving to a newer UI SDK is a release of this package, never something a project does on its own.
- **Three UI SDK functions this package uses are marked experimental by UI SDK**: `bindRepeat` (the hold-to-repeat buttons in sequence), `createCommit` (sequence's `onValueCommit`) and `css` (inline styles in magnify and sequence). They are the likeliest to change.
- **There are no automated tests yet.** Each behaviour was checked by hand in a browser. Each doc ends with what was and was not verified.

The replacement is not one package. Use UI SDK directly for everything it covers (accordion, tabs, drawer, carousel, form controls). This package holds only the behaviours UI SDK does not have. Components that were only styling (badge, section headers) move to the project.

| Entry                              | What it is                                                                                   | Docs                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| `@perimetre/ui-behaviors/magnify`  | A lens that magnifies whatever is on a surface, under the pointer                            | [Magnify](docs/magnify.md)   |
| `@perimetre/ui-behaviors/sequence` | Moving through a dense run of frames, like a product turning, by drag, buttons or playback   | [Sequence](docs/sequence.md) |
| `@perimetre/ui-behaviors/locator`  | The link between a list of places and their markers on a map                                 | [Locator](docs/locator.md)   |
| `@perimetre/ui-behaviors/google`   | Google Places autocomplete, and Google Maps for the locator. The one entry tied to a product | [Google](docs/google.md)     |

## Installation

```bash
pnpm add @perimetre/ui-behaviors @ui-sdk/react@0.1.0-beta.17 @ui-sdk/core@0.1.0-beta.17
```

The UI SDK version must match the one in [Status](#status-built-on-a-beta) exactly.

Requires React 19. Declare UI SDK's cascade layer at the top of the global stylesheet, above Tailwind if you use it:

```css
@layer ui-sdk;
```

## What every behaviour here follows

The same contract as UI SDK's own parts, so they style and compose the same way:

- **No styles.** Parts ship no class names, CSS, tokens or icons. The only inline styles are the geometry a behaviour cannot work without.
- **`data-slot` on every part**, state as `data-*` attributes, values as CSS variables.
- **`render`** to replace a part's element; `className`, `style` and `children` may be functions of state.
- **Controlled or uncontrolled** state, with `on<Key>Change(value, details)`; `details.reason` says why and `details.cancel()` refuses.
- **A controller** to drive the behaviour from outside.
- **No baked-in text.** Labels come from the project. The one exception is the "Google Maps" attribution, which Google's terms fix.
- **One entry per behaviour.** There is no root import.

Each behaviour is a UI SDK primitive (`definePrimitive`) in `primitive.ts`, with its React parts made by `createParts` in `index.tsx`. The primitive has no React in it. The Google entry is the exception: it is React components composed from UI SDK's `Autocomplete` and from the locator.

Nothing depends on a third-party product except the Google entry, whose Google packages are optional peer dependencies.
