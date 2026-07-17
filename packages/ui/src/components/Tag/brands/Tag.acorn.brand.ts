import { cva } from '@/lib/cva';

/**
 * Acorn brand Tag variants (default/base theme).
 *
 * Uses semantic tokens for themeable properties:
 * - bg-pui-tag-bg / bg-pui-tag-bg-selected / bg-pui-tag-bg-disabled: chip fill per state
 * - text-pui-tag-fg / text-pui-tag-fg-disabled: label color
 * - rounded-pui-badge: chip corner radius (shared with Badge)
 *
 * `selected` and `disabled` are modelled as boolean variants (not pseudo-class
 * only) so the styling works whether the root is a <span> or a <button>.
 */
export const tagAcornVariants = cva({
  base: [
    // Structural
    'pui:inline-flex pui:items-center pui:justify-center pui:shrink-0 pui:whitespace-nowrap',
    // Typography — Body M (16px / 24px / regular)
    'pui:text-base pui:leading-6 pui:font-normal',
    // Themeable shape + default label color + motion
    'pui:rounded-pui-badge',
    'pui:text-pui-tag-fg',
    'pui:transition-colors pui:duration-pui-normal'
  ],
  variants: {
    size: {
      // Figma small: 8px horizontal padding, 4px gap
      small: 'pui:px-2 pui:gap-1',
      // Figma large: 40px tall, 8px padding, 12px gap
      large: 'pui:h-10 pui:px-2 pui:py-2 pui:gap-3'
    },
    selected: {
      true: 'pui:bg-pui-tag-bg-selected',
      false: 'pui:bg-pui-tag-bg'
    },
    // Applied after `selected` so the disabled fill/label win via twMerge
    disabled: {
      true: 'pui:bg-pui-tag-bg-disabled pui:text-pui-tag-fg-disabled pui:pointer-events-none',
      false: ''
    }
  },
  defaultVariants: {
    size: 'small',
    selected: false,
    disabled: false
  }
});
