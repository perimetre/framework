import { cva } from '@/lib/cva';

/**
 * Acorn brand button variants (default/base theme)
 * These styles apply when no specific brand is set or when data-pui-brand="acorn"
 */
export const buttonAcornVariants = cva({
  base: [
    'pui:bg-pui-primary-6 pui:text-pui-overlay-12 pui:rounded-full pui:leading-[1.335rem] pui:font-bold pui:uppercase'
  ],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    }
  }
});
