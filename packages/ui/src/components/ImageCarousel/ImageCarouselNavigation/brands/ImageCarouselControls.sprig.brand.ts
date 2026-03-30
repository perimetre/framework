import { cva } from '@/lib/cva';

/**
 * Sprig brand ImageCarouselControls variant
 * Fades in controls on hover of the carousel viewport area
 */
export const imageCarouselControlsSprigVariants = cva({
  base: [
    'pui:opacity-0',
    'pui:transition-opacity',
    'pui:duration-200',
    'pui:ease-out',
    'pui:group-hover/imageCarousel:opacity-100',
    'pui:motion-reduce:transition-none'
  ]
});
