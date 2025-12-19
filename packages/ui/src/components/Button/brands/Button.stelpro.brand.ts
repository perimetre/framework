import { cva } from '@/lib/cva';

/**
 * Stelpro brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in stelpro/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonStelproVariants = cva({
  base: []
});
