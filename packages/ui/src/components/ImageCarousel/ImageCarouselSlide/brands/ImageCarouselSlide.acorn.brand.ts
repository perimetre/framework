import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselSlide variant
 */
export const imageCarouselSlideAcornVariants = cva({
  base: [
    'pui:transform-gpu',
    'pui:flex-[0_0_100%]',
    'pui:min-w-0',
    'pui:pl-4',
    'pui:relative',
    'pui:h-full'
  ]
});
