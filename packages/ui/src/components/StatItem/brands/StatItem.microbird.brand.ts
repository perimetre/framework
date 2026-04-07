import { cva } from '@/lib/cva';

/**
 * Microbird brand override for StatItem content.
 * Overrides the font family to use the display font (Big Shoulders Text)
 * instead of the default sans font (Geist).
 */
export const statItemContentMicrobirdVariants = cva({
  base: ['pui:font-pui-display']
});
