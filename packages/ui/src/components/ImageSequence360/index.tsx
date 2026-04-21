'use client';

import {
  FastImageSequence,
  type FastImageSequenceOptions
} from '@mediamonks/fast-image-sequence';
import { useGesture } from '@use-gesture/react';
import { ArrowLeft, ArrowRight, Hand } from 'lucide-react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@perimetre/classnames';

import { getBrandVariant } from '@/lib/brand-registry';

import {
  imageSequence360BadgeBrandVariants,
  imageSequence360IconBrandVariants
} from './brands';

export type ImageSequence360Props = {
  /**
   * Accessible name for the viewer (e.g. product name + "360° view"). Rendered
   * on the outer `role="slider"` element — consumers must provide this.
   */
  'aria-label': string;
  className?: string;
  /**
   * Pixels of horizontal drag required to advance one full rotation.
   * Defaults to the container width — a full drag across the element does one full spin.
   */
  dragDistanceForFullRotation?: number;
} & FastImageSequenceOptions;

/**
 * 360° spin viewer built on `@mediamonks/fast-image-sequence` for rendering and
 * `@use-gesture/react` for input. The canvas is managed by fast-image-sequence
 * (which observes container resize internally via ResizeObserver), so it adapts
 * to any parent width/height on window resize or layout change automatically.
 *
 * Input:
 * - Mouse drag and touch drag (axis-locked to horizontal) via pointer events.
 * - Touchpad two-finger swipe via wheel events (horizontal delta).
 *
 * Uses the vanilla `FastImageSequence` class directly rather than the library's
 * React wrapper — the wrapper bundles React 18 internals that break on React 19.
 */
const ImageSequence360: React.FC<ImageSequence360Props> = ({
  'aria-label': ariaLabel,
  className,
  dragDistanceForFullRotation,
  loop = true,
  objectFit = 'cover',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sequence, setSequence] = useState<FastImageSequence | null>(null);
  const [didInteract, setDidInteract] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const badgeVariants = getBrandVariant(imageSequence360BadgeBrandVariants);
  const iconVariants = getBrandVariant(imageSequence360IconBrandVariants);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new FastImageSequence(containerRef.current, {
      loop,
      objectFit,
      ...props
    });
    setSequence(instance);
    return () => {
      instance.destruct();
      setSequence(null);
    };
    // Mount-only: options are captured on first render, matching the library's
    // lifecycle (it doesn't support reconfiguration after construction).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Advance the spin by `dx` pixels of horizontal input. */
  const advance = (dx: number) => {
    if (!sequence) return;
    if (dx !== 0) setDidInteract((prev) => prev || true);
    const width =
      dragDistanceForFullRotation ??
      containerRef.current?.clientWidth ??
      window.innerWidth;
    let next = (sequence.progress + dx / width) % 1;
    if (next < 0) next += 1;
    sequence.progress = next;
  };

  const bind = useGesture(
    {
      /** Mouse and touch drag, axis-locked to horizontal. */
      onDrag: ({ delta: [dx] }) => {
        advance(dx);
      },
      /**
       * Touchpad two-finger horizontal swipe. Only handle horizontal-dominant
       * deltas — vertical wheel events fall through so the page can scroll
       * normally when the viewer is embedded in a longer layout.
       */
      onWheel: ({ delta: [dx, dy], event }) => {
        if (Math.abs(dx) <= Math.abs(dy)) return;
        event.preventDefault();
        advance(dx);
      }
    },
    {
      drag: { axis: 'x' },
      wheel: { eventOptions: { passive: false } }
    }
  );

  const ARROW_KEY_STEP_PX = 24;

  return (
    <div
      ref={containerRef}
      {...bind()}
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round((sequence?.progress ?? 0) * 100)}
      role="slider"
      tabIndex={0}
      className={cn(
        'pui:relative pui:h-full pui:w-full pui:select-none pui:touch-pan-y pui:cursor-grab pui:active:cursor-grabbing pui:focus-visible:outline-2 pui:focus-visible:outline-pui-border-focus',
        className
      )}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') advance(-ARROW_KEY_STEP_PX);
        else if (event.key === 'ArrowRight') advance(ARROW_KEY_STEP_PX);
      }}
      onMouseLeave={() => {
        setDidInteract(false);
      }}
    >
      <AnimatePresence>
        {!didInteract && !shouldReduceMotion && (
          <m.div
            animate={{ opacity: 1 }}
            className="pui:pointer-events-none pui:absolute pui:inset-x-0 pui:top-4 pui:flex pui:justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className={badgeVariants()}>
              <ArrowLeft
                aria-hidden
                className={iconVariants({
                  className: 'pui:size-3 pui:sm:size-4'
                })}
              />
              <Hand
                aria-hidden
                className={iconVariants({
                  className: 'pui:size-4 pui:sm:size-5'
                })}
              />
              <ArrowRight
                aria-hidden
                className={iconVariants({
                  className: 'pui:size-3 pui:sm:size-4'
                })}
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageSequence360;
