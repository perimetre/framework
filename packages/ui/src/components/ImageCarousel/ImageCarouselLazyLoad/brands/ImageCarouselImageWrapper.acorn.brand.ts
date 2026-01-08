import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselImageWrapper variant
 */
export const imageCarouselImageWrapperAcornVariants = cva({
  base: ['pui:transition-opacity', 'pui:duration-200'],
  variants: {
    loaded: {
      false: 'pui:opacity-0',
      true: 'pui:opacity-100'
    }
  }
});
