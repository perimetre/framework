import { bindHold, type PrimitiveContext } from '@ui-sdk/core';
import { clamp } from '@ui-sdk/core/number';

/** A point on a surface, as fractions from 0 to 1 from its top left corner. */
export type FollowPoint = {
  x: number;
  y: number;
};

/** How `createFollowPoint` reads and changes its state. */
export type FollowPointOptions<State extends object> = {
  /** Reads whether the point is being followed, like `(state) => state.active`. */
  active: (state: State) => boolean;
  /** Whether nothing can start following the point. */
  disabled?: () => boolean;
  /**
   * How long a finger rests on the surface before the point follows it, in
   * milliseconds. A swipe that starts sooner scrolls the page as usual.
   * @default 250
   */
  holdDelay?: () => number;
  /** Reads the point from state, like `(state) => ({ x: state.x, y: state.y })`. */
  point: (state: State) => FollowPoint;
  /**
   * Asks to start or stop following and returns whether it went through.
   * Pass the primitive's change:
   * `setActive: (active, details) => change("active", active, details)`.
   */
  setActive: (
    active: boolean,
    details: { event?: Event; reason: FollowPointReason }
  ) => boolean;
  /**
   * Writes the point. It changes on every pointer move, so keep its keys in
   * the primitive's `live` and write them with `store.set`.
   */
  setPoint: (point: FollowPoint) => void;
  /**
   * How far an arrow key moves the point, as a fraction of the surface.
   * @default 0.05
   */
  step?: () => number;
};

/**
 * Why the point started or stopped being followed.
 *
 * - `trigger-hover`: a mouse or pen moved onto the surface, or left it.
 * - `trigger-press`: the trigger was pressed, or a finger was held on the
 *   surface.
 * - `trigger-release`: the finger lifted.
 * - `escape-key`: Escape on the trigger.
 * - `focus-out`: focus left the trigger while it was what showed the point.
 * - `imperative`: a call from code.
 */
export type FollowPointReason =
  | 'escape-key'
  | 'focus-out'
  | 'imperative'
  | 'trigger-hover'
  | 'trigger-press'
  | 'trigger-release';

const DEFAULT_HOLD_DELAY = 250;
const DEFAULT_STEP = 0.05;

/**
 * Where a pointer is on an element, as fractions from 0 to 1.
 * @param el - The surface
 * @param event - The pointer event
 */
const pointOn = (el: HTMLElement, event: PointerEvent): FollowPoint => {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.width ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0.5,
    y: rect.height ? clamp((event.clientY - rect.top) / rect.height, 0, 1) : 0.5
  };
};

/**
 * Follows a point on a surface, for a lens, a spotlight, a crosshair or
 * anything else drawn under the pointer. Three inputs reach the same point:
 *
 * - A mouse or pen: the point follows it while it is over the surface.
 * - A finger: holding it still starts following; a swipe scrolls as usual.
 * - A keyboard: a trigger starts following, arrow keys move the point and
 *   Escape stops.
 *
 * Whatever started following is the only thing that stops or moves it, so a
 * mouse passing over the surface never hides or moves what the keyboard
 * showed. A point that was already showing goes to the first input that asks.
 *
 * Call it once in `api`, keep it on the api, and wire the surface and the
 * trigger:
 *
 * ```ts
 * surface: slot({
 *   on: {
 *     pointerenter: (event, { api, el }) => el && api.follow.pointerenter(event, el),
 *     pointermove: (event, { api, el }) => el && api.follow.pointermove(event, el),
 *     pointerleave: (event, { api }) => api.follow.pointerleave(event),
 *   },
 *   bind: (el, part) => part.api.follow.bind(el),
 * }),
 * trigger: slot({
 *   press: ({ api }, event) => api.follow.toggle(event),
 *   on: {
 *     keydown: (event, { api }) => api.follow.keydown(event),
 *     blur: (event, { api }) => api.follow.blur(event),
 *   },
 * }),
 * ```
 *
 * Story: `src/behaviors/follow-point/follow-point.stories.tsx`, shipped with the package, shows
 * a light that follows the pointer.
 * @param context - The primitive's context, from `api`
 * @param options - How to read and change the state
 */
export const createFollowPoint = <
  Options,
  State extends object,
  Slot extends string
>(
  context: Pick<PrimitiveContext<Options, State, Slot>, 'store'>,
  options: FollowPointOptions<State>
) => {
  /** What started following, so only the same input stops it. */
  let startedBy: 'hover' | 'touch' | 'trigger' | null = null;

  /** Whether the point is being followed now. */
  const isActive = () => options.active(context.store.get());

  /**
   * Moves the point, kept inside the surface.
   * @param x - Across, from 0 to 1
   * @param y - Down, from 0 to 1
   */
  const moveTo = (x: number, y: number) => {
    options.setPoint({ x: clamp(x, 0, 1), y: clamp(y, 0, 1) });
  };

  /**
   * Asks to start following.
   * @param by - The input asking
   * @param reason - Why, for the change callback
   * @param event - The DOM event behind it
   */
  const start = (
    by: 'hover' | 'touch' | 'trigger',
    reason: FollowPointReason,
    event?: Event
  ) => {
    if (options.disabled?.()) return false;
    if (isActive()) {
      // Whatever started it keeps it. A point that was already showing, like
      // one set by the app, goes to the first input that asks.
      startedBy ??= by;
      return true;
    }
    const started = options.setActive(true, { event, reason });
    if (started) startedBy = by;
    return started;
  };

  /**
   * Asks to stop following.
   * @param reason - Why, for the change callback
   * @param event - The DOM event behind it
   */
  const stop = (reason: FollowPointReason, event?: Event) => {
    if (!isActive()) {
      startedBy = null;
      return true;
    }
    const stopped = options.setActive(false, { event, reason });
    if (stopped) startedBy = null;
    return stopped;
  };

  return {
    /**
     * Binds the surface: a finger held on it starts following, and moving
     * that finger no longer scrolls the page. Call it from the surface
     * slot's `bind` and return its cleanup.
     * @param el - The surface
     */
    bind: (el: HTMLElement) => {
      let pressedAt: FollowPoint | undefined;

      const unbindHold = bindHold(el, {
        delay: options.holdDelay?.() ?? DEFAULT_HOLD_DELAY,
        /** Whether a finger can start following. */
        disabled: () => options.disabled?.() ?? false,
        // Keys belong to the trigger.
        keys: [],
        /** The finger lifted, or the browser took the touch over to scroll. */
        onEnd: ({ event }) => {
          pressedAt = undefined;
          if (startedBy === 'touch') stop('trigger-release', event);
        },
        /** The finger rested long enough. */
        onHold: ({ event }) => {
          if (pressedAt) moveTo(pressedAt.x, pressedAt.y);
          start('touch', 'trigger-press', event);
        },
        /** Only a finger holds; a mouse and a pen hover. */
        onPress: ({ event, input }) => {
          if (input !== 'touch' || !(event instanceof PointerEvent)) {
            return false;
          }
          pressedAt = pointOn(el, event);
          return true;
        }
      });

      /**
       * Only a non-passive listener can keep a held finger from scrolling
       * the page, so it is added here and not through a slot's `on`.
       * @param event - The touchmove event
       */
      const touchMove = (event: TouchEvent) => {
        if (startedBy === 'touch' && isActive()) event.preventDefault();
      };
      el.addEventListener('touchmove', touchMove, { passive: false });

      return () => {
        unbindHold();
        el.removeEventListener('touchmove', touchMove);
      };
    },
    /**
     * Focus left the trigger. Stops following when the trigger started it.
     * @param event - The blur event
     */
    blur: (event: FocusEvent) => {
      if (startedBy === 'trigger') stop('focus-out', event);
    },
    /**
     * Handles a key on the trigger and returns whether it did. Arrow keys
     * move the point and Escape stops following.
     * @param event - The keydown event
     */
    keydown: (event: KeyboardEvent) => {
      if (!isActive()) return false;

      if (event.key === 'Escape') {
        event.preventDefault();
        stop('escape-key', event);
        return true;
      }

      const step = options.step?.() ?? DEFAULT_STEP;
      const moves: Partial<Record<string, [number, number]>> = {
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step]
      };
      const move = moves[event.key];
      if (!move) return false;

      // Keeps the page from scrolling under the point.
      event.preventDefault();
      const { x, y } = options.point(context.store.get());
      moveTo(x + move[0], y + move[1]);
      return true;
    },
    moveTo,
    /**
     * A mouse or pen moved onto the surface.
     * @param event - The pointerenter event
     * @param el - The surface
     */
    pointerenter: (event: PointerEvent, el: HTMLElement) => {
      if (event.pointerType === 'touch') return;
      // Another input is showing the point. The mouse leaves it where it is.
      if (isActive() && startedBy && startedBy !== 'hover') return;
      const point = pointOn(el, event);
      moveTo(point.x, point.y);
      start('hover', 'trigger-hover', event);
    },
    /**
     * A mouse or pen left the surface.
     * @param event - The pointerleave event
     */
    pointerleave: (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (startedBy === 'hover') stop('trigger-hover', event);
    },
    /**
     * A pointer moved over the surface. The point follows it while the same
     * kind of pointer is what started following.
     * @param event - The pointermove event
     * @param el - The surface
     */
    pointermove: (event: PointerEvent, el: HTMLElement) => {
      const touch = event.pointerType === 'touch';
      if (touch ? startedBy !== 'touch' : startedBy !== 'hover') return;
      const point = pointOn(el, event);
      moveTo(point.x, point.y);
    },
    /**
     * Starts or stops following from code, like a controller's `setActive`.
     * @param active - Whether to follow the point
     * @param details - The reason and event for the change callback
     * @param details.event - The DOM event behind the call
     * @param details.reason - Why; `imperative` when left out
     */
    setActive: (
      active: boolean,
      details?: { event?: Event; reason?: FollowPointReason }
    ) =>
      active
        ? start('trigger', details?.reason ?? 'imperative', details?.event)
        : stop(details?.reason ?? 'imperative', details?.event),
    /**
     * The trigger was pressed. Starts from the centre, since no pointer says
     * where to look.
     * @param event - The click event
     */
    toggle: (event?: Event) => {
      if (isActive()) return stop('trigger-press', event);
      moveTo(0.5, 0.5);
      return start('trigger', 'trigger-press', event);
    }
  };
};

/** What `createFollowPoint` returns. */
export type FollowPointBehavior = ReturnType<typeof createFollowPoint>;
