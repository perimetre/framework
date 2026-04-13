'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MagnifyImageProps = {
  className?: string;
  /** Lens radius in pixels. Defaults to 80. */
  lensRadius?: number;
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
  renderImage,
  scale = 2,
  ...props
}: MagnifyImageProps) {
  const [isActive, setIsActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // Container size tracked via ResizeObserver to avoid reading refs during render.
  const [containerSize, setContainerSize] = useState({ h: 0, w: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const computePos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top))
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      computePos(e.clientX, e.clientY);
    },
    [computePos]
  );

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      computePos(touch.clientX, touch.clientY);
      setIsActive(true);
    },
    [computePos]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      computePos(touch.clientX, touch.clientY);
    },
    [computePos]
  );

  return (
    <div
      ref={containerRef}
      className={`pui:relative pui:overflow-hidden pui:cursor-crosshair pui:touch-none pui:select-none ${className ?? ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {/* Normal image */}
      {renderImage}

      {/* Circular magnifying lens */}
      {isActive && (
        <div
          aria-hidden
          style={{
            borderRadius: '50%',
            boxShadow:
              '0 0 0 2px rgba(255,255,255,0.6), 0 0 0 3px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.25)',
            height: lensRadius * 2,
            left: pos.x - lensRadius,
            overflow: 'hidden',
            pointerEvents: 'none',
            position: 'absolute',
            top: pos.y - lensRadius,
            width: lensRadius * 2
          }}
        >
          {/*
           * Inner image: same dimensions as the container, offset so that
           * point (pos.x, pos.y) — the cursor — lands exactly at the lens center.
           *
           * Math: inner div at (lensRadius - pos.x, lensRadius - pos.y) in lens space.
           * scale(S) with transform-origin at (pos.x, pos.y) keeps that point stationary,
           * which is already at the lens center. QED.
           */}
          <div
            style={{
              height: containerSize.h,
              left: lensRadius - pos.x,
              position: 'absolute',
              top: lensRadius - pos.y,
              transform: 'scale(' + scale.toString() + ')',
              transformOrigin:
                pos.x.toString() + 'px ' + pos.y.toString() + 'px',
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
