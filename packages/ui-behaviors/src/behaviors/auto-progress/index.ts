import type { PrimitiveContext } from '@ui-sdk/core';

/** How `createAutoProgress` reads and changes its state. */
export type AutoProgressOptions<State extends object> = {
  /**
   * How long one full pass takes, in milliseconds.
   * @default 4000
   */
  duration?: () => number;
  /**
   * Whether playback waits where it is, like while a pointer drags the same
   * progress. It carries on from there afterwards.
   */
  held?: () => boolean;
  /**
   * Whether the progress goes round. Without it, playback stops at 1.
   * @default true
   */
  loop?: () => boolean;
  /** Reads whether it is playing, like `(state) => state.playing`. */
  playing: (state: State) => boolean;
  /**
   * Asks for the next progress, once per frame, before wrapping or clamping.
   * Pass the primitive's change with its own reason, like `auto-progress`.
   */
  set: (value: number) => void;
  /**
   * Asks to stop playing and returns whether it went through. Pass the
   * primitive's change:
   * `setPlaying: (playing, details) => change("playing", playing, details)`.
   */
  setPlaying: (
    playing: boolean,
    details: { reason: AutoProgressReason }
  ) => boolean;
  /** Reads the progress from state, from 0 to 1, like `(state) => state.value`. */
  value: (state: State) => number;
};

/**
 * Why playback started or stopped on its own.
 *
 * - `end`: it reached the end with `loop` off.
 * - `reduced-motion`: it was set to start playing, and the user prefers
 *   reduced motion.
 */
export type AutoProgressReason = 'end' | 'reduced-motion';

const DEFAULT_DURATION = 4000;
/** The longest gap between two frames that playback makes up for, in milliseconds. */
const MAX_FRAME_GAP = 100;

/**
 * Whether the user asked the system for less motion. `false` on a server.
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Moves a progress forward on its own, frame by frame, for anything that
 * plays: a product that turns, a timelapse, a slideshow's timer. It follows
 * the `playing` state: whatever sets it, a toggle, a controller or the app,
 * starts and stops the frames.
 *
 * Playback that was set to start never does when the user prefers reduced
 * motion. A person who asks for it, through `allow()`, still gets it.
 *
 * Call it once in `api`, keep it on the api, and bind it from the root:
 *
 * ```ts
 * root: slot({ bind: (_el, part) => part.api.autoProgress.bind() }),
 * "play-toggle": slot({
 *   press: ({ api }, event) => {
 *     api.autoProgress.allow()
 *     change("playing", !store.get().playing, { reason: "toggle-press", event })
 *   },
 * }),
 * ```
 *
 * Story: `src/behaviors/auto-progress/auto-progress.stories.tsx`, shipped with the package, shows
 * a bar that fills once.
 * @param context - The primitive's context, from `api`
 * @param options - How to read and change the state
 */
export const createAutoProgress = <
  Options,
  State extends object,
  Slot extends string
>(
  context: Pick<PrimitiveContext<Options, State, Slot>, 'onDestroy' | 'store'>,
  options: AutoProgressOptions<State>
) => {
  let frame: number | undefined;
  let lastFrame: number | undefined;
  /** Whether a person asked for playback, which outranks reduced motion. */
  let allowed = false;

  /** Whether it is playing now. */
  const isPlaying = () => options.playing(context.store.get());

  /** Stops the frames. */
  const stopFrames = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    lastFrame = undefined;
  };

  /**
   * One frame: moves on by the time since the last one.
   * @param now - The frame's timestamp
   */
  const tick = (now: number) => {
    frame = undefined;
    if (!isPlaying()) {
      lastFrame = undefined;
      return;
    }

    const elapsed =
      lastFrame === undefined ? 0 : Math.min(now - lastFrame, MAX_FRAME_GAP);
    lastFrame = now;

    const loop = options.loop?.() ?? true;
    const duration = options.duration?.() ?? DEFAULT_DURATION;
    if (!options.held?.() && elapsed > 0 && duration > 0) {
      options.set(options.value(context.store.get()) + elapsed / duration);
    }

    if (!loop && options.value(context.store.get()) >= 1) {
      options.setPlaying(false, { reason: 'end' });
      if (!isPlaying()) {
        lastFrame = undefined;
        return;
      }
    }

    frame = requestAnimationFrame(tick);
  };

  /** Starts or stops the frames to match the state. Client only. */
  const sync = () => {
    if (isPlaying() && (allowed || !prefersReducedMotion())) {
      frame ??= requestAnimationFrame(tick);
    } else {
      stopFrames();
    }
  };

  context.onDestroy(stopFrames);

  return {
    /**
     * Lets playback run even when the user prefers reduced motion. Call it
     * when a person asks for playback: a play toggle, or a controller's
     * `play()`.
     */
    allow: () => {
      allowed = true;
    },
    /**
     * Starts following the `playing` state. Call it from the root slot's
     * `bind` and return its cleanup. Playback that was set to start is
     * stopped here when the user prefers reduced motion.
     */
    bind: () => {
      if (isPlaying() && !allowed && prefersReducedMotion()) {
        options.setPlaying(false, { reason: 'reduced-motion' });
      }
      sync();
      const unsubscribe = context.store.subscribe(sync);
      return () => {
        unsubscribe();
        stopFrames();
      };
    }
  };
};

/** What `createAutoProgress` returns. */
export type AutoProgressBehavior = ReturnType<typeof createAutoProgress>;
