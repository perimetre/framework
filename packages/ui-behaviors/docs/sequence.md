# Sequence

`@perimetre/ui-behaviors/sequence`

Moves through a dense run of frames, like a product turning or a timelapse, as one continuous progress from 0 to 1. It draws nothing: the project draws the frame for the current progress, with a canvas, an image or anything else.

For a handful of distinct stills, use UI SDK's `Carousel` with `loop`. Sequence is for motion that reads as continuous.

```tsx
import {
  Sequence,
  SequenceNext,
  SequencePlayToggle,
  SequencePrevious,
  SequenceViewport
} from '@perimetre/ui-behaviors/sequence';

<Sequence onValueChange={(value) => drawFrame(value)}>
  <SequenceViewport
    aria-label="The chair, turning"
    className="cursor-grab data-dragging:cursor-grabbing"
  >
    <canvas ref={canvas} />
  </SequenceViewport>

  <SequencePrevious aria-label="Turn left">←</SequencePrevious>
  <SequenceNext aria-label="Turn right">→</SequenceNext>
  <SequencePlayToggle>
    {(state) => (state.playing ? 'Pause' : 'Play')}
  </SequencePlayToggle>
</Sequence>;
```

Turning the progress into a frame is one line. With `loop`, the last frame is followed by the first:

```ts
const frame = Math.floor(value * frameCount) % frameCount; // loop
const frame = Math.round(value * (frameCount - 1)); // loop={false}
```

## Composition

```text
Sequence
├── SequenceViewport
│   └── (the canvas or image)
├── SequencePrevious
├── SequenceNext
└── SequencePlayToggle
```

- **`Sequence`** owns the state.
- **`SequenceViewport`** is where the frames show and what a pointer drags. Name it with `aria-label`.
- **`SequencePrevious`** and **`SequenceNext`** are required. They are the only way through the sequence for keyboards and screen readers, and a development build warns when either is missing.
- **`SequencePlayToggle`** is optional. Include it whenever the sequence can play on its own, so there is a way to stop it.

## How it is operated

| Input                   |                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Mouse, pen, touch       | Dragging sideways on the viewport moves through the frames. A vertical swipe scrolls the page as usual |
| Wheel, trackpad         | A sideways scroll over the viewport moves through the frames. A vertical one scrolls the page          |
| Keyboard, screen reader | Previous and Next step once per press, and keep stepping while held                                    |

Pressing Previous or Next stops playback. A drag holds playback still, and it carries on from there on release.

## Options

Props of `Sequence`, next to the element's own.

| Prop              | Type                         | Default              |                                                                                                             |
| ----------------- | ---------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `value`           | `number`                     |                      | The progress, from 0 to 1. Pass it to control it                                                            |
| `defaultValue`    | `number`                     | `0`                  | The progress it starts at, when uncontrolled                                                                |
| `onValueChange`   | `(value, details) => void`   |                      | Runs when the progress wants to change, on every frame of a drag or of playback. Draw here                  |
| `onValueCommit`   | `(value, details) => void`   |                      | Runs once an interaction ends. Start work here that would stutter the motion                                |
| `loop`            | `boolean`                    | `true`               | Whether past the end comes the start. Without it, the progress stops at 0 and 1                             |
| `step`            | `number`                     | `0.02`               | How far one press of Previous or Next moves, as a fraction of the sequence                                  |
| `dragDistance`    | `number`                     | The viewport's width | How far a drag travels for one full pass, in pixels                                                         |
| `inverted`        | `boolean`                    |                      | Reverses which way a drag moves. Match it to the way the frames turn                                        |
| `playing`         | `boolean`                    |                      | Whether it plays on its own. Pass it to control playback                                                    |
| `defaultPlaying`  | `boolean`                    | `false`              | Whether it starts playing. It doesn't when the user prefers reduced motion; the play toggle still starts it |
| `onPlayingChange` | `(playing, details) => void` |                      | Runs when playback wants to start or stop                                                                   |
| `duration`        | `number`                     | `4000`               | How long one full pass takes while playing, in milliseconds                                                 |
| `disabled`        | `boolean`                    |                      | Stops dragging, scrolling, and Previous and Next                                                            |
| `controller`      | `SequenceController`         |                      | From `createSequenceController()`                                                                           |

`details.reason` for the progress is one of `swipe`, `scroll`, `previous-press`, `next-press`, `playback` or `imperative`. For playback it is one of `toggle-press`, `previous-press`, `next-press`, `end`, `reduced-motion` or `imperative`.

## Controller

```tsx
import { createSequenceController } from '@perimetre/ui-behaviors/sequence';

const turntable = createSequenceController();

<Sequence controller={turntable}>…</Sequence>;

turntable.setValue(0.5);
turntable.stepBy(-3);
turntable.play();
turntable.pause();
turntable.getValue();
turntable.isPlaying();
```

## Styling

| Part                 | `data-slot`            | State                                            |
| -------------------- | ---------------------- | ------------------------------------------------ |
| `Sequence`           | `sequence`             | `data-dragging`, `data-playing`, `data-disabled` |
| `SequenceViewport`   | `sequence-viewport`    | `data-dragging`                                  |
| `SequencePrevious`   | `sequence-previous`    | `data-disabled`, `data-holding`, `data-held`     |
| `SequenceNext`       | `sequence-next`        | `data-disabled`, `data-holding`, `data-held`     |
| `SequencePlayToggle` | `sequence-play-toggle` | `data-playing`                                   |

`--sequence-progress` on `Sequence` holds the progress, from 0 to 1, written on every change without re-rendering. For example, `rotate: calc(var(--sequence-progress) * 360deg)`.

The behaviour sets `touch-action: pan-y` and `user-select: none` inline on `SequenceViewport`, because a drag cannot work without them.

## Accessibility

- The viewport is not a slider. It has `role="img"`, takes no focus and has no value to read out, so name it with `aria-label`. A drag is a shortcut for pointers, never the only way.
- Previous and Next are native buttons that give the same movement without dragging, as WCAG 2.5.7 asks. At an end, with `loop` off, they get `aria-disabled` and stay focusable, so focus is not lost on reaching it.
- Playback that was set to start does not start when the user prefers reduced motion. The play toggle is the way to pause it, as WCAG 2.2.2 asks.
- Because the viewport is one image, anything inside it is hidden from assistive tech. Do not put controls or text in it.

## Not included

- No momentum after a drag is released: the sequence stops where the pointer leaves it.
- No frame loading or drawing. The old `ImageSequence360` used `fast-image-sequence` for that; a project can still use it, driven from `onValueChange`.

## Not verified

Touch was tested with simulated pointer events in desktop Chrome, not on a phone. Reduced motion was not exercised in a browser.
