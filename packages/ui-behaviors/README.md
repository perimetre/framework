# @perimetre/ui-behaviors

What Périmètre adds to [UI SDK](https://ui-sdk.dev): the behaviours it does not ship, for an agent to build an app's own components with.

You do not write against this package by hand. You give your agent its skill and ask for a component.

## Quick start

Copy this prompt into your agent, in the app:

```text
Set up @perimetre/ui-behaviors in this React project. It needs React 19 or newer.

1. Check that .npmrc has `@perimetre:registry=https://npm.pkg.github.com`. If it
   doesn't, or the install is refused, stop and ask me.
2. Install @perimetre/ui-behaviors, @ui-sdk/core@0.1.0-beta.17,
   @ui-sdk/react@0.1.0-beta.17 and cn with the project's package manager. The
   UI SDK version must be exactly that one. If a release-age policy blocks the
   install, stop and ask me instead of changing it.
3. Put `@layer ui-sdk;` at the top of the global stylesheet, above
   `@import "tailwindcss"` if there is one.
4. Add a note to AGENTS.md/CLAUDE.md, creating it if needed: components live in this app,
   not in a shared library. Before building one, follow the ui-sdk and
   ui-behaviors skills if they're installed, and read
   node_modules/@perimetre/ui-behaviors/skills/ui-behaviors/SKILL.md and
   node_modules/@ui-sdk/react/docs/llms.txt.
5. If you support skills, run:
   npx skills@latest add vercel-labs/ui --skill ui-sdk
   npx skills@latest add perimetre/framework --skill ui-behaviors
```

Then ask for a component:

```text
Build a product zoom with @perimetre/ui-behaviors: the product image with a
round lens that follows the pointer, and a button that gives keyboards the
same lens. Put it in our components folder and use our existing styles.
```

## What you can ask for

- **A product zoom:** a lens that magnifies an image under the pointer.
- **A 360 viewer:** a run of frames you drag, step through or play.
- **A store locator:** a list of places linked to a map, with or without Google Maps.
- **An address field** with Google's place suggestions.
- **Icons** that are either hidden from screen readers or labelled.
- **Something nobody ships,** built from the same pieces: a spotlight, a before and after, a timer, a chart with a linked legend.

Everything else, from accordions to form controls, comes from UI SDK itself.

How any of it is built is in [the skill](skills/ui-behaviors/SKILL.md), which your agent reads.

## Status

UI SDK is in beta. Its first release was on 2026-11-12.

|                              |                                |
| ---------------------------- | ------------------------------ |
| Built against                | `@ui-sdk/core` `0.1.0-beta.17` |
| That version published       | 2026-11-24                     |
| Last reviewed against UI SDK | 2026-11-25                     |

An app installs that exact version of UI SDK. A newer one arrives as a release of this package. Check with `npm view @ui-sdk/core version time.modified`, then follow [Updating UI SDK](docs/updating-ui-sdk.md).

## Working on this package

```bash
pnpm --filter @perimetre/ui-behaviors dev        # Ladle, with every story
pnpm turbo run build lint typecheck test --filter=@perimetre/ui-behaviors
```

Follow the `create-ui-behavior` skill in the framework repo: `.agents/skills/create-ui-behavior/SKILL.md`. The Google stories need `VITE_GOOGLE_MAPS_API_KEY` in `packages/ui-behaviors/.env.local`.
