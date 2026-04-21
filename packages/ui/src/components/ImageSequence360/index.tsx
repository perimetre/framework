'use client';

import {
  FastImageSequence,
  type FastImageSequenceOptions
} from '@mediamonks/fast-image-sequence';
import { useDrag } from '@use-gesture/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@perimetre/classnames';

export type ImageSequence360Props = {
  className?: string;
  /**
   * Pixels of horizontal drag required to advance one full rotation.
   * Defaults to the container width — a full drag across the element does one full spin.
   */
  dragDistanceForFullRotation?: number;
} & FastImageSequenceOptions;

/**
 * 360° spin viewer built on `@mediamonks/fast-image-sequence` for rendering and
 * `@use-gesture/react` for axis-locked horizontal drag. The canvas is managed by
 * fast-image-sequence (which observes container resize internally), so it adapts
 * to any parent width/height automatically.
 *
 * Uses the vanilla `FastImageSequence` class directly rather than the library's
 * React wrapper — the wrapper bundles React 18 internals that break on React 19.
 */
const ImageSequence360: React.FC<ImageSequence360Props> = ({
  className,
  dragDistanceForFullRotation,
  loop = true,
  objectFit = 'cover',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sequence, setSequence] = useState<FastImageSequence | null>(null);

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

  const bind = useDrag(
    ({ delta: [dx] }) => {
      if (!sequence) return;
      const el = containerRef.current;
      const width =
        dragDistanceForFullRotation ?? el?.clientWidth ?? window.innerWidth;
      let next = (sequence.progress + dx / width) % 1;
      if (next < 0) next += 1;
      sequence.progress = next;
    },
    { axis: 'x' }
  );

  return (
    <div
      ref={containerRef}
      {...bind()}
      className={cn(
        'pui:relative pui:h-full pui:w-full pui:select-none pui:touch-pan-y pui:cursor-grab pui:active:cursor-grabbing',
        className
      )}
    />
  );
};

export default ImageSequence360;
