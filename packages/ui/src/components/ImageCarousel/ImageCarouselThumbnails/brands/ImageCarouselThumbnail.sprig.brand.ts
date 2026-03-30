import { cva } from '@/lib/cva';

/**
 * Sprig brand ImageCarouselThumbnail variant overrides
 */
export const imageCarouselThumbnailSprigVariants = cva({
  base: ['pui:rounded-none', 'pui:border'],
  variants: {
    selected: {
      true: 'pui:border-pui-color-border-rule-primary',
      false: 'pui:border-pui-border-baseline'
    },
    orientation: {
      horizontal: ['pui:w-16', 'pui:h-16'],
      vertical: ['pui:w-14', 'pui:h-14']
    }
  }
});
