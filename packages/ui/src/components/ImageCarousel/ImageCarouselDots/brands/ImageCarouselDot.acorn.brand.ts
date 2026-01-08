import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselDot variant
 */
export const imageCarouselDotAcornVariants = cva({
  base: [
    'pui:pointer-events-auto',
    'pui:w-1.5',
    'pui:h-1.5',
    'pui:rounded-full',
    'pui:transition-all',
    'pui:duration-200',
    'pui:cursor-pointer'
  ],
  variants: {
    selected: {
      false: 'pui:bg-white/60 hover:pui:bg-white/80',
      true: 'pui:bg-white pui:scale-125'
    }
  }
});
