import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselThumbnail variant
 */
export const imageCarouselThumbnailAcornVariants = cva({
  base: [
    'pui:shrink-0',
    'pui:cursor-pointer',
    'pui:transition-all',
    'pui:duration-200',
    'pui:rounded-md',
    'pui:overflow-hidden',
    'pui:border-2',
    'pui:border-transparent'
  ],
  variants: {
    selected: {
      false: 'pui:opacity-60 hover:pui:opacity-80',
      true: 'pui:opacity-100 pui:border-white pui:ring-2 pui:ring-white/50'
    },
    orientation: {
      horizontal: ['pui:w-20', 'pui:h-16'],
      vertical: ['pui:w-16', 'pui:h-14']
    }
  },
  defaultVariants: {
    selected: false,
    orientation: 'horizontal'
  }
});
