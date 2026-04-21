import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  imageSequence360BadgeAcornVariants,
  imageSequence360IconAcornVariants
} from './ImageSequence360.acorn.brand';
import {
  imageSequence360BadgeMicroBirdCommercialVariants,
  imageSequence360IconMicroBirdCommercialVariants
} from './ImageSequence360.microbird-commercial.brand';
import {
  imageSequence360BadgeMicroBirdSchoolVariants,
  imageSequence360IconMicroBirdSchoolVariants
} from './ImageSequence360.microbird-school.brand';

export const imageSequence360BadgeBrandVariants = {
  acorn: imageSequence360BadgeAcornVariants,
  sprig: imageSequence360BadgeAcornVariants,
  stelpro: imageSequence360BadgeAcornVariants,
  'microbird-commercial': compose(
    imageSequence360BadgeAcornVariants,
    imageSequence360BadgeMicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    imageSequence360BadgeAcornVariants,
    imageSequence360BadgeMicroBirdSchoolVariants
  )
} as const satisfies BrandVariants<typeof imageSequence360BadgeAcornVariants>;

export const imageSequence360IconBrandVariants = {
  acorn: imageSequence360IconAcornVariants,
  sprig: imageSequence360IconAcornVariants,
  stelpro: imageSequence360IconAcornVariants,
  'microbird-commercial': compose(
    imageSequence360IconAcornVariants,
    imageSequence360IconMicroBirdCommercialVariants
  ),
  'microbird-school': compose(
    imageSequence360IconAcornVariants,
    imageSequence360IconMicroBirdSchoolVariants
  )
} as const satisfies BrandVariants<typeof imageSequence360IconAcornVariants>;

export type ImageSequence360BadgeVariantProps = VariantProps<
  typeof imageSequence360BadgeAcornVariants
>;
export type ImageSequence360IconVariantProps = VariantProps<
  typeof imageSequence360IconAcornVariants
>;
