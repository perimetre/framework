import { cva } from '@/lib/cva';

/**
 * Microbird Commercial brand override for ImageSequence360.
 * Badge background pulls from primary-2 (#E2ECFF) and icons from primary-9 (#004883).
 */
export const imageSequence360MicroBirdCommercialVariants = cva({
  base: [],
  variants: {
    slot: {
      badge: ['pui:bg-pui-primary-2'],
      icon: ['pui:text-pui-primary-9']
    }
  }
});
