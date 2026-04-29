import { cva } from '@/lib/cva';

export const tabsListAcornVariants = cva({
  base: [
    'pui:font-pui-sans pui:inline-flex pui:items-center pui:gap-8 pui:border-b pui:border-pui-overlay-6'
  ],
  variants: {},
  defaultVariants: {}
});

export const tabsTriggerAcornVariants = cva({
  base: [
    'pui:cursor-pointer pui:pb-3 pui:typo-base pui:text-xs pui:lg:text-sm pui:font-light pui:lg:px-5',
    'pui:-mb-px pui:border-b-2 pui:border-transparent',
    'pui:text-pui-overlay-12 pui:transition-colors pui:duration-pui-normal',
    'pui:hover:text-pui-overlay-12',
    'pui:data-[state=active]:border-pui-overlay-12'
  ],
  variants: {},
  defaultVariants: {}
});
