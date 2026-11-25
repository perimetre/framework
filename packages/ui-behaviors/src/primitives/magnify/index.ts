import {
  type ChangeDetails,
  type ChangeOptions,
  createChange,
  createController,
  css,
  definePrimitive
} from '@ui-sdk/core';
import {
  createFollowPoint,
  type FollowPointReason
} from '../../behaviors/follow-point/index.js';

/**
 * Why the lens showed or hid. The reasons `createFollowPoint` reports, all
 * from UI SDK's shared vocabulary.
 */
export type MagnifyActiveChangeReason = FollowPointReason;

/** Options for a controller's `setActive`. */
export type MagnifyActiveOptions = ChangeOptions<MagnifyActiveChangeReason>;

export type MagnifyController = {
  /** Whether the lens is showing. */
  isActive: () => boolean;
  /**
   * Moves the lens to a point on the surface, as fractions from 0 to 1.
   * @param x - Across, 0 at the left edge
   * @param y - Down, 0 at the top edge
   */
  moveTo: (x: number, y: number) => void;
  /**
   * Shows or hides the lens.
   * @param active - Whether the lens should show
   * @param options - The reason and event passed to `onActiveChange`
   */
  setActive: (active: boolean, options?: MagnifyActiveOptions) => void;
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
   * milliseconds. A swipe that starts sooner scrolls the page as usual. Read
   * once, when the surface is bound.
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

/**
 * A length in pixels, rounded to two decimals so float noise stays out of the
 * CSS variables.
 * @param value - The length in pixels
 */
const px = (value: number) => `${String(Math.round(value * 100) / 100)}px`;

/**
 * Creates a handle that shows, hides and moves a magnify from outside it.
 * Pass it to the root's `controller` option.
 */
export const createMagnifyController = () =>
  createController<MagnifyController>();

/**
 * A lens that magnifies whatever is on a surface, under the pointer. Built
 * from `createFollowPoint`: a mouse hovers, a finger holds, and a trigger
 * button gives keyboards the same lens.
 *
 * Parts: `root` (the surface; give it `position: relative`), `trigger`,
 * `lens` (present only while active) and `lens-content` (a copy of the
 * surface's content, scaled).
 *
 * The root exposes `data-active` and the CSS variables `--magnify-x`,
 * `--magnify-y` (the lens centre, in pixels from the top left),
 * `--magnify-width`, `--magnify-height` (the surface size) and
 * `--magnify-scale`. The lens position is `live` state, so a moving pointer
 * re-renders nothing.
 *
 * Story: `src/primitives/magnify/magnify.stories.tsx`, shipped with the package, shows
 * its parts rendered in React.
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
  /** Runs once per instance and returns what the parts, a controller and an agent call. */
  api: (context) => {
    const change = createChange(context);

    const follow = createFollowPoint(context, {
      /** Whether the lens is showing. */
      active: (state) => state.active,
      /** Whether the lens can't show. */
      disabled: () => context.options().disabled ?? false,
      /** How long a finger rests before the lens shows. */
      holdDelay: () => context.options().holdDelay ?? 250,
      /** Where the lens is. */
      point: (state) => ({ x: state.x, y: state.y }),
      /** Shows or hides the lens through `onActiveChange`. */
      setActive: (active, details) => change('active', active, details),
      /** Moves the lens. Live state, so it never renders. */
      setPoint: (point) => {
        context.store.set(point);
      },
      /** How far an arrow key moves the lens. */
      step: () => context.options().step ?? 0.05
    });

    return {
      follow,
      /** Whether the lens is showing. */
      isActive: () => context.store.get().active,
      moveTo: follow.moveTo,
      /**
       * Shows or hides the lens from code.
       * @param active - Whether the lens should show
       * @param options - The reason and event passed to `onActiveChange`
       */
      setActive: (active: boolean, options?: MagnifyActiveOptions) => {
        follow.setActive(active, options);
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
        /** A mouse or pen shows the lens. */
        pointerenter: (event, { api, el }) => {
          if (el) api.follow.pointerenter(event, el);
        },
        /** A mouse or pen hides the lens. */
        pointerleave: (event, { api }) => {
          api.follow.pointerleave(event);
        },
        /** The lens follows the pointer. */
        pointermove: (event, { api, el }) => {
          if (el) api.follow.pointermove(event, el);
        }
      },
      /** Client only: binds the touch hold and writes the CSS variables. */
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
        const unbind = part.api.follow.bind(el);
        const unsubscribe = part.store.subscribe(write);
        const resize = new ResizeObserver(write);
        resize.observe(el);

        return () => {
          unbind();
          unsubscribe();
          resize.disconnect();
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
        api.follow.toggle(event);
      },
      on: {
        /** Leaving the trigger hides a lens it showed. */
        blur: (event, { api }) => {
          api.follow.blur(event);
        },
        /** Arrow keys move the lens and Escape hides it. */
        keydown: (event, { api }) => {
          api.follow.keydown(event);
        }
      }
    })
  }),
  agent: { actions: ['setActive', 'moveTo'] }
});
