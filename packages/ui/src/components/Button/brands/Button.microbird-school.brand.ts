import { cva } from '@/lib/cva';

/**
 * MicroBird School brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in microbird-school/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonMicroBirdSchoolVariants = cva({
  base: []
});
