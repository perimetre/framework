import {
  bindDrag,
  css,
  dragThreshold,
  type PrimitiveContext
} from '@ui-sdk/core';
import { clamp, wrap } from '@ui-sdk/core/number';

/** How `createScrub` reads and changes its progress. */
export type ScrubOptions<State extends object> = {
  /** Whether it can't change. */
  disabled?: () => boolean;
  /**
   * How far a drag or scroll travels for one full pass, in pixels.
   * @default the surface's width
   */
  distance?: (el: HTMLElement) => number;
  /**
   * Whether moving towards the right edge goes back through the progress and
   * not forward. Match it to the way the frames turn.
   */
  inverted?: () => boolean;
  /**
   * Whether the progress goes round: past the end comes the start. Without
   * it, the progress stops at 0 and 1.
   * @default true
   */
  loop?: () => boolean;
  /**
   * Runs once a drag is released or a scroll stops, with the progress it
   * ended on. Pass the primitive's commit:
   * `onCommit: (value, details) => commit("value", value, details)`.
   */
  onCommit?: (
    value: number,
    details: { event?: Event; reason: ScrubReason }
  ) => void;
  /** Runs when a drag starts and ends, to mark the surface while it drags. */
  onDraggingChange?: (dragging: boolean) => void;
  /**
   * Asks for a new progress and returns whether it went through. Pass the
   * primitive's change: `set: (value, details) => change("value", value, details)`.
   */
  set: (
    value: number,
    details: { event?: Event; reason: ScrubReason }
  ) => boolean;
  /** Reads the progress from state, from 0 to 1, like `(state) => state.value`. */
  value: (state: State) => number;
};

/**
 * Why a scrub changed the progress.
 *
 * - `swipe`: a finger, mouse or pen dragged across the surface.
 * - `scroll`: a sideways wheel or trackpad scroll over the surface.
 */
export type ScrubReason = 'scroll' | 'swipe';

/** How long after the last wheel event a scroll counts as finished, in milliseconds. */
const SCROLL_IDLE = 150;

/**
 * Brings a progress back into range: round the loop, or stopped at the ends.
 * @param value - The progress asked for
 * @param loop - Whether the progress goes round
 */
export const normalizeProgress = (value: number, loop: boolean) => {
  if (!Number.isFinite(value)) return 0;
  if (!loop) return clamp(value, 0, 1);
  const wrapped = wrap(value, 0, 1);
  // Float noise can leave a hair under 1, which is the same frame as 0.
  return wrapped > 1 - 1e-9 ? 0 : wrapped;
};

/**
 * Turns a sideways drag or scroll over a surface into a progress from 0 to 1,
 * for a product that turns, a timelapse, a before and after, or any dense run
 * of frames. A vertical swipe still scrolls the page, and Escape puts a drag
 * back where it started.
 *
 * It has no keyboard of its own: pair it with buttons that step the same
 * value, like `bindRepeat` on a Previous and a Next.
 *
 * Call it once in `api`, keep it on the api, and wire the surface:
 *
 * ```ts
 * viewport: slot({
 *   attrs: (_state, { api }) => ({ style: api.scrub.surfaceStyle() }),
 *   on: {
 *     pointerdown: (event, { api, el }) => el && api.scrub.pointerdown(event, el),
 *   },
 *   bind: (el, part) => part.api.scrub.bind(el),
 * }),
 * ```
 *
 * Story: `src/behaviors/scrub/scrub.stories.tsx`, shipped with the package, shows
 * a before and after divider.
 * @param context - The primitive's context, from `api`
 * @param options - How to read and change the progress
 */
export const createScrub = <Options, State extends object, Slot extends string>(
  context: Pick<PrimitiveContext<Options, State, Slot>, 'onDestroy' | 'store'>,
  options: ScrubOptions<State>
) => {
  let stopDrag: (() => void) | undefined;
  let dragging = false;
  let scrollTimer: ReturnType<typeof setTimeout> | undefined;
  /**
   * The progress the current interaction last asked for. A controlled value
   * reaches the state only after the app renders, so a commit reports this.
   */
  let asked: number | undefined;

  /** The progress now. */
  const current = () => options.value(context.store.get());

  /** 1 when moving right goes forward, -1 when it goes back. */
  const sign = () => (options.inverted?.() ? -1 : 1);

  /**
   * How far a drag or scroll travels for one full pass, in pixels.
   * @param el - The surface
   */
  const passDistance = (el: HTMLElement) =>
    options.distance?.(el) ?? (el.clientWidth || 1);

  /**
   * Asks to move to a progress.
   * @param value - The progress asked for, before wrapping or clamping
   * @param reason - Why, for the change callback
   * @param event - The DOM event behind it
   */
  const moveTo = (value: number, reason: ScrubReason, event?: Event) => {
    const next = normalizeProgress(value, options.loop?.() ?? true);
    if (next === (asked ?? current())) return;
    asked = next;
    options.set(next, { event, reason });
  };

  /**
   * Reports where an interaction left the progress.
   * @param reason - What the interaction was
   * @param event - The DOM event that ended it
   */
  const settle = (reason: ScrubReason, event?: Event) => {
    options.onCommit?.(asked ?? current(), { event, reason });
    asked = undefined;
  };

  /**
   * Marks a drag as started or ended.
   * @param next - Whether a drag is under way
   */
  const setDragging = (next: boolean) => {
    if (dragging === next) return;
    dragging = next;
    options.onDraggingChange?.(next);
  };

  context.onDestroy(() => {
    stopDrag?.();
    clearTimeout(scrollTimer);
  });

  return {
    /**
     * Binds the surface: a sideways wheel or trackpad scroll moves the
     * progress. Call it from the surface slot's `bind` and return its cleanup.
     * @param el - The surface
     */
    bind: (el: HTMLElement) => {
      /**
       * Only a non-passive listener can keep a sideways scroll from also
       * going back or forward in the browser's history, so it is added here
       * and not through a slot's `on`.
       * @param event - The wheel event
       */
      const wheel = (event: WheelEvent) => {
        if (options.disabled?.()) return;
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        // A finger moving right scrolls with a negative delta, so the sign
        // is flipped to match a drag the same way.
        moveTo(
          (asked ?? current()) - (sign() * event.deltaX) / passDistance(el),
          'scroll',
          event
        );
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          settle('scroll', event);
        }, SCROLL_IDLE);
      };

      /**
       * Keeps a mouse drag from picking up an image as a file.
       * @param event - The dragstart event
       */
      const dragStart = (event: DragEvent) => {
        event.preventDefault();
      };

      el.addEventListener('wheel', wheel, { passive: false });
      el.addEventListener('dragstart', dragStart);

      return () => {
        el.removeEventListener('wheel', wheel);
        el.removeEventListener('dragstart', dragStart);
      };
    },
    /** Whether a drag is under way. */
    dragging: () => dragging,
    /**
     * Follows the pointer that pressed the surface until it lifts. Call it
     * from the surface's `pointerdown`.
     * @param event - The pointerdown event
     * @param el - The surface
     */
    pointerdown: (event: PointerEvent, el: HTMLElement) => {
      if (options.disabled?.()) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const startValue = current();
      const startX = event.clientX;
      stopDrag?.();
      stopDrag = bindDrag(el, event, {
        cancelOnEscape: true,
        /** The pointer lifted, Escape was pressed, or the browser took over. */
        onEnd: (end, canceled) => {
          stopDrag = undefined;
          if (!dragging) return;
          setDragging(false);
          if (canceled) moveTo(startValue, 'swipe', end);
          settle('swipe', end);
        },
        /** The progress follows the pointer. */
        onMove: (sample) => {
          moveTo(
            startValue +
              (sign() * (sample.event.clientX - startX)) / passDistance(el),
            'swipe',
            sample.event
          );
        },
        /** The press moved far enough to count as a drag. */
        onStart: () => {
          setDragging(true);
        },
        threshold: dragThreshold
      });
    },
    /**
     * The surface's `style` attribute: a vertical swipe scrolls the page
     * while a sideways one drags, and a drag selects nothing under it.
     */
    surfaceStyle: () =>
      css({
        'touch-action': 'pan-y',
        'user-select': 'none',
        '-webkit-user-select': 'none'
      })
  };
};

/** What `createScrub` returns. */
export type ScrubBehavior = ReturnType<typeof createScrub>;
