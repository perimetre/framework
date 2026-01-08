import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselLazyLoadSpinner variant
 */
export const imageCarouselLazyLoadSpinnerAcornVariants = cva({
  base: [
    'pui:absolute',
    'pui:inset-0',
    'pui:flex',
    'pui:items-center',
    'pui:justify-center',
    'pui:transition-opacity',
    'pui:duration-200',
    'pui:pointer-events-none'
  ],
  variants: {
    hidden: {
      false: 'pui:opacity-100',
      true: 'pui:opacity-0'
    }
  }
});
