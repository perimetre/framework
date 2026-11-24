import {
  type ChangeDetails,
  createChange,
  createController,
  css,
  definePrimitive
} from '@ui-sdk/core';

/**
 * Why the lens showed or hid.
 *
 * - `trigger-hover`: a mouse or pen moved onto the surface, or left it.
 * - `trigger-press`: the trigger button was pressed, or a finger was held on
 *   the surface.
 * - `trigger-release`: the finger lifted.
 * - `escape-key`: Escape on the trigger.
 * - `focus-out`: focus left the trigger while it had shown the lens.
 * - `imperative`: a controller call.
 */
export type MagnifyActiveChangeReason =
  | 'escape-key'
  | 'focus-out'
  | 'imperative'
  | 'trigger-hover'
  | 'trigger-press'
  | 'trigger-release';

export type MagnifyController = {
  /** Whether the lens is showing. */
  isActive: () => boolean;
  /**
   * Moves the lens to a point on the surface, as fractions from 0 to 1.
   * @param x - Across, 0 at the start edge
   * @param y - Down, 0 at the top edge
   */
  moveTo: (x: number, y: number) => void;
  /** Shows or hides the lens. */
  setActive: (active: boolean) => void;
};

export type MagnifyOptions = {
  /** Whether the lens is showing. Pass it to control it. */
  active?: boolean;
  /** Shows and moves the lens from anywhere. Create one with `createMagnifyController()`. */
  controller?: MagnifyController;
  /** Whether the lens starts showing, when uncontrolled. */
  defaultActive?: boolean;
  /** Stops every way of showing the lens. */
  disabled?: boolean;
  /**
   * How long a finger rests on the surface before the lens shows, in
   * milliseconds. A swipe that starts sooner scrolls the page as usual.
   * @default 250
   */
  holdDelay?: number;
  /**
   * Runs when the lens wants to show or hide. `details.reason` says why, and
   * `details.cancel()` stops it.
   */
  onActiveChange?: (
    active: boolean,
    details: ChangeDetails<MagnifyActiveChangeReason>
  ) => void;
  /**
   * How much larger the lens shows the content.
   * @default 2
   */
  scale?: number;
  /**
   * How far an arrow key on the trigger moves the lens, as a fraction of the
   * surface from 0 to 1.
   * @default 0.05
   */
  step?: number;
};

type MagnifyState = {
  active: boolean;
  /** How much larger the lens shows the content. */
  scale: number;
  /** Across the surface, from 0 to 1. */
  x: number;
  /** Down the surface, from 0 to 1. */
  y: number;
};

const DEFAULT_SCALE = 2;
const DEFAULT_HOLD_DELAY = 250;
const DEFAULT_STEP = 0.05;

/**
 * Keeps a fraction between 0 and 1.
 * @param value - The fraction to clamp
 */
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A length in pixels, rounded to two decimals so float noise stays out of the
 * CSS variables.
 * @param value - The length in pixels
 */
const px = (value: number) => `${String(Math.round(value * 100) / 100)}px`;

/**
 * Where a pointer is on an element, as fractions from 0 to 1.
 * @param el - The surface
 * @param event - The pointer event
 */
const pointOn = (el: HTMLElement, event: PointerEvent) => {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.width ? clamp((event.clientX - rect.left) / rect.width) : 0.5,
    y: rect.height ? clamp((event.clientY - rect.top) / rect.height) : 0.5
  };
};

/**
 * Creates a handle that shows, hides and moves a `Magnify` from outside it.
 * Pass it to the component's `controller` option.
 */
export const createMagnifyController = () =>
  createController<MagnifyController>();

/**
 * A lens that magnifies whatever is on a surface, under the pointer.
 *
 * - Mouse and pen: the lens follows the pointer while it is over the surface.
 * - Touch: holding a finger still shows the lens; a swipe scrolls as usual.
 * - Keyboard: the trigger button shows the lens, arrow keys move it, Escape
 *   hides it.
 *
 * The lens position is `live` state, written straight to CSS variables on the
 * root, so moving the pointer never re-renders a part.
 */
export const magnify = definePrimitive({
  name: 'magnify',
  options: {
    active: 'boolean',
    controller: 'value',
    defaultActive: 'boolean',
    disabled: 'boolean',
    holdDelay: 'number',
    onActiveChange: 'callback',
    scale: 'number',
    step: 'number'
  },
  controlled: ['active'],
  live: ['x', 'y'],
  /** The starting state, from the first options. */
  state: (options: MagnifyOptions): MagnifyState => ({
    active: options.active ?? options.defaultActive ?? false,
    scale: options.scale ?? DEFAULT_SCALE,
    x: 0.5,
    y: 0.5
  }),
  /** Keeps `scale`, and `active` when it is controlled, in step with the options. */
  sync: (options) => ({
    scale: options.scale ?? DEFAULT_SCALE,
    ...(options.active === undefined ? {} : { active: options.active })
  }),
  /** Runs once per instance and returns what the parts and a controller call. */
  api: (context) => {
    const change = createChange(context);

    /** What last showed the lens, so only the same input hides it again. */
    let shownBy: 'hover' | 'touch' | 'trigger' | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    /** Cancels a finger hold that has not shown the lens yet. */
    const clearHold = () => {
      clearTimeout(holdTimer);
      holdTimer = undefined;
    };

    context.onDestroy(clearHold);

    /**
     * Moves the lens to a point on the surface.
     * @param x - Across, from 0 to 1
     * @param y - Down, from 0 to 1
     */
    const moveTo = (x: number, y: number) => {
      context.store.set({ x: clamp(x), y: clamp(y) });
    };

    /**
     * Asks to show the lens.
     * @param by - The input asking
     * @param reason - Why, for `onActiveChange`
     * @param event - The DOM event behind it
     */
    const show = (
      by: 'hover' | 'touch' | 'trigger',
      reason: MagnifyActiveChangeReason,
      event?: Event
    ) => {
      if (context.options().disabled) return;
      shownBy = by;
      change('active', true, { reason, event });
    };

    /**
     * Asks to hide the lens.
     * @param reason - Why, for `onActiveChange`
     * @param event - The DOM event behind it
     */
    const hide = (reason: MagnifyActiveChangeReason, event?: Event) => {
      shownBy = null;
      change('active', false, { reason, event });
    };

    return {
      /** Whether the lens is showing. */
      isActive: () => context.store.get().active,
      /**
       * Arrow keys and Escape on the trigger.
       * @param event - The keydown event
       */
      keydown: (event: KeyboardEvent) => {
        const { active, x, y } = context.store.get();
        if (!active) return;

        if (event.key === 'Escape') {
          event.preventDefault();
          hide('escape-key', event);
          return;
        }

        const step = context.options().step ?? DEFAULT_STEP;
        const moves: Record<string, [number, number]> = {
          ArrowDown: [0, step],
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step]
        };
        const move = moves[event.key];
        if (!move) return;

        // Keep the page from scrolling under the lens.
        event.preventDefault();
        moveTo(x + move[0], y + move[1]);
      },
      moveTo,
      /**
       * A pointer went down on the surface. A finger starts a hold.
       * @param el - The surface
       * @param event - The pointerdown event
       */
      pointerDown: (el: HTMLElement, event: PointerEvent) => {
        if (event.pointerType !== 'touch') return;
        clearHold();
        const point = pointOn(el, event);
        holdTimer = setTimeout(() => {
          holdTimer = undefined;
          moveTo(point.x, point.y);
          show('touch', 'trigger-press', event);
        }, context.options().holdDelay ?? DEFAULT_HOLD_DELAY);
      },
      /**
       * A mouse or pen moved onto the surface.
       * @param el - The surface
       * @param event - The pointerenter event
       */
      pointerEnter: (el: HTMLElement, event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        const point = pointOn(el, event);
        moveTo(point.x, point.y);
        show('hover', 'trigger-hover', event);
      },
      /**
       * A mouse or pen left the surface.
       * @param event - The pointerleave event
       */
      pointerLeave: (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        if (shownBy === 'hover') hide('trigger-hover', event);
      },
      /**
       * A pointer moved over the surface. The lens follows it while the same
       * kind of pointer is what showed it.
       * @param el - The surface
       * @param event - The pointermove event
       */
      pointerMove: (el: HTMLElement, event: PointerEvent) => {
        const touch = event.pointerType === 'touch';
        if (touch ? shownBy !== 'touch' : shownBy !== 'hover') return;
        const point = pointOn(el, event);
        moveTo(point.x, point.y);
      },
      /**
       * The finger lifted, or the browser took the touch over to scroll.
       * @param event - The pointerup or pointercancel event
       */
      pointerUp: (event: PointerEvent) => {
        if (event.pointerType !== 'touch') return;
        clearHold();
        if (shownBy === 'touch') hide('trigger-release', event);
      },
      /**
       * Shows or hides the lens from code.
       * @param active - Whether the lens should show
       */
      setActive: (active: boolean) => {
        if (active) show('trigger', 'imperative');
        else hide('imperative');
      },
      /** Whether a finger is holding the lens, so the page must not scroll. */
      touching: () => shownBy === 'touch' || holdTimer !== undefined,
      /**
       * The trigger button was pressed.
       * @param event - The click event
       */
      toggle: (event?: Event) => {
        if (context.store.get().active) {
          hide('trigger-press', event);
          return;
        }
        // No pointer says where to look, so start from the centre.
        moveTo(0.5, 0.5);
        show('trigger', 'trigger-press', event);
      },
      /**
       * Focus left the trigger.
       * @param event - The blur event
       */
      triggerBlur: (event: FocusEvent) => {
        if (shownBy === 'trigger') hide('focus-out', event);
      }
    };
  },
  /** The parts: root, trigger, lens and lens content. */
  slots: (slot) => ({
    /**
     * The magnified copy of the content. It is the size of the root, placed so
     * the point under the lens sits at the lens's centre, then scaled around
     * that point.
     */
    'lens-content': slot({
      /** Sizes, places and scales the copy from the CSS variables on the root. */
      attrs: () => ({
        style: css({
          height: 'var(--magnify-height)',
          left: 'calc(50% - var(--magnify-x))',
          position: 'absolute',
          scale: 'var(--magnify-scale)',
          top: 'calc(50% - var(--magnify-y))',
          'transform-origin': 'var(--magnify-x) var(--magnify-y)',
          width: 'var(--magnify-width)'
        })
      })
    }),
    /**
     * The lens. Present only while active, centred on the pointer. It holds a
     * copy of the content, so it is hidden from assistive tech and inert.
     */
    lens: slot({
      /** The lens exists only while active. */
      present: (state) => state.active,
      /** Hides the copy from assistive tech and centres the lens on the pointer. */
      attrs: () => ({
        'aria-hidden': 'true',
        inert: '',
        style: css({
          left: 'var(--magnify-x)',
          overflow: 'hidden',
          'pointer-events': 'none',
          position: 'absolute',
          top: 'var(--magnify-y)',
          translate: '-50% -50%'
        })
      })
    }),
    /** The surface the pointer moves over. Give it `position: relative`. */
    root: slot<object, { active: boolean }>({
      /** What the root's render functions and class names can read. */
      state: (state) => ({ active: state.active }),
      /** Marks the active state and gives the root the id the trigger points at. */
      attrs: (state, part) => ({
        'data-active': state.active ? '' : undefined,
        id: part.id
      }),
      on: {
        /** A long press on an image opens the browser's menu; not while a finger holds the lens. */
        contextmenu: (event, { api }) => {
          if (api.touching()) event.preventDefault();
        },
        /** The browser took the touch over, usually to scroll. */
        pointercancel: (event, { api }) => {
          api.pointerUp(event);
        },
        /** A finger starts a hold. */
        pointerdown: (event, { api, el }) => {
          if (el) api.pointerDown(el, event);
        },
        /** A mouse or pen shows the lens. */
        pointerenter: (event, { api, el }) => {
          if (el) api.pointerEnter(el, event);
        },
        /** A mouse or pen hides the lens. */
        pointerleave: (event, { api }) => {
          api.pointerLeave(event);
        },
        /** The lens follows the pointer. */
        pointermove: (event, { api, el }) => {
          if (el) api.pointerMove(el, event);
        },
        /** The finger lifted. */
        pointerup: (event, { api }) => {
          api.pointerUp(event);
        }
      },
      /** Client only: writes the CSS variables and keeps a held touch from scrolling. */
      bind: (el, part) => {
        /** Writes the lens position and the surface size as CSS variables. */
        const write = () => {
          const { scale, x, y } = part.store.get();
          el.style.setProperty('--magnify-x', px(x * el.clientWidth));
          el.style.setProperty('--magnify-y', px(y * el.clientHeight));
          el.style.setProperty('--magnify-width', px(el.clientWidth));
          el.style.setProperty('--magnify-height', px(el.clientHeight));
          el.style.setProperty('--magnify-scale', String(scale));
        };

        write();
        const unsubscribe = part.store.subscribe(write);
        const resize = new ResizeObserver(write);
        resize.observe(el);

        /**
         * Once a finger holds the lens, moving it must not scroll the page.
         * Only a non-passive listener can prevent that, so it is added here
         * and not through `on`.
         * @param event - The touchmove event
         */
        const touchMove = (event: TouchEvent) => {
          if (part.store.get().active && part.api.touching()) {
            event.preventDefault();
          }
        };
        el.addEventListener('touchmove', touchMove, { passive: false });

        return () => {
          unsubscribe();
          resize.disconnect();
          el.removeEventListener('touchmove', touchMove);
        };
      }
    }),
    /**
     * A button that shows and hides the lens, for keyboards and assistive
     * tech. While the lens shows, arrow keys move it and Escape hides it.
     */
    trigger: slot<object, { active: boolean }>({
      /** What the trigger's render functions and class names can read. */
      state: (state) => ({ active: state.active }),
      /** A toggle button that points at the surface it controls. */
      attrs: (state, part) => ({
        'aria-controls': part.id,
        'aria-pressed': String(state.active),
        'data-active': state.active ? '' : undefined,
        type: 'button'
      }),
      /** Click, Enter or Space toggles the lens. */
      press: ({ api }, event) => {
        api.toggle(event);
      },
      on: {
        /** Leaving the trigger hides a lens it showed. */
        blur: (event, { api }) => {
          api.triggerBlur(event);
        },
        /** Arrow keys move the lens and Escape hides it. */
        keydown: (event, { api }) => {
          api.keydown(event);
        }
      }
    })
  })
});
