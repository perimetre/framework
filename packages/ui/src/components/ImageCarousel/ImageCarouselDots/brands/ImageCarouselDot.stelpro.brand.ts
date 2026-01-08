import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselDot variant overrides
 */
export const imageCarouselDotStelproVariants = cva({
  base: [],
  variants: {
    selected: {
      true: 'pui:bg-pui-interactive-primary'
    }
  }
});
