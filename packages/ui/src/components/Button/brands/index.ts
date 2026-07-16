import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import { buttonAcornVariants } from './Button.acorn.brand';
import { buttonMicroBirdCommercialVariants } from './Button.microbird-commercial.brand';
import { buttonMicroBirdSchoolVariants } from './Button.microbird-school.brand';
import { buttonOiqVariants } from './Button.oiq-place-pour-toi.brand';
import { buttonSprigVariants } from './Button.sprig.brand';
import { buttonStelproVariants } from './Button.stelpro.brand';

export const buttonBrandVariants = {
  acorn: buttonAcornVariants,
  sprig: compose(buttonAcornVariants, buttonSprigVariants),
  stelpro: compose(buttonAcornVariants, buttonStelproVariants),
  'microbird-commercial': compose(
    buttonAcornVariants,
    buttonMicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    buttonAcornVariants,
    buttonMicroBirdSchoolVariants
  ),
  'oiq-place-pour-toi': compose(buttonAcornVariants, buttonOiqVariants)
} as const satisfies BrandVariants<typeof buttonAcornVariants>;

export type ButtonVariantProps = VariantProps<typeof buttonAcornVariants>;
