import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselControls variant
 */
export const imageCarouselControlsAcornVariants = cva({
  base: [
    'pui:absolute',
    'pui:inset-0',
    'pui:flex',
    'pui:items-center',
    'pui:justify-between',
    'pui:px-4',
    'pui:pointer-events-none'
  ]
});
