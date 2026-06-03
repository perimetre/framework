import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import { type VariantProps } from 'cva';
import {
  accordionAcornVariants,
  accordionContentAcornVariants,
  accordionContentInnerAcornVariants,
  accordionEyebrowAcornVariants,
  accordionHeadingAcornVariants,
  accordionIconAcornVariants,
  accordionIconBarAcornVariants,
  accordionTitleAcornVariants,
  accordionTriggerAcornVariants
} from './Accordion.acorn.brand';
import {
  accordionContentInnerStelproVariants,
  accordionIconStelproVariants,
  accordionStelproVariants,
  accordionTriggerStelproVariants
} from './Accordion.stelpro.brand';

export const accordionBrandVariants = {
  acorn: accordionAcornVariants,
  stelpro: compose(accordionAcornVariants, accordionStelproVariants)
  // 'microbird-school': compose(accordionAcornVariants, accordionMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionAcornVariants, accordionMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionAcornVariants>;

export const accordionTriggerBrandVariants = {
  acorn: accordionTriggerAcornVariants,
  stelpro: compose(
    accordionTriggerAcornVariants,
    accordionTriggerStelproVariants
  )
  // 'microbird-school': compose(accordionTriggerAcornVariants, accordionTriggerMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionTriggerAcornVariants, accordionTriggerMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionTriggerAcornVariants>;

export const accordionHeadingBrandVariants = {
  acorn: accordionHeadingAcornVariants
  // 'microbird-school': compose(accordionHeadingAcornVariants, accordionHeadingMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionHeadingAcornVariants, accordionHeadingMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionHeadingAcornVariants>;

export const accordionEyebrowBrandVariants = {
  acorn: accordionEyebrowAcornVariants
  // 'microbird-school': compose(accordionEyebrowAcornVariants, accordionEyebrowMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionEyebrowAcornVariants, accordionEyebrowMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionEyebrowAcornVariants>;

export const accordionTitleBrandVariants = {
  acorn: accordionTitleAcornVariants
  // 'microbird-school': compose(accordionTitleAcornVariants, accordionTitleMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionTitleAcornVariants, accordionTitleMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionTitleAcornVariants>;

export const accordionIconBrandVariants = {
  acorn: accordionIconAcornVariants,
  stelpro: compose(accordionIconAcornVariants, accordionIconStelproVariants)
  // 'microbird-school': compose(accordionIconAcornVariants, accordionIconMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionIconAcornVariants, accordionIconMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionIconAcornVariants>;

export const accordionIconBarBrandVariants = {
  acorn: accordionIconBarAcornVariants
  // 'microbird-school': compose(accordionIconBarAcornVariants, accordionIconBarMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionIconBarAcornVariants, accordionIconBarMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionIconBarAcornVariants>;

export const accordionContentBrandVariants = {
  acorn: accordionContentAcornVariants
  // 'microbird-school': compose(accordionContentAcornVariants, accordionContentMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionContentAcornVariants, accordionContentMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionContentAcornVariants>;

export const accordionContentInnerBrandVariants = {
  acorn: accordionContentInnerAcornVariants,
  stelpro: compose(
    accordionContentInnerAcornVariants,
    accordionContentInnerStelproVariants
  )
  // 'microbird-school': compose(accordionContentInnerAcornVariants, accordionContentInnerMicroBirdSchoolVariants),
  // 'microbird-commercial': compose(accordionContentInnerAcornVariants, accordionContentInnerMicroBirdCommercialVariants),
} as const satisfies BrandVariants<typeof accordionContentInnerAcornVariants>;

export type AccordionVariantProps = VariantProps<typeof accordionAcornVariants>;
