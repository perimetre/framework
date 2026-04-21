import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageSequence360 variants (default/base theme).
 * Styles the drag-hint badge (circle) and its icons.
 */
export const imageSequence360BadgeAcornVariants = cva({
  base: [
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
  ]
});

export const imageSequence360IconAcornVariants = cva({
  base: ['pui:text-pui-interactive-primary']
});
