import { cva } from '@/lib/cva';

/**
 * Microbird School brand override for ImageSequence360.
 * Badge background pulls from primary-9 (#FEE44E); icons render black for contrast.
 */
export const imageSequence360MicroBirdSchoolVariants = cva({
  base: [],
  variants: {
    slot: {
      badge: ['pui:bg-pui-primary-9'],
      icon: ['pui:text-black']
    }
  }
});
