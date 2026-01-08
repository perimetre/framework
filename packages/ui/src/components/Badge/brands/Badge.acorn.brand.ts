import { cva } from '@/lib/cva';

/**
 * Acorn brand badge variants (default/base theme)
 * These styles apply when no specific brand is set or when data-pui-brand="acorn"
 *
 * Uses semantic tokens for themeable properties:
 * - rounded-pui-badge: Badge radius (--pui-radius-badge)
 * - Various color utilities can be passed from the callee
 *
 * Note: Color is intentionally NOT part of variants - it should be passed via className prop
 * to allow maximum flexibility at the call site.
 */
export const badgeAcornVariants = cva({
  base: [
    // Layout & display
    'pui:inline-flex pui:items-center pui:whitespace-nowrap pui:shrink-0',
    // Typography
    'pui:font-medium pui:leading-none',
    // Shape - uses semantic token for brand consistency
    'pui:rounded-pui-badge',
    // Height constraint for flex/grid layouts
    'pui:h-fit'
  ],
  variants: {
    size: {
      '1': [
        'pui:text-xs',
        'pui:leading-4',
        'pui:tracking-tight',
        'pui:px-1.5',
        'pui:py-0.5',
        'pui:gap-1.5'
      ],
      '2': [
        'pui:text-xs',
        'pui:leading-4',
        'pui:tracking-tight',
        'pui:px-2',
        'pui:py-1',
        'pui:gap-1.5'
      ],
      '3': [
        'pui:text-sm',
        'pui:leading-5',
        'pui:tracking-normal',
        'pui:px-2.5',
        'pui:py-1',
        'pui:gap-2'
      ]
    },
    variant: {
      solid: [
        // Solid variant - uses accent colors from the className prop
        // Example usage: <Badge variant="solid" className="pui:bg-blue-600 pui:text-white">
      ],
      soft: [
        // Soft variant - uses subtle background with accent text
        // Example usage: <Badge variant="soft" className="pui:bg-blue-100 pui:text-blue-700">
      ],
      surface: [
        // Surface variant - uses border with subtle background
        // Example usage: <Badge variant="surface" className="pui:bg-white pui:border pui:border-blue-200 pui:text-blue-700">
      ],
      outline: [
        // Outline variant - border only with accent text
        // Example usage: <Badge variant="outline" className="pui:border pui:border-blue-500 pui:text-blue-700">
      ]
    }
  },
  defaultVariants: {
    size: '1',
    variant: 'soft'
  }
});
