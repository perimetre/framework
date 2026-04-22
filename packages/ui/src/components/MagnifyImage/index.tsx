'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@perimetre/classnames';

export type MagnifyImageProps = {
  className?: string;
  /** Lens radius in pixels. Defaults to 80. */
  lensRadius?: number;
  /** Extra classes applied to the circular magnifying lens. Use to override ring, shadow, size, etc. */
  magnifierClassName?: string;
  /** The image to render and magnify. Accepts any image element — native img, Next.js Image, Hydrogen Image, etc. */
  renderImage: React.ReactNode;
  /** Zoom scale factor. Defaults to 2. */
  scale?: number;
} & Omit<React.ComponentProps<'div'>, 'children'>;

/**
 * Wraps any image and shows a circular magnifying glass lens on hover (desktop)
 * or tap/drag (mobile). `renderImage` is rendered once normally, then again inside
 * the lens at the zoomed scale — fully agnostic of the image component used.
 */
function MagnifyImage({
  className,
  lensRadius = 80,
  magnifierClassName,
  renderImage,
  scale = 2,
  ...props
}: MagnifyImageProps) {
  const [isActive, setIsActive] = useState(false);
  // Container size tracked via ResizeObserver to avoid reading refs during render.
  const [containerSize, setContainerSize] = useState({ h: 0, w: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Raw pointer coords buffered between rAF ticks — never triggers a re-render.
  const pendingCoords = useRef<{ clientX: number; clientY: number } | null>(
    null
  );
  const rafId = useRef<null | number>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({
        h: entry.contentRect.height,
        w: entry.contentRect.width
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  // Cancel any pending frame on unmount.
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  /**
   * Runs inside the rAF callback — once per frame at most.
   * Reads the rect here (post-layout, pre-paint) and writes CSS vars directly,
   * bypassing React state so no re-render is triggered.
   */
  const flushPos = useCallback(() => {
    rafId.current = null;
    const coords = pendingCoords.current;
    const el = containerRef.current;
    if (!coords || !el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty(
      '--posX',
      String(Math.max(0, Math.min(rect.width, coords.clientX - rect.left)))
    );
    el.style.setProperty(
      '--posY',
      String(Math.max(0, Math.min(rect.height, coords.clientY - rect.top)))
    );
  }, []);

  /**
   * Called on every pointer event. Stores the latest coords and schedules a
   * single rAF flush. Multiple events in the same frame collapse into one write.
   */
  const schedulePos = useCallback(
    (clientX: number, clientY: number) => {
      pendingCoords.current = { clientX, clientY };
      rafId.current ??= requestAnimationFrame(flushPos);
    },
    [flushPos]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      // Schedule position eagerly so CSS vars are set before the first paint.
      schedulePos(e.clientX, e.clientY);
      setIsActive(true);
    },
    [schedulePos]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setIsActive(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      schedulePos(e.clientX, e.clientY);
    },
    [schedulePos]
  );

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      schedulePos(touch.clientX, touch.clientY);
      setIsActive(true);
    },
    [schedulePos]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      schedulePos(touch.clientX, touch.clientY);
    },
    [schedulePos]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'pui:relative pui:overflow-hidden pui:cursor-crosshair pui:touch-none pui:select-none',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      {...props}
      style={
        {
          '--lensRadius': lensRadius,
          '--posX': 0,
          '--posY': 0
        } as React.CSSProperties
      }
    >
      {/* Normal image */}
      {renderImage}

      {/* Circular magnifying lens */}
      {isActive && (
        <div
          aria-hidden
          className={cn(
            'pui:absolute pui:rounded-full pui:overflow-hidden pui:pointer-events-none',
            'pui:h-[calc(var(--lensRadius)*2px)] pui:w-[calc(var(--lensRadius)*2px)]',
            'pui:left-[calc(var(--posX)*1px-var(--lensRadius)*1px)] pui:top-[calc(var(--posY)*1px-var(--lensRadius)*1px)]',
            'pui:shadow-[0_0_0_2px_rgba(255,255,255,0.6),0_0_0_3px_rgba(0,0,0,0.15),0_4px_20px_rgba(0,0,0,0.25)]',
            magnifierClassName
          )}
        >
          {/*
           * Inner image: same dimensions as the container, offset so that
           * point (pos.x, pos.y) — the cursor — lands exactly at the lens center.
           *
           * Math: inner div at (lensRadius - pos.x, lensRadius - pos.y) in lens space.
           * scale(S) with transform-origin at (pos.x, pos.y) keeps that point stationary,
           * which is already at the lens center. QED.
           *
           * CSS vars (--posX, --posY) are written directly by flushPos without
           * going through React state, so no re-render is needed per frame.
           */}
          <div
            style={{
              height: containerSize.h,
              left: 'calc(' + String(lensRadius) + 'px - var(--posX) * 1px)',
              position: 'absolute',
              top: 'calc(' + String(lensRadius) + 'px - var(--posY) * 1px)',
              transform: 'scale(' + String(scale) + ')',
              transformOrigin:
                'calc(var(--posX) * 1px) calc(var(--posY) * 1px)',
              width: containerSize.w
            }}
          >
            {renderImage}
          </div>
        </div>
      )}
    </div>
  );
}

export default MagnifyImage;
