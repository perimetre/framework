'use client';

import { createParts } from '@ui-sdk/react/primitive';
import { sequence } from './primitive';

const parts = createParts(sequence, {
  next: 'button',
  'play-toggle': 'button',
  previous: 'button',
  root: 'div',
  viewport: 'div'
});

/**
 * Owns the sequence's state and wraps its parts. Draw the frame for the
 * current progress from `onValueChange`.
 *
 * Exposes `data-dragging`, `data-playing` and `data-disabled`, and the CSS
 * variable `--sequence-progress`, from 0 to 1.
 * @example
 * <Sequence onValueChange={(value) => drawFrame(value)}>
 *   <SequenceViewport aria-label="The chair, turning">
 *     <canvas ref={canvas} />
 *   </SequenceViewport>
 *   <SequencePrevious aria-label="Turn left" />
 *   <SequenceNext aria-label="Turn right" />
 * </Sequence>
 */
export const Sequence = parts.Root;

/**
 * Where the frames show, and what a pointer drags. Render the canvas or
 * image inside it and name it with `aria-label`: to assistive tech it is one
 * image. Exposes `data-dragging`.
 */
export const SequenceViewport = parts.Viewport;

/**
 * A button that steps back, and keeps stepping while held. Required, with
 * `SequenceNext`: they are the only way through the sequence for keyboards
 * and screen readers. Exposes `data-disabled` at the start when `loop` is
 * off.
 */
export const SequencePrevious = parts.Previous;

/**
 * A button that steps forward, and keeps stepping while held. Exposes
 * `data-disabled` at the end when `loop` is off.
 */
export const SequenceNext = parts.Next;

/**
 * A button that starts and stops playback. Label it from `playing` in its
 * state. Exposes `data-playing`.
 */
export const SequencePlayToggle = parts.PlayToggle;

export {
  createSequenceController,
  sequence,
  type SequenceController,
  type SequenceOptions,
  type SequencePlayingChangeReason,
  type SequenceValueChangeReason,
  type SequenceValueCommitReason
} from './primitive';
