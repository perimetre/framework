import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselThumbnailsContainer variant
 */
export const imageCarouselThumbnailsContainerAcornVariants = cva({
  base: ['pui:flex', 'pui:gap-2'],
  variants: {
    orientation: {
      horizontal: [
        'pui:flex-row',
        'pui:mt-4',
        'pui:overflow-x-auto',
        'pui:scrollbar-hide'
      ],
      vertical: [
        'pui:flex-col',
        'pui:mr-4',
        'pui:overflow-y-auto',
        'pui:scrollbar-hide',
        'pui:shrink-0'
      ]
    }
  },
  defaultVariants: {
    orientation: 'horizontal'
  }
});
