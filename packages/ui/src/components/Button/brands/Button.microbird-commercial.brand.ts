import { cva } from '@/lib/cva';

/**
 * MicroBird Commercial brand button variants
 *
 * Since we now use semantic tokens, the text color override is handled
 * via CSS (--pui-color-interactive-on-primary) in microbird-commercial/styles.css.
 * No JS overrides needed unless there are structural differences.
 */
export const buttonMicroBirdCommercialVariants = cva({
  base: ['pui:bg-black']
});
