---
name: create-ui-behavior
description: Adds or changes a behaviour, primitive or utility in @perimetre/ui-behaviors (packages/ui-behaviors), the framework-free library built on UI SDK that apps build their own components from. Includes a naming interview, with scenarios, that every new export must pass before code is written. Use whenever the user asks to add a behaviour, a create<Thing> or bind<Thing> function, a primitive (definePrimitive), a utility, a story or a test to ui-behaviors, to extract reusable interaction logic out of an app or out of @perimetre/ui, to update the pinned UI SDK version, or to maintain anything under packages/ui-behaviors. Also use when someone asks for a new shared UI component: components are no longer added to a shared library, and this skill says what to do instead.
license: MIT
metadata:
  author: perimetre
  version: '1.0.0'
---

# Add to `@perimetre/ui-behaviors`

`packages/ui-behaviors` is a library of UI behaviours on [UI SDK](https://ui-sdk.dev). Apps own their components and build them from what is here. It is not a component library: it ships no styles, and `Icon` (`src/react/icon/`) is its only component.

This skill is for working on the package. The skill that ships to apps is a different file, `packages/ui-behaviors/skills/ui-behaviors/`, and you keep it up to date as part of every change.

## Read first

UI SDK owns the method. Read it before writing, from the version installed in the package:

1. `packages/ui-behaviors/node_modules/@ui-sdk/core/skills/ui-sdk/references/create-component.md`, mostly "A new behavior", "Write the primitive" and "Use the blocks".
2. `packages/ui-behaviors/node_modules/@ui-sdk/core/docs/core.md`. It is over 300 KB: search it by heading. Read "Compose Behaviors", "Customize a Behavior", "Define a Primitive", "Handle Changes", and "All Behaviors".
3. One of UI SDK's own behaviours, to copy its shape:
   `gh api repos/vercel-labs/ui/contents/packages/core/src/foundation/direct-manipulation/area.ts -H "Accept: application/vnd.github.raw"`
4. `packages/ui-behaviors/node_modules/@ui-sdk/core/skills/ui-sdk/references/testing.md`, and "Testing" in `core.md`. They own how a primitive is tested: `mount`, `keys`, `click`, `hover`, `drag`, `checkServer`, `checkDirection`, `checkPattern`, and breaking the code on purpose.
5. The nearest thing already here. `src/behaviors/scrub/` is the reference behaviour and `src/primitives/sequence/` the reference primitive.

Types are the API: `node_modules/@ui-sdk/core/dist/**/*.d.ts`. Leave compiled `dist/*.js` unread and uncopied, since it changes between betas with no notice, and never import `@ui-sdk/core/internal/*`, which only UI SDK's own repo resolves.

## Should it be here at all

Answer these in order. Stop at the first "no".

1. **Does UI SDK ship it?** Check "All Behaviors" in `core.md` and the entries in `node_modules/@ui-sdk/react/package.json`. If it does, use UI SDK's and add nothing.
2. **Do two projects need it today?** If only one does, it stays in that app. Extracting early freezes an API before a second caller has tested it.
3. **Is it behaviour?** Something with styles, markup or text is a component, and components belong to the app. The answer is a primitive the app renders, never a component here.

## What kind of thing it is

| Kind      | What it is                                                                                                                                                                                   | Lives in                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Behaviour | One thing an interface does. `create<Thing>(context, options)` for one used inside a primitive's `api`, `bind<Thing>(el, options)` for one that attaches to an element and returns a cleanup | `src/behaviors/<name>/`  |
| Primitive | A whole component's state, behaviours, parts and ARIA: `definePrimitive`                                                                                                                     | `src/primitives/<name>/` |
| Utility   | A pure function with no element and no primitive context                                                                                                                                     | `src/utilities/<name>/`  |

Prefer a behaviour plus a thin primitive over a primitive with the logic inside it. A primitive whose `api` holds pointer or timing code of its own has a behaviour waiting to be taken out.

**The folder is the entry.** `package.json` `exports` maps `./*` to `./dist/*/index.js`, so `src/behaviors/scrub/index.ts` is `@perimetre/ui-behaviors/behaviors/scrub` with nothing to register. There is no root `index.ts` and there must never be one: a barrel would pull optional peers like Google's packages into every app, and it is one more line to forget.

## Naming

Follow UI SDK exactly, so an agent that knows UI SDK already knows this package.

- **Behaviours:** `create<Thing>` and `bind<Thing>`. Types `<Thing>Options`, `<Thing>Reason`, and `<Thing>Behavior` for what it returns.
- **Primitives:** a lowercase noun (`magnify`), with `name: 'magnify'` in kebab case. Slots in kebab case (`play-toggle`). `create<Name>Controller()`, `<Name>Options`, `<Name>Controller`, `<Name><Key>ChangeReason`.
- **Options:** controlled state is `<key>`, `default<Key>` and `on<Key>Change(value, details)`. A final value after an interaction is `on<Key>Commit`.
- **Reasons:** use UI SDK's `ReasonVocabulary` when one fits (`item-press`, `swipe`, `escape-key`, `imperative`). Add a one-line comment naming any reason that is not in it.
- **Folders and files:** kebab case, `index.ts`, with `<name>.stories.tsx` and `<name>.test.ts` beside it.

## Grill the name

A name is the first thing an agent reads, and a wrong first guess sends it to the wrong tool. `createHighlight` reads as marking search matches, and `createPlayback` as a media player. A name that misleads has to be changed in every folder, type, story and doc that carries it.

Do this before writing code, for every new behaviour, primitive and utility. **You find the facts and suggest. The user picks the name.** Propose candidates, say which one you would choose and why, and say how you expect each to fare in a scenario. What you may not do is settle the name, or count your own answer to a scenario as the user's.

### 1. Find the facts

Do not ask the user for these. Look them up for each candidate word:

- **UI SDK's names:** `grep -rhoE "\b(create|bind)[A-Za-z]*<Word>[A-Za-z]*\b" packages/ui-behaviors/node_modules/@ui-sdk/core/dist --include='*.d.ts' | sort -u`
- **UI SDK's vocabulary:** `grep -n -i "<word>" packages/ui-behaviors/node_modules/@ui-sdk/core/docs/core.md | head -30`. A heading or an option that uses the word counts.
- **This package:** the folders under `packages/ui-behaviors/src/`.

If UI SDK exports something with that name and that job, stop: use UI SDK's and add nothing. If the name exists only in a private file of UI SDK's, it is taken all the same.

### 2. Run the scenarios

Bring two to four candidates of your own, and add any the user offers. Ask in rounds, number the questions, and give your recommended answer under each, so the user can reply by number or simply agree with you.

**Round one is the cold read, and it comes before any explanation.** Show the bare names and ask what each one does. An explanation given first ruins the test.

| Scenario            | Ask                                                                                                           | It fails when                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Cold read           | "With no description, what does `<name>` do?"                                                                 | The first guess is something else                                                                                       |
| Same word elsewhere | "Where else does this word already mean something: in UI SDK, on the web platform, in the app's domain?"      | A second meaning is live for the reader. Add a qualifier or change the word                                             |
| Neighbour           | "Listed next to UI SDK's behaviours for this topic, could someone pick the wrong one?"                        | It could be mistaken for a neighbour, or a neighbour for it                                                             |
| Second use          | "Name an unrelated component that would also use this."                                                       | The name fits only the component it came from. `createLens` fits a magnifier; `createFollowPoint` also fits a spotlight |
| Search              | "Give three requests that should lead here, and three that should not."                                       | A request that should not would still match the name                                                                    |
| One sentence        | "Describe it in one line without the name's own words."                                                       | The line needs the same words, or needs a "not": "not a video player"                                                   |
| Family              | "Say the folder, `<Thing>Options`, `<Thing>Reason`, each reason string and each `data-*` attribute out loud." | One of them collides or reads as something else                                                                         |

A name passes only when it passes every row. When none does, bring new candidates and run round one again.

### 3. Close it

- End with your recommendation and ask the user to confirm it or pick another. "Yes, that one" is a choice. A scenario table with no reply is not.
- Put the rejected names and why each failed in the pull request description, so the question is not reopened.
- With nobody to ask, use the best candidate, say in your report that the name is provisional, and list the scenarios it did not clearly pass.

## Write a behaviour

- **Read state through functions, change it through `set`.** Options are `value: (state) => …` and `set: (value, { reason, event }) => boolean`. The behaviour never calls `store.set` for something a user sees, so the primitive decides what a change means and can refuse it.
- **Return what the slots call:** methods named after the event (`pointerdown(event, el)`, `keydown(event)`) and a `bind(el)` that returns a cleanup.
- **Type the context by what you use:** `Pick<PrimitiveContext<Options, State, Slot>, 'store' | 'onDestroy'>`, with the three as generics. No `any`.
- **Build on UI SDK's blocks.** A drag is `bindDrag`, a held press is `bindHold`, a repeating button is `bindRepeat`, maths is `@ui-sdk/core/number`. A second copy of one of them drifts from UI SDK's and misses its fixes.
- **No framework code and nothing at module scope that touches the DOM.** Every entry must import on a server.
- **Clean up everything:** timers, frames and listeners, through the cleanup `bind` returns and `context.onDestroy`.

## Write a primitive

Everything in UI SDK's "Define a Primitive" applies. What gets missed:

- **`sync` maps every controlled option onto state.** Without it a controlled value is silently ignored.
- **`attrs` is pure.** It runs on the server, so no DOM in it. DOM work goes in `bind`.
- **State that changes every frame goes in `live`,** written with `live()` or in `bind`, so a pointer move re-renders nothing.
- **Every user-visible change goes through `createChange`,** with a reason.
- **Controller writes take `ChangeOptions`:** `setValue(value, options?)` passes `options.reason` and `options.event` on, defaulting to `imperative`.
- **End the definition with `agent: { actions: [...] }`,** after `slots`. Add `closed` and `items` when the value is one of a set.
- **Keyboards get a way in.** Anything a pointer can do needs a part a keyboard can reach. Say in the JSDoc which parts are required.
- **No text and no styles.** Labels come from the app. The only inline styles are geometry the behaviour cannot work without.

## What every addition needs

1. **`index.ts`** with JSDoc on every export: what it is for, each option, each reason, each part, each CSS variable, and a `Story:` line with the story's path. The JSDoc ships in the types and is the API reference agents read.
2. **A story**, `<name>.stories.tsx`, for anything a person can see or touch: the least code that shows it working, with its data in the same file. Stories ship with the package and are what agents in apps read as the example, so no helper files and nothing that is not needed. A behaviour's story builds something other than the primitive that uses it, to show it composes. Check it in a browser with `pnpm --filter @perimetre/ui-behaviors dev`. A pure function with nothing to look at gets no story: its test is its example.
3. **A test**, `<name>.test.ts`, written the way UI SDK's `references/testing.md` says. Follow it for the tools and for "Break it on purpose", which is not optional. What differs here:
   - **The runner is `bun test` with happy-dom,** where UI SDK's guide uses Vitest and jsdom. `test/setup.ts` registers the DOM and sets `__UI_SDK_STRICT__`, so a UI SDK development warning fails the test. Its jsdom stubs are not needed.
   - **Few tests:** one per thing a person relies on, named for that thing. Not one per function or per branch.
   - **A behaviour is tested on its own,** through a small primitive written in the test file and `mount`. A behaviour tested only through the primitive that uses it is not tested: its pointer, timer and ownership rules never run in isolation. `src/behaviors/scrub/scrub.test.ts` is the pattern.
   - **A primitive** adds one `checkServer` test, and `checkDirection` when a key or a drag depends on reading direction. Run `checkPattern` when the primitive is one of the WAI-ARIA patterns UI SDK lists. Add the primitive to `src/primitives/agent.test.ts`: UI SDK's bridge lists primitive instances only, so a behaviour, a utility and `Icon` have nothing for it to find.
   - **A utility** is tested as a plain function.
   - **Time is waited for, not guessed.** Frames and timers in happy-dom do not keep a browser's pace, so wait until a condition holds, as `src/behaviors/auto-progress/auto-progress.test.ts` does, and never for a fixed number of milliseconds.
   - **Code that only drives a third-party SDK,** like `behaviors/google-map`, gets a story checked against the live service and no test. A test against a fake of that SDK tests the fake.
4. **No export to add.** The folder with an `index.ts` is the entry. Inside the package, import another folder by its full relative path, `'../../behaviors/scrub/index.js'`: the built files must resolve in plain Node, which refuses a directory import.
5. **The shipped skill**, `packages/ui-behaviors/skills/ui-behaviors/`: the entries table in `SKILL.md`, and the catalogue in `references/behaviors.md` or `references/primitives.md`.
6. **The story list** in `docs/llms.txt`. The README is for people and lists what to ask for, not exports: change it only when the addition is something new to ask for.
7. **`packages/ui/docs/migrating-to-ui-behaviors.md`** when it replaces something from `@perimetre/ui`. The link goes one way: `@perimetre/ui` points here, and nothing under `packages/ui-behaviors` mentions `@perimetre/ui`, `@perimetre/icons`, `@perimetre/classnames` or `@perimetre/tokens`.
8. **`docs/updating-ui-sdk.md`** when it uses a UI SDK function not yet in that table, with whether UI SDK marks it experimental.
9. **A changeset** for `@perimetre/ui-behaviors`: minor for an addition, major for a changed or removed export.

## Before you finish

```bash
pnpm turbo run build lint typecheck test --filter=@perimetre/ui-behaviors
```

- [ ] The pipeline passes, and no lint or type rule was silenced to get there
- [ ] The story works in a browser: mouse, keyboard, and touch where it applies
- [ ] No file has a `"use client"` directive: `grep -rlE "^['\"]use client" packages/ui-behaviors/src` finds nothing
- [ ] React is imported only in `*.stories.tsx`, `*.test.tsx` and `src/react/icon/`
- [ ] `npm pack --dry-run` in the package lists the story and no test
- [ ] The shipped skill, `docs/llms.txt` and the JSDoc all name the new export
- [ ] The user chose the name after the scenarios, and the pull request lists the names that failed
- [ ] A changeset is added

Say in your report what you could not check, such as a real phone or a screen reader.

## Maintaining

- **UI SDK moved on:** follow `packages/ui-behaviors/docs/updating-ui-sdk.md`. The version is pinned exactly, and changing it is a breaking release.
- **UI SDK now ships something that is here:** remove it from here in a major release, and say what replaces it in the changeset.
- **A bug in a behaviour:** write the failing test first, beside the behaviour.
- **Someone asks for a shared component:** build it in their app from a primitive. If the logic is new and a second project needs it, add the behaviour here and let each app render its own component.
