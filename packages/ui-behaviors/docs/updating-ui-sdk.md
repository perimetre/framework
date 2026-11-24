# Updating UI SDK

`@perimetre/ui-behaviors` is built against one exact version of UI SDK, which is still in beta. This is how to move it to a newer one, and how to tell when that is due.

## When a review is due

Run:

```bash
npm view @ui-sdk/react version time.modified
```

Compare it with the "Status" table in the [README](../README.md). A review is due when either is true:

- UI SDK's latest version is newer than "Built against".
- "Last reviewed against UI SDK" is more than a month old.

A review does not have to end in an update. If UI SDK has not changed, or the change does not affect this package, set "Last reviewed" to today and stop there.

## What to check in UI SDK's changes

Read UI SDK's release notes between the two versions, looking for these first:

| This package uses                                                                     | From                          | Marked by UI SDK | Used in                          |
| ------------------------------------------------------------------------------------- | ----------------------------- | ---------------- | -------------------------------- |
| `bindRepeat`                                                                          | `@ui-sdk/core`                | experimental     | sequence: Previous and Next      |
| `createCommit`                                                                        | `@ui-sdk/core`                | experimental     | sequence: `onValueCommit`        |
| `css`                                                                                 | `@ui-sdk/core`                | experimental     | magnify, sequence: inline styles |
| `definePrimitive`, `createChange`, `createController`, `live`, `elements`, `announce` | `@ui-sdk/core`                | stable           | every behaviour                  |
| `createParts`, `renderElement`                                                        | `@ui-sdk/react/primitive`     | stable           | every entry                      |
| `Autocomplete`, `AutocompleteList`                                                    | `@ui-sdk/react/autocomplete`  |                  | google: Places autocomplete      |
| `useAsyncOptions`                                                                     | `@ui-sdk/react/async-options` |                  | google: Places autocomplete      |

The same docs ship inside the package, at `node_modules/@ui-sdk/react/docs/`, so the two versions can be compared directly.

## Steps

1. In `package.json`, set the new version of `@ui-sdk/core` and `@ui-sdk/react` in both `devDependencies` and `peerDependencies`. Keep them exact, with no `^` or `~`.
2. `pnpm install`, then `pnpm turbo run build lint --filter=@perimetre/ui-behaviors`. Type errors here are the first sign of an API change.
3. Check each behaviour in a browser. Each doc in this folder lists what was verified last time; repeat at least that:
   - **magnify**: hover, the trigger button, arrow keys, Escape.
   - **sequence**: drag, sideways scroll, Previous and Next including holding them, playback, `loop` off.
   - **locator**: highlight and selection in both directions, scrolling into view, `data-in-view`, the results announcement.
   - **google**: suggestions and choosing one, markers drawing, selecting from a marker and from the list. Needs a Google Maps key.
4. Update the "Status" table in the README: "Built against", "That version published" and "Last reviewed against UI SDK". Update the version in the README's install command too.
5. Update the migration doc if a UI SDK change contradicts one of its notes.
6. Add a changeset. Changing the pinned UI SDK version is a breaking change for projects, since they must move to the same version.

Projects then update `@perimetre/ui-behaviors`, `@ui-sdk/core` and `@ui-sdk/react` together.
