# @perimetre/icons

## 0.0.4

### Patch Changes

- cd5bb0b: Deprecation notice in each README. No code changes: all four packages keep working for the apps that install them, and get nothing new.
  - `@perimetre/ui`: apps own their components now, built from UI SDK and `@perimetre/ui-behaviors`.
  - `@perimetre/icons`: use `Icon` from `@perimetre/ui-behaviors/react/icon`.
  - `@perimetre/classnames`: use the `cn` package directly (`cn` from `cn`, `createCn` from `cn/config`).
  - `@perimetre/tokens`: each app defines its own design tokens, in its own stylesheet. Components still read tokens; only the shared package goes.

  `@perimetre/ui` now ships `docs/migrating-to-ui-behaviors.md`, which lists what each of its components becomes.

## 0.0.3

### Patch Changes

- 6b4d7e9: Update package versions

## 0.0.2

### Patch Changes

- 94bf27b: Updates packages

## 0.0.1

### Patch Changes

- d1eb185: Initial version
