import { cva } from '@/lib/cva';

/**
 * Acorn brand button variants (default/base theme)
 * These styles apply when no specific brand is set or when data-pui-brand="acorn"
 *
 * Uses semantic tokens for themeable properties:
 * - bg-pui-interactive-primary: Button background (--pui-color-interactive-primary)
 * - text-pui-interactive-on-primary: Button text (--pui-color-interactive-on-primary)
 * - rounded-pui-button: Button radius (--pui-radius-button)
 * - shadow-pui-button: Button shadow (--pui-shadow-button)
 */
export const buttonAcornVariants = cva({
  base: [
    // Semantic color tokens - themeable
    'pui:bg-pui-interactive-primary pui:text-pui-interactive-on-primary',
    // Semantic shape tokens - themeable
    'pui:rounded-pui-button',
    // Semantic shadow tokens - themeable
    'pui:shadow-pui-button pui:hover:shadow-pui-button-hover',
    // Semantic motion tokens - themeable
    'pui:transition-shadow pui:duration-pui-normal',
    // Structural styles - hardcoded (layout, cursor, etc.)
    'pui:inline-flex pui:items-center pui:justify-center',
    // Typography (using semantic approach but keeping specific values for now)
    'pui:leading-[1.335rem] pui:font-bold pui:uppercase'
  ],
  variants: {
    size: {
      small: 'pui:px-5 pui:py-1.5 pui:text-base pui:tracking-widest',
      default: 'pui:px-8 pui:py-2.5 pui:text-lg pui:tracking-[0.1125rem]'
    }
  }
});
