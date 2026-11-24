# Magnify

`@perimetre/ui-behaviors/magnify`

```tsx
import {
  Magnify,
  MagnifyLens,
  MagnifyLensContent,
  MagnifyTrigger
} from '@perimetre/ui-behaviors/magnify';

<Magnify className="relative" scale={2.5}>
  <img alt="A red chair" src="/chair.jpg" />

  <MagnifyTrigger className="absolute right-2 bottom-2">
    {(state) => (state.active ? 'Hide magnifier' : 'Magnify')}
  </MagnifyTrigger>

  <MagnifyLens className="size-40 rounded-full bg-white shadow-lg">
    <MagnifyLensContent>
      <img alt="" src="/chair.jpg" />
    </MagnifyLensContent>
  </MagnifyLens>
</Magnify>;
```

## Composition

```text
Magnify
├── (the content to magnify)
├── MagnifyTrigger
└── MagnifyLens
    └── MagnifyLensContent
        └── (the same content again)
```

- **`Magnify`** is the surface. It must be a positioned element (`position: relative`); the behaviour does not set that for you.
- **`MagnifyLens`** is rendered only while active. Give it a size, a shape and a background. A background matters for images with transparency, or the unmagnified image shows through.
- **`MagnifyLensContent`** wraps the copy shown in the lens. Render the same content inside it as on the surface. The copy is hidden from assistive tech and inert, so give a repeated image an empty `alt`.
- **`MagnifyTrigger`** is a toggle button. Include it: it is the only way to magnify without a pointer.

## How it is operated

| Input      | Shows the lens                         | Moves it                  | Hides it                                          |
| ---------- | -------------------------------------- | ------------------------- | ------------------------------------------------- |
| Mouse, pen | Moving onto the surface                | Moving                    | Leaving the surface                               |
| Touch      | Holding a finger still for `holdDelay` | Dragging                  | Lifting the finger                                |
| Keyboard   | Enter or Space on the trigger          | Arrow keys on the trigger | Escape, the trigger again, or leaving the trigger |

A swipe that starts before `holdDelay` scrolls the page as usual. Once a finger holds the lens, dragging moves the lens and does not scroll.

## Options

Props of `Magnify`, next to the element's own.

| Prop             | Type                        | Default |                                                                   |
| ---------------- | --------------------------- | ------- | ----------------------------------------------------------------- |
| `scale`          | `number`                    | `2`     | How much larger the lens shows the content                        |
| `disabled`       | `boolean`                   |         | Stops every way of showing the lens                               |
| `holdDelay`      | `number`                    | `250`   | Milliseconds a finger rests before the lens shows                 |
| `step`           | `number`                    | `0.05`  | How far an arrow key moves the lens, as a fraction of the surface |
| `active`         | `boolean`                   |         | Whether the lens shows. Pass it to control it                     |
| `defaultActive`  | `boolean`                   | `false` | Whether the lens starts showing, when uncontrolled                |
| `onActiveChange` | `(active, details) => void` |         | Runs when the lens wants to show or hide                          |
| `controller`     | `MagnifyController`         |         | From `createMagnifyController()`                                  |

`details.reason` is one of `trigger-hover`, `trigger-press`, `trigger-release`, `escape-key`, `focus-out` or `imperative`.

## Controller

```tsx
import { createMagnifyController } from '@perimetre/ui-behaviors/magnify';

const magnifier = createMagnifyController();

<Magnify controller={magnifier}>…</Magnify>;

magnifier.setActive(true);
magnifier.moveTo(0.5, 0.25); // fractions of the surface, from 0 to 1
magnifier.isActive();
```

## Styling

| Part                 | `data-slot`            | State                         |
| -------------------- | ---------------------- | ----------------------------- |
| `Magnify`            | `magnify`              | `data-active`                 |
| `MagnifyTrigger`     | `magnify-trigger`      | `data-active`, `aria-pressed` |
| `MagnifyLens`        | `magnify-lens`         |                               |
| `MagnifyLensContent` | `magnify-lens-content` |                               |

CSS variables on `Magnify`, written as the pointer moves without re-rendering:

| Variable                              |                                                        |
| ------------------------------------- | ------------------------------------------------------ |
| `--magnify-x`, `--magnify-y`          | The lens centre, in pixels from the surface's top left |
| `--magnify-width`, `--magnify-height` | The surface's size                                     |
| `--magnify-scale`                     | The `scale` option                                     |

The behaviour sets these inline styles itself, because the lens cannot work without them. A class cannot override them:

- `MagnifyLens`: `position`, `left`, `top`, `translate`, `overflow`, `pointer-events`.
- `MagnifyLensContent`: `position`, `left`, `top`, `width`, `height`, `scale`, `transform-origin`.

## Accessibility

- The lens holds a visual copy only, so it is `aria-hidden` and `inert`. Screen readers get the surface's own content once.
- `MagnifyTrigger` is a native button with `aria-pressed`, and `aria-controls` pointing at the surface.
- Escape hides a lens shown from the trigger, and hovering lets the pointer move over the magnified area, as WCAG 1.4.13 asks of content shown on hover or focus.

## Not verified

Touch was tested with simulated pointer events in desktop Chrome, not on a phone. Controlled `active` was not exercised in a browser.
