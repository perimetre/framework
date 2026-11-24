import {
  bindRepeat,
  type ChangeDetails,
  type CommitDetails,
  createChange,
  createCommit,
  createController,
  css,
  definePrimitive
} from '@ui-sdk/core';

export type SequenceController = {
  /** The progress through the sequence, from 0 to 1. */
  getValue: () => number;
  /** Whether it is playing on its own. */
  isPlaying: () => boolean;
  /** Stops playing. */
  pause: () => void;
  /** Starts playing, even when the user prefers reduced motion. */
  play: () => void;
  /**
   * Moves to a point in the sequence.
   * @param value - The progress, from 0 to 1. With `loop` it wraps round.
   */
  setValue: (value: number) => void;
  /**
   * Moves by a number of steps, as Previous and Next do.
   * @param steps - How many steps; negative goes back
   */
  stepBy: (steps: number) => void;
};

export type SequenceOptions = {
  /** Moves and plays the sequence from anywhere. Create one with `createSequenceController()`. */
  controller?: SequenceController;
  /** Whether it starts playing, when uncontrolled. It doesn't when the user prefers reduced motion; the play toggle still starts it. */
  defaultPlaying?: boolean;
  /**
   * The progress it starts at, from 0 to 1, when uncontrolled.
   * @default 0
   */
  defaultValue?: number;
  /** Stops dragging, scrolling and the Previous and Next parts. */
  disabled?: boolean;
  /**
   * How far a drag travels for one full pass, in pixels.
   * @default the viewport's width
   */
  dragDistance?: number;
  /**
   * How long one full pass takes while playing, in milliseconds.
   * @default 4000
   */
  duration?: number;
  /**
   * Whether dragging towards the end edge moves back through the sequence
   * and not forward. Match it to the way the frames turn.
   */
  inverted?: boolean;
  /**
   * Whether the sequence goes round: past the end comes the start. Without
   * it, the progress stops at 0 and 1.
   * @default true
   */
  loop?: boolean;
  /**
   * Runs when playback wants to start or stop. `details.reason` says why, and
   * `details.cancel()` stops it.
   */
  onPlayingChange?: (
    playing: boolean,
    details: ChangeDetails<SequencePlayingChangeReason>
  ) => void;
  /**
   * Runs when the progress wants to change, on every frame of a drag or of
   * playback. Draw the frame for the new progress here. `details.reason` says
   * why, and `details.cancel()` stops it.
   */
  onValueChange?: (
    value: number,
    details: ChangeDetails<SequenceValueChangeReason>
  ) => void;
  /**
   * Runs once an interaction ends: a drag is released, a scroll stops, or a
   * held Previous or Next is let go. Start work here that would stutter the
   * motion, like loading a sharper frame.
   */
  onValueCommit?: (
    value: number,
    details: CommitDetails<SequenceValueCommitReason>
  ) => void;
  /** Whether it is playing on its own. Pass it to control playback. */
  playing?: boolean;
  /**
   * How far one press of Previous or Next moves, as a fraction of the
   * sequence from 0 to 1. Holding the button repeats it.
   * @default 0.02
   */
  step?: number;
  /** The progress through the sequence, from 0 to 1. Pass it to control it. */
  value?: number;
};

/**
 * Why playback started or stopped.
 *
 * - `toggle-press`: the play toggle was pressed.
 * - `previous-press`, `next-press`: stepping by hand stops playback.
 * - `end`: it reached the end with `loop` off.
 * - `reduced-motion`: it was set to start playing, and the user prefers
 *   reduced motion.
 * - `imperative`: a controller call.
 */
export type SequencePlayingChangeReason =
  | 'end'
  | 'imperative'
  | 'next-press'
  | 'previous-press'
  | 'reduced-motion'
  | 'toggle-press';

/**
 * Why the progress changed.
 *
 * - `swipe`: a finger, mouse or pen dragged across the viewport.
 * - `scroll`: a sideways wheel or trackpad scroll over the viewport.
 * - `previous-press`, `next-press`: the Previous or Next part, once per step
 *   while it is held.
 * - `playback`: it is playing on its own.
 * - `imperative`: a controller call.
 */
export type SequenceValueChangeReason =
  | 'imperative'
  | 'next-press'
  | 'playback'
  | 'previous-press'
  | 'scroll'
  | 'swipe';

/**
 * Why an interaction's final progress was reported. Playback never commits.
 */
export type SequenceValueCommitReason = Exclude<
  SequenceValueChangeReason,
  'playback'
>;

/** A pointer that went down on the viewport, and where the sequence was then. */
type Drag = {
  /** Whether it has moved far enough to count as a drag. */
  moved: boolean;
  pointerId: number;
  startValue: number;
  startX: number;
};

type SequenceState = {
  /** At 1 with `loop` off, so Next has nowhere to go. */
  atEnd: boolean;
  /** At 0 with `loop` off, so Previous has nowhere to go. */
  atStart: boolean;
  disabled: boolean;
  /** A pointer is dragging the viewport. */
  dragging: boolean;
  playing: boolean;
  /** The progress through the sequence, from 0 to 1. */
  value: number;
};

const DEFAULT_STEP = 0.02;
const DEFAULT_DURATION = 4000;
/** How far a pointer moves before a press becomes a drag, in pixels. */
const DRAG_THRESHOLD = 3;
/** How long after the last wheel event a scroll counts as finished, in milliseconds. */
const SCROLL_IDLE = 150;
/** The longest gap between two frames that playback makes up for, in milliseconds. */
const MAX_FRAME_GAP = 100;

declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether this is a development build, where missing parts are warned about.
 * Bundlers replace `process.env.NODE_ENV` with a literal; where nothing does
 * and `process` does not exist, reading it throws and this is not development.
 */
const isDevelopment = () => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
};

/**
 * Brings a progress back into range: round the loop, or stopped at the ends.
 * @param value - The progress asked for
 * @param loop - Whether the sequence goes round
 */
const normalise = (value: number, loop: boolean) => {
  if (!Number.isFinite(value)) return 0;
  if (!loop) return Math.min(1, Math.max(0, value));
  const wrapped = ((value % 1) + 1) % 1;
  // Float noise can leave a hair under 1, which is the same frame as 0.
  return wrapped > 1 - 1e-9 ? 0 : wrapped;
};

/**
 * Which ends the progress is at. Never at an end while looping.
 * @param value - The progress, from 0 to 1
 * @param loop - Whether the sequence goes round
 */
const endsAt = (value: number, loop: boolean) => ({
  atEnd: !loop && value >= 1,
  atStart: !loop && value <= 0
});

/**
 * Whether the user asked the system for less motion.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Creates a handle that moves and plays a `Sequence` from outside it. Pass it
 * to the component's `controller` option.
 */
export const createSequenceController = () =>
  createController<SequenceController>();

/**
 * Moves through a dense run of frames, like a product turning or a timelapse,
 * as one continuous progress from 0 to 1. It draws nothing: the project draws
 * the frame for the current progress.
 *
 * - Mouse, pen and touch: dragging sideways on the viewport moves through the
 *   frames. A vertical swipe scrolls the page as usual.
 * - Wheel and trackpad: a sideways scroll moves through the frames.
 * - Keyboard and assistive tech: the Previous and Next buttons step, and keep
 *   stepping while held. The viewport itself takes no focus.
 *
 * Modelled on a carousel, not a slider: there is no value to read out, only a
 * picture and buttons that turn it. Use a looping carousel for a handful of
 * distinct stills.
 *
 * The progress is `live` state, written straight to a CSS variable on the
 * root, so dragging never re-renders a part.
 */
export const sequence = definePrimitive({
  name: 'sequence',
  options: {
    controller: 'value',
    defaultPlaying: 'boolean',
    defaultValue: 'number',
    disabled: 'boolean',
    dragDistance: 'number',
    duration: 'number',
    inverted: 'boolean',
    loop: 'boolean',
    onPlayingChange: 'callback',
    onValueChange: 'callback',
    onValueCommit: 'callback',
    playing: 'boolean',
    step: 'number',
    value: 'number'
  },
  controlled: ['value', 'playing'],
  commits: ['value'],
  live: ['value'],
  /** The starting state, from the first options. */
  state: (options: SequenceOptions): SequenceState => {
    const loop = options.loop ?? true;
    const value = normalise(options.value ?? options.defaultValue ?? 0, loop);
    return {
      ...endsAt(value, loop),
      disabled: options.disabled ?? false,
      dragging: false,
      playing: options.playing ?? options.defaultPlaying ?? false,
      value
    };
  },
  /** Keeps `disabled`, and `value` and `playing` when controlled, in step with the options. */
  sync: (options) => {
    const loop = options.loop ?? true;
    const value =
      options.value === undefined ? undefined : normalise(options.value, loop);
    return {
      disabled: options.disabled ?? false,
      ...(value === undefined ? {} : { ...endsAt(value, loop), value }),
      ...(options.playing === undefined ? {} : { playing: options.playing })
    };
  },
  /** Runs once per instance and returns what the parts and a controller call. */
  api: (context) => {
    const change = createChange(context);
    const commit = createCommit(context);

    let drag: Drag | null = null;
    /** The pending animation frame of playback. */
    let frame: number | undefined;
    /** When the last playback frame ran. */
    let lastFrame: number | undefined;
    /** Whether a person started playback, which outranks reduced motion. */
    let startedByUser = false;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    /**
     * The progress the current interaction last asked for. A controlled value
     * reaches the state only after the app renders, so a commit reports this.
     */
    let asked: number | undefined;

    /** Whether the sequence goes round. */
    const loops = () => context.options().loop ?? true;

    /** Brings the end flags in line with the current progress. */
    const refreshEnds = () => {
      const state = context.store.get();
      const ends = endsAt(state.value, loops());
      if (ends.atEnd !== state.atEnd || ends.atStart !== state.atStart) {
        context.store.set(ends);
      }
    };

    /**
     * Asks to move to a point in the sequence.
     * @param value - The progress asked for, before wrapping or clamping
     * @param reason - Why, for `onValueChange`
     * @param event - The DOM event behind it
     */
    const moveTo = (
      value: number,
      reason: SequenceValueChangeReason,
      event?: Event
    ) => {
      const next = normalise(value, loops());
      if (next === context.store.get().value) return;
      if (reason !== 'playback') asked = next;
      change('value', next, { reason, event });
      refreshEnds();
    };

    /**
     * Reports where an interaction left the sequence.
     * @param reason - What the interaction was
     * @param event - The DOM event that ended it
     */
    const settle = (reason: SequenceValueCommitReason, event?: Event) => {
      commit('value', asked ?? context.store.get().value, { reason, event });
      asked = undefined;
    };

    /**
     * How far a drag or scroll travels for one full pass, in pixels.
     * @param el - The viewport
     */
    const passDistance = (el: HTMLElement) =>
      context.options().dragDistance ?? (el.clientWidth || 1);

    /** 1 when moving towards the end edge goes forward, -1 when it goes back. */
    const sign = () => (context.options().inverted ? -1 : 1);

    /** Stops the playback loop. */
    const stopFrames = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      lastFrame = undefined;
    };

    /**
     * Asks to start or stop playing.
     * @param playing - Whether it should play
     * @param reason - Why, for `onPlayingChange`
     * @param event - The DOM event behind it
     */
    const setPlaying = (
      playing: boolean,
      reason: SequencePlayingChangeReason,
      event?: Event
    ) => {
      if (context.store.get().playing === playing) return;
      change('playing', playing, { reason, event });
    };

    /**
     * One frame of playback: moves on by the time since the last one.
     * @param now - The frame's timestamp
     */
    const tick = (now: number) => {
      frame = undefined;
      const state = context.store.get();
      if (!state.playing) {
        lastFrame = undefined;
        return;
      }

      const elapsed =
        lastFrame === undefined ? 0 : Math.min(now - lastFrame, MAX_FRAME_GAP);
      lastFrame = now;

      // A drag holds playback still; it carries on from there on release.
      if (!drag?.moved && elapsed > 0) {
        const duration = context.options().duration ?? DEFAULT_DURATION;
        if (duration > 0) moveTo(state.value + elapsed / duration, 'playback');
      }

      if (context.store.get().atEnd) {
        setPlaying(false, 'end');
        if (!context.store.get().playing) {
          lastFrame = undefined;
          return;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    /** Starts or stops the playback loop to match the state. Client only. */
    const syncPlayback = () => {
      const { playing } = context.store.get();
      const allowed = startedByUser || !prefersReducedMotion();
      if (playing && allowed) {
        frame ??= requestAnimationFrame(tick);
      } else {
        stopFrames();
      }
    };

    /**
     * Steps back or forward, as Previous and Next do. Returns whether it can
     * step again that way.
     * @param direction - -1 for back, 1 for forward
     * @param reason - Which part asked
     * @param event - The DOM event behind it
     */
    const step = (
      direction: -1 | 1,
      reason: 'next-press' | 'previous-press',
      event?: Event
    ) => {
      const state = context.store.get();
      if (state.disabled) return false;
      if (direction === 1 ? state.atEnd : state.atStart) return false;
      // Stepping by hand takes over from playback.
      setPlaying(false, reason, event);
      moveTo(
        state.value + direction * (context.options().step ?? DEFAULT_STEP),
        reason,
        event
      );
      const after = context.store.get();
      return !(direction === 1 ? after.atEnd : after.atStart);
    };

    /**
     * Ends a drag.
     * @param event - The pointerup or pointercancel event
     */
    const endDrag = (event: PointerEvent) => {
      if (drag?.pointerId !== event.pointerId) return;
      const { moved } = drag;
      drag = null;
      if (!moved) return;
      context.store.set({ dragging: false });
      settle('swipe', event);
    };

    context.onOptions(refreshEnds);
    context.onDestroy(() => {
      stopFrames();
      clearTimeout(scrollTimer);
    });

    return {
      /**
       * Whether Previous or Next has anywhere to go.
       * @param direction - -1 for back, 1 for forward
       */
      canStep: (direction: -1 | 1) => {
        const state = context.store.get();
        if (state.disabled) return false;
        return !(direction === 1 ? state.atEnd : state.atStart);
      },
      /** The progress through the sequence, from 0 to 1. */
      getValue: () => context.store.get().value,
      /** Whether it is playing on its own. */
      isPlaying: () => context.store.get().playing,
      /**
       * The root reached the page. Holds back playback that was set to start
       * when the user prefers reduced motion, and warns about missing parts.
       */
      mount: () => {
        if (context.store.get().playing && prefersReducedMotion()) {
          setPlaying(false, 'reduced-motion');
        }
        syncPlayback();
      },
      /** Stops playing. */
      pause: () => {
        setPlaying(false, 'imperative');
      },
      /** Starts playing, even when the user prefers reduced motion. */
      play: () => {
        startedByUser = true;
        setPlaying(true, 'imperative');
        syncPlayback();
      },
      /**
       * A pointer went down on the viewport.
       * @param el - The viewport
       * @param event - The pointerdown event
       */
      pointerDown: (el: HTMLElement, event: PointerEvent) => {
        if (context.store.get().disabled || drag) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        drag = {
          moved: false,
          pointerId: event.pointerId,
          startValue: context.store.get().value,
          startX: event.clientX
        };
        try {
          // Keeps the drag going when the pointer leaves the viewport.
          el.setPointerCapture(event.pointerId);
        } catch {
          // The pointer is already gone; the drag works inside the viewport.
        }
      },
      /**
       * A pointer moved. Past the threshold, the sequence follows it.
       * @param el - The viewport
       * @param event - The pointermove event
       */
      pointerMove: (el: HTMLElement, event: PointerEvent) => {
        if (drag?.pointerId !== event.pointerId) return;
        const travelled = event.clientX - drag.startX;
        if (!drag.moved) {
          if (Math.abs(travelled) < DRAG_THRESHOLD) return;
          drag.moved = true;
          context.store.set({ dragging: true });
        }
        moveTo(
          drag.startValue + (sign() * travelled) / passDistance(el),
          'swipe',
          event
        );
      },
      /**
       * The pointer lifted, or the browser took the touch over to scroll.
       * @param event - The pointerup or pointercancel event
       */
      pointerUp: endDrag,
      /**
       * Reports the end of a held Previous or Next.
       * @param reason - Which part was held
       * @param event - The DOM event that ended the press
       */
      settle,
      /**
       * Moves to a point in the sequence from code.
       * @param value - The progress, from 0 to 1
       */
      setValue: (value: number) => {
        moveTo(value, 'imperative');
        settle('imperative');
      },
      step,
      /**
       * Moves by a number of steps from code.
       * @param steps - How many steps; negative goes back
       */
      stepBy: (steps: number) => {
        moveTo(
          context.store.get().value +
            steps * (context.options().step ?? DEFAULT_STEP),
          'imperative'
        );
        settle('imperative');
      },
      syncPlayback,
      /**
       * The play toggle was pressed.
       * @param event - The click event
       */
      togglePlaying: (event?: Event) => {
        const playing = !context.store.get().playing;
        if (playing) startedByUser = true;
        setPlaying(playing, 'toggle-press', event);
        syncPlayback();
      },
      /** Warns, in development, when the parts that keyboards rely on are missing. */
      warnMissingParts: () => {
        if (!isDevelopment()) return;
        if (context.element('previous') && context.element('next')) return;
        console.warn(
          '[sequence] SequencePrevious and SequenceNext are both required: they are the only way to move through the sequence with a keyboard or a screen reader.'
        );
      },
      /**
       * A wheel or trackpad scrolled over the viewport. Only a sideways
       * scroll moves the sequence; returns whether it did, so the page is
       * kept from scrolling too.
       * @param el - The viewport
       * @param event - The wheel event
       */
      wheel: (el: HTMLElement, event: WheelEvent) => {
        if (context.store.get().disabled) return false;
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return false;
        // A finger moving towards the end edge scrolls with a negative delta,
        // so the sign is flipped to match a drag the same way.
        moveTo(
          context.store.get().value -
            (sign() * event.deltaX) / passDistance(el),
          'scroll',
          event
        );
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          settle('scroll', event);
        }, SCROLL_IDLE);
        return true;
      }
    };
  },
  /** The parts: root, viewport, previous, next and play toggle. */
  slots: (slot) => {
    type StepState = { disabled: boolean };

    /**
     * Previous and Next are the same button facing opposite ways.
     * @param direction - -1 for Previous, 1 for Next
     */
    const stepSlot = (direction: -1 | 1) => {
      const reason = direction === 1 ? 'next-press' : 'previous-press';
      /**
       * Whether this button has nowhere to go.
       * @param state - The sequence's state
       */
      const blocked = (state: SequenceState) =>
        state.disabled || (direction === 1 ? state.atEnd : state.atStart);

      return slot<object, StepState>({
        /** What the button's render functions and class names can read. */
        state: (state) => ({ disabled: blocked(state) }),
        /**
         * A button that points at the viewport. At an end it stays focusable
         * and does nothing, so focus is not lost when it gets there.
         */
        attrs: (state, part) => ({
          'aria-controls': `${part.id}-viewport`,
          'aria-disabled': blocked(state) ? 'true' : undefined,
          'data-disabled': blocked(state) ? '' : undefined,
          type: 'button'
        }),
        /**
         * Client only: steps on a press and keeps stepping while held. This
         * covers mouse, touch, pen, Enter, Space and a screen reader's click,
         * so the slot has no `press`.
         */
        bind: (el, part) =>
          bindRepeat(el, {
            /** Refuses a press when there is nowhere to go. */
            disabled: () => !part.api.canStep(direction),
            /** Reports where the press left the sequence. */
            onEnd: ({ count, event }) => {
              if (count > 0) part.api.settle(reason, event);
            },
            /** One step; returning `false` at an end stops the repeat. */
            onStep: ({ event }) => part.api.step(direction, reason, event)
          })
      });
    };

    return {
      /** Steps forward, and keeps stepping while held. */
      next: stepSlot(1),
      /**
       * Starts and stops playback. Label it from `playing` in its state, so
       * the label says what a press will do.
       */
      'play-toggle': slot<object, { playing: boolean }>({
        /** What the toggle's render functions and class names can read. */
        state: (state) => ({ playing: state.playing }),
        /** A button that points at the viewport. */
        attrs: (state, part) => ({
          'aria-controls': `${part.id}-viewport`,
          'data-playing': state.playing ? '' : undefined,
          type: 'button'
        }),
        /** Click, Enter or Space starts or stops playback. */
        press: ({ api }, event) => {
          api.togglePlaying(event);
        }
      }),
      /** Steps back, and keeps stepping while held. */
      previous: stepSlot(-1),
      /** Owns the state. Wraps the viewport and the buttons. */
      root: slot<
        object,
        { disabled: boolean; dragging: boolean; playing: boolean }
      >({
        /** What the root's render functions and class names can read. */
        state: (state) => ({
          disabled: state.disabled,
          dragging: state.dragging,
          playing: state.playing
        }),
        /** Marks the state for styling. */
        attrs: (state) => ({
          'data-disabled': state.disabled ? '' : undefined,
          'data-dragging': state.dragging ? '' : undefined,
          'data-playing': state.playing ? '' : undefined
        }),
        /** Client only: writes the progress as a CSS variable and runs playback. */
        bind: (el, part) => {
          /** Writes the progress, rounded so float noise stays out of the CSS. */
          const write = () => {
            const { value } = part.store.get();
            el.style.setProperty(
              '--sequence-progress',
              String(Math.round(value * 10000) / 10000)
            );
          };

          write();
          part.api.mount();
          const unsubscribe = part.store.subscribe(() => {
            write();
            part.api.syncPlayback();
          });
          // The buttons bind after the root, so look for them a moment later.
          const check = setTimeout(part.api.warnMissingParts, 0);

          return () => {
            unsubscribe();
            clearTimeout(check);
          };
        }
      }),
      /**
       * Where the frames show, and what a pointer drags. It takes no focus
       * and has no widget role: to assistive tech it is one image, named by
       * the project. Keyboards use Previous and Next.
       */
      viewport: slot<object, { dragging: boolean }>({
        role: 'img',
        /** What the viewport's render functions and class names can read. */
        state: (state) => ({ dragging: state.dragging }),
        /**
         * Lets a vertical swipe scroll the page while a sideways one drags,
         * and keeps a drag from selecting what is under it.
         */
        attrs: (state, part) => ({
          'data-dragging': state.dragging ? '' : undefined,
          id: `${part.id}-viewport`,
          style: css({
            'touch-action': 'pan-y',
            'user-select': 'none',
            '-webkit-user-select': 'none'
          })
        }),
        on: {
          /** Keeps a mouse drag from picking up an image as a file. */
          dragstart: (event) => {
            event.preventDefault();
          },
          /** The browser took the touch over, usually to scroll. */
          pointercancel: (event, { api }) => {
            api.pointerUp(event);
          },
          /** A drag may start. */
          pointerdown: (event, { api, el }) => {
            if (el) api.pointerDown(el, event);
          },
          /** The sequence follows the pointer. */
          pointermove: (event, { api, el }) => {
            if (el) api.pointerMove(el, event);
          },
          /** The drag ended. */
          pointerup: (event, { api }) => {
            api.pointerUp(event);
          }
        },
        /** Client only: listens for sideways scrolls. */
        bind: (el, part) => {
          /**
           * Only a non-passive listener can keep a sideways scroll from also
           * going back or forward in the browser's history, so it is added
           * here and not through `on`.
           * @param event - The wheel event
           */
          const wheel = (event: WheelEvent) => {
            if (part.api.wheel(el, event)) event.preventDefault();
          };
          el.addEventListener('wheel', wheel, { passive: false });

          return () => {
            el.removeEventListener('wheel', wheel);
          };
        }
      })
    };
  }
});
