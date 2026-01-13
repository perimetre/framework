import { cva } from '@/lib/cva';

/**
 * Sprig brand ImageCarouselThumbnail variant overrides
 */
export const imageCarouselThumbnailSprigVariants = cva({
  variants: {
    selected: {
      true: 'pui:border-green-500 pui:ring-green-500/30'
    }
  }
});
