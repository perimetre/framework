import {
  bindRepeat,
  createChange,
  createCommit,
  createController,
  css,
  definePrimitive,
  type ChangeDetails,
  type ChangeOptions,
  type CommitDetails
} from '@ui-sdk/core';
import {
  createAutoProgress,
  type AutoProgressReason
} from '../../behaviors/auto-progress/index.js';
import {
  createScrub,
  normalizeProgress,
  type ScrubReason
} from '../../behaviors/scrub/index.js';

export type SequenceController = {
  /** The progress through the sequence, from 0 to 1. */
  getValue: () => number;
  /** Whether it is playing on its own. */
  isPlaying: () => boolean;
  /**
   * Stops playing.
   * @param options - The reason and event passed to `onPlayingChange`
   */
  pause: (options?: SequencePlayingOptions) => void;
  /**
   * Starts playing, even when the user prefers reduced motion.
   * @param options - The reason and event passed to `onPlayingChange`
   */
  play: (options?: SequencePlayingOptions) => void;
  /**
   * Moves to a point in the sequence.
   * @param value - The progress, from 0 to 1. With `loop` it wraps round.
   * @param options - The reason and event passed to `onValueChange`
   */
  setValue: (value: number, options?: SequenceValueOptions) => void;
  /**
   * Moves by a number of steps, as Previous and Next do.
   * @param steps - How many steps; negative goes back
   * @param options - The reason and event passed to `onValueChange`
   */
  stepBy: (steps: number, options?: SequenceValueOptions) => void;
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
   * Whether dragging towards the right edge moves back through the sequence
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
 * Why playback started or stopped. `toggle-press`, `previous-press`,
 * `next-press` and `imperative` are the names a carousel reports; `end` and
 * `reduced-motion` come from `createAutoProgress`.
 */
export type SequencePlayingChangeReason =
  | 'imperative'
  | 'next-press'
  | 'previous-press'
  | 'toggle-press'
  | AutoProgressReason;

/** Options for a controller's `play` and `pause`. */
export type SequencePlayingOptions = ChangeOptions<SequencePlayingChangeReason>;

/**
 * Why the progress changed. `swipe` and `scroll` come from `createScrub`;
 * `previous-press` and `next-press` fire once per step while a button is
 * held. `auto-progress` isn't in the shared vocabulary.
 */
export type SequenceValueChangeReason =
  | 'auto-progress'
  | 'imperative'
  | 'next-press'
  | 'previous-press'
  | ScrubReason;

/**
 * Why an interaction's final progress was reported. Playback never commits.
 */
export type SequenceValueCommitReason = Exclude<
  SequenceValueChangeReason,
  'auto-progress'
>;

/** Options for a controller's `setValue` and `stepBy`. */
export type SequenceValueOptions = ChangeOptions<SequenceValueCommitReason>;

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
 * Creates a handle that moves and plays a sequence from outside it. Pass it
 * to the root's `controller` option.
 */
export const createSequenceController = () =>
  createController<SequenceController>();

/**
 * Moves through a dense run of frames, like a product turning or a timelapse,
 * as one continuous progress from 0 to 1. It draws nothing: the app draws the
 * frame for the current progress, from `onValueChange`.
 *
 * Built from `createScrub` (drag and sideways scroll), `createAutoProgress`
 * (playing on its own) and UI SDK's `bindRepeat` (Previous and Next, which
 * step and keep stepping while held).
 *
 * Parts: `root`, `viewport` (what a pointer drags; one image to assistive
 * tech, so name it), `previous`, `next` and `play-toggle`. Previous and Next
 * are required: they are the only way through the sequence for keyboards and
 * screen readers.
 *
 * Modelled on a carousel, not a slider: there is no value to read out, only a
 * picture and buttons that turn it.
 *
 * The root exposes `data-dragging`, `data-playing`, `data-disabled` and the
 * CSS variable `--sequence-progress`. The progress is `live` state, so a drag
 * re-renders nothing.
 *
 * Story: `src/primitives/sequence/sequence.stories.tsx`, shipped with the package, shows
 * its parts rendered in React.
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
    const value = normalizeProgress(
      options.value ?? options.defaultValue ?? 0,
      loop
    );
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
      options.value === undefined
        ? undefined
        : normalizeProgress(options.value, loop);
    return {
      disabled: options.disabled ?? false,
      ...(value === undefined ? {} : { ...endsAt(value, loop), value }),
      ...(options.playing === undefined ? {} : { playing: options.playing })
    };
  },
  /** Runs once per instance and returns what the parts, a controller and an agent call. */
  api: (context) => {
    const change = createChange(context);
    const commit = createCommit(context);

    /**
     * The progress a step or a call last asked for. A controlled value
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
      const next = normalizeProgress(value, loops());
      if (next === context.store.get().value) return false;
      if (reason !== 'auto-progress') asked = next;
      const moved = change('value', next, { event, reason });
      refreshEnds();
      return moved;
    };

    /**
     * Reports where a step or a call left the sequence.
     * @param reason - What the interaction was
     * @param event - The DOM event that ended it
     */
    const settle = (reason: SequenceValueCommitReason, event?: Event) => {
      commit('value', asked ?? context.store.get().value, { event, reason });
      asked = undefined;
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
    ) =>
      context.store.get().playing === playing
        ? false
        : change('playing', playing, { event, reason });

    const scrub = createScrub(context, {
      /** Whether dragging and scrolling are off. */
      disabled: () => context.store.get().disabled,
      /** How far a drag travels for one full pass. */
      distance: (el) => context.options().dragDistance ?? (el.clientWidth || 1),
      /** Whether dragging right goes back. */
      inverted: () => context.options().inverted ?? false,
      loop: loops,
      /** Reports where a drag or a scroll ended, through `onValueCommit`. */
      onCommit: (value, details) => {
        commit('value', value, details);
      },
      /** Marks the root and the viewport while a pointer drags. */
      onDraggingChange: (dragging) => {
        context.store.set({ dragging });
      },
      /** Moves through `onValueChange`. */
      set: (value, details) => {
        const moved = change('value', value, details);
        refreshEnds();
        return moved;
      },
      /** The progress. */
      value: (state) => state.value
    });

    const autoProgress = createAutoProgress(context, {
      /** How long one full pass takes. */
      duration: () => context.options().duration ?? 4000,
      // A drag holds playback still; it carries on from there on release.
      held: scrub.dragging,
      loop: loops,
      /** Whether it is playing. */
      playing: (state) => state.playing,
      /** Moves one frame on, through `onValueChange`. */
      set: (value) => {
        moveTo(value, 'auto-progress');
      },
      /** Stops through `onPlayingChange`. */
      setPlaying: (playing, details) => setPlaying(playing, details.reason),
      /** The progress. */
      value: (state) => state.value
    });

    context.onOptions(refreshEnds);

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
       * Stops playing.
       * @param options - The reason and event passed to `onPlayingChange`
       */
      pause: (options?: SequencePlayingOptions) => {
        setPlaying(false, options?.reason ?? 'imperative', options?.event);
      },
      /**
       * Starts playing, even when the user prefers reduced motion.
       * @param options - The reason and event passed to `onPlayingChange`
       */
      play: (options?: SequencePlayingOptions) => {
        autoProgress.allow();
        setPlaying(true, options?.reason ?? 'imperative', options?.event);
      },
      autoProgress,
      scrub,
      settle,
      /**
       * Moves to a point in the sequence from code.
       * @param value - The progress, from 0 to 1
       * @param options - The reason and event passed to `onValueChange`
       */
      setValue: (value: number, options?: SequenceValueOptions) => {
        const reason = options?.reason ?? 'imperative';
        if (moveTo(value, reason, options?.event)) {
          settle(reason, options?.event);
        }
      },
      /**
       * Steps back or forward, as Previous and Next do. Returns whether it
       * can step again that way.
       * @param direction - -1 for back, 1 for forward
       * @param reason - Which part asked
       * @param event - The DOM event behind it
       */
      step: (
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
      },
      /**
       * Moves by a number of steps from code.
       * @param steps - How many steps; negative goes back
       * @param options - The reason and event passed to `onValueChange`
       */
      stepBy: (steps: number, options?: SequenceValueOptions) => {
        const reason = options?.reason ?? 'imperative';
        const moved = moveTo(
          context.store.get().value +
            steps * (context.options().step ?? DEFAULT_STEP),
          reason,
          options?.event
        );
        if (moved) settle(reason, options?.event);
      },
      /**
       * The play toggle was pressed.
       * @param event - The click event
       */
      togglePlaying: (event?: Event) => {
        const playing = !context.store.get().playing;
        if (playing) autoProgress.allow();
        setPlaying(playing, 'toggle-press', event);
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
          'data-playing': state.playing ? '' : undefined,
          style: css({ '--sequence-progress': String(state.value) })
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
          const unsubscribe = part.store.subscribe(write);
          const unbind = part.api.autoProgress.bind();

          return () => {
            unsubscribe();
            unbind();
          };
        }
      }),
      /**
       * Where the frames show, and what a pointer drags. It takes no focus
       * and has no widget role: to assistive tech it is one image, named by
       * the app. Keyboards use Previous and Next.
       */
      viewport: slot<object, { dragging: boolean }>({
        role: 'img',
        /** What the viewport's render functions and class names can read. */
        state: (state) => ({ dragging: state.dragging }),
        /** Marks a drag, and lets a vertical swipe scroll the page. */
        attrs: (state, part) => ({
          'data-dragging': state.dragging ? '' : undefined,
          id: `${part.id}-viewport`,
          style: part.api.scrub.surfaceStyle()
        }),
        on: {
          /** A drag may start. */
          pointerdown: (event, { api, el }) => {
            if (el) api.scrub.pointerdown(event, el);
          }
        },
        /** Client only: listens for sideways scrolls. */
        bind: (el, part) => part.api.scrub.bind(el)
      })
    };
  },
  agent: { actions: ['setValue', 'stepBy', 'play', 'pause'] }
});
