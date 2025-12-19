import { cva } from '@/lib/cva';

/**
 * Sprig brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in sprig/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonSprigVariants = cva({
  base: []
});
