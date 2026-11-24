'use client';

import { createParts } from '@ui-sdk/react/primitive';
import { magnify } from './primitive';

const parts = createParts(magnify, {
  lens: 'div',
  'lens-content': 'div',
  root: 'div',
  trigger: 'button'
});

/**
 * The surface the pointer moves over, and the owner of the behaviour's state.
 * Give it `position: relative` so the lens can sit over it.
 *
 * Exposes `data-active` while the lens shows, and these CSS variables:
 * `--magnify-x`, `--magnify-y` (the lens centre, in pixels from the top left),
 * `--magnify-width`, `--magnify-height` (the surface size) and
 * `--magnify-scale`.
 * @example
 * <Magnify className="relative" scale={2.5}>
 *   <img alt="A red chair" src="/chair.jpg" />
 *   <MagnifyTrigger>Magnify</MagnifyTrigger>
 *   <MagnifyLens className="size-40 rounded-full bg-white">
 *     <MagnifyLensContent>
 *       <img alt="" src="/chair.jpg" />
 *     </MagnifyLensContent>
 *   </MagnifyLens>
 * </Magnify>
 */
export const Magnify = parts.Root;

/**
 * The lens. Rendered only while active and centred on the pointer. Give it a
 * size, a shape and a background; the behaviour positions it.
 */
export const MagnifyLens = parts.Lens;

/**
 * Wraps the copy of the content shown inside the lens. The behaviour sizes,
 * places and scales it; render the same content inside it as on the surface.
 */
export const MagnifyLensContent = parts.LensContent;

/**
 * A button that shows and hides the lens, for keyboards and assistive tech.
 * While the lens shows, arrow keys move it and Escape hides it. Exposes
 * `aria-pressed` and `data-active`.
 */
export const MagnifyTrigger = parts.Trigger;

export {
  createMagnifyController,
  magnify,
  type MagnifyActiveChangeReason,
  type MagnifyController,
  type MagnifyOptions
} from './primitive';
