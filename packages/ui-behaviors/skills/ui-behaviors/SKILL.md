---
name: ui-behaviors
description: Builds components in a Périmètre app from @perimetre/ui-behaviors, the behaviours and primitives Périmètre adds to UI SDK. Covers a lens that magnifies under the pointer, a 360 or frame-by-frame viewer you drag and play, a store locator that links a list to a map, Google Places address fields and Google Maps for the locator, an accessible Icon, plus the behaviours underneath (createFollowPoint, createScrub, createAutoProgress, createLinkedHighlight) for components nobody ships. Use whenever a project has @perimetre/ui-behaviors installed, or when the user asks for a zoom, a product spin, a before and after, a store locator, an address autocomplete or an icon component.
---

# Build with @perimetre/ui-behaviors

`@perimetre/ui-behaviors` adds behaviours, primitives and utilities to [UI SDK](https://ui-sdk.dev). The app owns its components and builds them from these.

This skill covers only what differs from UI SDK. For `definePrimitive`, `createParts`, styling, the agent bridge and tests, follow UI SDK's skill.

## Read first

1. **UI SDK's skill:** `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md`, or `gh api repos/vercel-labs/ui/contents/packages/core/skills/ui-sdk/SKILL.md -H "Accept: application/vnd.github.raw"`.
2. **The types of what you import.** `node_modules/@perimetre/ui-behaviors/dist/**/*.d.ts` has JSDoc for every option, reason, part and CSS variable. It is the API reference.
3. **The story of what you use.** One sits next to each entry, as its shortest working example: `node_modules/@perimetre/ui-behaviors/src/primitives/sequence/sequence.stories.tsx`. The source of each entry is in the same folder.

## Pick your path

| You need                                                                  | Read                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| A lens, a 360 viewer or a store locator                                   | [references/primitives.md](references/primitives.md) |
| Something close to one of those, or a component of your own               | [references/behaviors.md](references/behaviors.md)   |
| An address field with Google's suggestions, or a Google map for a locator | [references/google.md](references/google.md)         |

Start from a primitive when one fits. When the parts or the rules differ, write your own primitive from the behaviours. Never copy a behaviour's code into the app.

## Entries

Every folder is its own entry. There is no root import.

| Import from `@perimetre/ui-behaviors/…` | What it holds                                     |
| --------------------------------------- | ------------------------------------------------- |
| `primitives/magnify`                    | `magnify`, `createMagnifyController`              |
| `primitives/sequence`                   | `sequence`, `createSequenceController`            |
| `primitives/locator`                    | `locator`, `createLocatorController`              |
| `behaviors/follow-point`                | `createFollowPoint`                               |
| `behaviors/scrub`                       | `createScrub`, `normalizeProgress`                |
| `behaviors/auto-progress`               | `createAutoProgress`, `prefersReducedMotion`      |
| `behaviors/linked-highlight`            | `createLinkedHighlight`                           |
| `behaviors/google-map`                  | `bindGoogleMap`, `bindGoogleMarker`               |
| `utilities/google-places`               | `createPlacesSession`                             |
| `utilities/geo`                         | `sortByDistance`, `distanceBetween`, `isInBounds` |
| `utilities/geolocation`                 | `requestGeolocation`                              |
| `utilities/accessible-icon`             | `accessibleIcon`, `visuallyHidden`                |
| `react/icon`                            | `Icon`, `IconProps`                               |

No entry has `"use client"`, so a Server Component can import any of them. Only `react/icon` needs React.

## Rules

- **The app owns the component.** Write it in the app's components folder. This package has no components to import, apart from `Icon`.
- **Name the parts for the app** as you destructure them: `const { Root: ProductSpin, Viewport: ProductSpinViewport } = createParts(sequence, { … })`.
- **Style from the app's design tokens.** The app defines its own tokens in its stylesheet (`@theme` in Tailwind CSS v4). A component reads those, never a raw colour, radius or shadow. Add the token to the app when one is missing.
- **Merge classes with `cn`** from the [`cn`](https://github.com/shadcn-ui/cn) package. Never use `clsx` or `tailwind-merge`.
- **Wrap every svg in `Icon`**, from `react/icon`. Give the app's icon components `IconProps`, and pass `aria-hidden` or a `label` where the icon is used, never where it is declared.
- **Every label comes from the app's translations.** Nothing here renders text. The one exception is the "Google Maps" attribution, which Google's terms fix.
- **Never bump UI SDK alone.** This package pins one exact version as a peer.

## Agents

Each primitive declares its `agent` key, so UI SDK's bridge finds it with no extra code:

| Primitive  | Actions                               | Notes                                                    |
| ---------- | ------------------------------------- | -------------------------------------------------------- |
| `magnify`  | `setActive`, `moveTo`                 |                                                          |
| `sequence` | `setValue`, `stepBy`, `play`, `pause` |                                                          |
| `locator`  | `setValue`, `setHighlighted`          | `closed`: the value is one of its places, listed by name |

The bridge lists primitive instances only. A behaviour or a utility reaches an agent through the primitive that uses it, and `Icon` never does. A primitive you write yourself needs its own `agent: { actions: [...] }`.
