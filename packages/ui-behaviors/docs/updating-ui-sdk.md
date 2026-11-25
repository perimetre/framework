# Updating UI SDK

`@perimetre/ui-behaviors` is built against one exact version of UI SDK, which is still in beta. This is how to move it to a newer one, and how to tell when that is due.

## When a review is due

Run:

```bash
npm view @ui-sdk/core version time.modified
```

Compare it with the "Status" table in the [README](../README.md). A review is due when either is true:

- UI SDK's latest version is newer than "Built against".
- "Last reviewed against UI SDK" is more than a month old.

A review does not have to end in an update. If UI SDK has not changed, or the change does not affect this package, set "Last reviewed" to today and stop there.

## What to check in UI SDK's changes

Read UI SDK's release notes between the two versions, looking for these first:

| This package uses                                                                                | From                   | Marked by UI SDK | Used in                                             |
| ------------------------------------------------------------------------------------------------ | ---------------------- | ---------------- | --------------------------------------------------- |
| `bindRepeat`                                                                                     | `@ui-sdk/core`         | experimental     | `sequence`: Previous and Next                       |
| `createCommit`                                                                                   | `@ui-sdk/core`         | experimental     | `sequence`: `onValueCommit`                         |
| `css`                                                                                            | `@ui-sdk/core`         | experimental     | `magnify`, `sequence`, `createScrub`: inline styles |
| `clamp`, `wrap`                                                                                  | `@ui-sdk/core/number`  | experimental     | `createFollowPoint`, `createScrub`                  |
| `bindDrag`, `dragThreshold`                                                                      | `@ui-sdk/core`         | stable           | `createScrub`                                       |
| `bindHold`                                                                                       | `@ui-sdk/core`         | stable           | `createFollowPoint`: the touch hold                 |
| `definePrimitive`, `createChange`, `createController`, `live`, `elements`, `labelOf`, `announce` | `@ui-sdk/core`         | stable           | every primitive                                     |
| `mount`, `checkServer`                                                                           | `@ui-sdk/core/testing` |                  | the tests                                           |
| `createAgent`                                                                                    | `@ui-sdk/core/agent`   |                  | the agent test                                      |
| `createParts`, `Autocomplete`, `useAsyncOptions`                                                 | `@ui-sdk/react`        |                  | the stories only                                    |

Also check whether UI SDK now ships something this package has. A behaviour or a primitive UI SDK covers is removed from here, in a major release that says what replaces it.

The docs for each version ship inside the package, at `node_modules/@ui-sdk/core/docs/`, so two versions can be compared directly.

## Steps

1. In `package.json`, set the new version of `@ui-sdk/core` in `devDependencies` and `peerDependencies`, and of `@ui-sdk/react` in `devDependencies`. Keep them exact, with no `^` or `~`.
2. `pnpm install`, then `pnpm turbo run build lint typecheck test --filter=@perimetre/ui-behaviors`. Type errors here are the first sign of an API change.
3. Run `pnpm --filter @perimetre/ui-behaviors dev` and try every story in a browser:
   - **createFollowPoint, magnify**: hover, the trigger button, arrow keys, Escape. On a phone, hold a finger.
   - **createScrub, createAutoProgress, sequence**: drag, sideways scroll, Previous and Next including holding them, playback, `loop` off.
   - **createLinkedHighlight, locator**: highlight and selection in both directions, scrolling into view, `data-in-view`.
   - **google**: suggestions and choosing one, markers drawing, selecting from a marker and from the list. Needs `VITE_GOOGLE_MAPS_API_KEY`.
4. Update the "Status" table in the README, and the versions in its quick start prompt.
5. Update the skill if a UI SDK change contradicts it.
6. Add a changeset. Changing the pinned UI SDK version is a breaking change for apps, since they must move to the same version.

Apps then update `@perimetre/ui-behaviors`, `@ui-sdk/core` and their adapter together.
