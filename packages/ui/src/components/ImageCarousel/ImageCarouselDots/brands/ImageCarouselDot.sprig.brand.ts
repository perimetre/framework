import { cva } from '@/lib/cva';

/**
 * Sprig brand ImageCarouselDot variant overrides
 */
export const imageCarouselDotSprigVariants = cva({
  base: [],
  variants: {
    selected: {
      true: 'pui:bg-pui-interactive-primary'
    }
  }
});
