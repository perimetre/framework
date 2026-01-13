import { cva } from '@/lib/cva';

/**
 * Stelpro brand ImageCarouselThumbnail variant overrides
 */
export const imageCarouselThumbnailStelproVariants = cva({
  variants: {
    selected: {
      true: 'pui:border-blue-500 pui:ring-blue-500/30'
    }
  }
});
