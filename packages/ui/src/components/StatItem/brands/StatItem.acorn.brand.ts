import { cva } from '@/lib/cva';

export const statItemAcornVariants = cva({
  base: [
    'pui:flex',
    'pui:flex-row',
    'pui:gap-5',
    'pui:justify-between',
    'pui:items-center',
    'pui:md:flex-col',
    'pui:md:gap-1',
    'pui:md:justify-start',
    'pui:md:items-start',
    'pui:py-3.5',
    'pui:border-b',
    'pui:border-pui-border-rule-secondary',
    'pui:md:border-b-0'
  ]
});
