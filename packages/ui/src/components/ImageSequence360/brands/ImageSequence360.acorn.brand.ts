import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageSequence360 variants (default/base theme).
 * Styles the drag-hint badge (circle) and its icons via a `slot` variant.
 */
export const imageSequence360AcornVariants = cva({
  base: [],
  variants: {
    slot: {
      badge: [
        'pui:flex',
        'pui:size-14',
        'pui:sm:size-20',
        'pui:items-center',
        'pui:justify-center',
        'pui:gap-1',
        'pui:sm:gap-2',
        'pui:rounded-full',
        'pui:shadow-md',
        'pui:bg-pui-primary-3'
      ],
      icon: ['pui:text-pui-interactive-primary']
    }
  }
});
