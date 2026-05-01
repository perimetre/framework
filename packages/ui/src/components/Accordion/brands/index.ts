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
  accordionContentInnerMicroBirdCommercialVariants,
  accordionContentMicroBirdCommercialVariants,
  accordionEyebrowMicroBirdCommercialVariants,
  accordionHeadingMicroBirdCommercialVariants,
  accordionIconBarMicroBirdCommercialVariants,
  accordionIconMicroBirdCommercialVariants,
  accordionMicroBirdCommercialVariants,
  accordionTitleMicroBirdCommercialVariants,
  accordionTriggerMicroBirdCommercialVariants
} from './Accordion.microbird-commercial.brand';
import {
  accordionContentInnerMicroBirdSchoolVariants,
  accordionContentMicroBirdSchoolVariants,
  accordionEyebrowMicroBirdSchoolVariants,
  accordionHeadingMicroBirdSchoolVariants,
  accordionIconBarMicroBirdSchoolVariants,
  accordionIconMicroBirdSchoolVariants,
  accordionMicroBirdSchoolVariants,
  accordionTitleMicroBirdSchoolVariants,
  accordionTriggerMicroBirdSchoolVariants
} from './Accordion.microbird-school.brand';

export const accordionBrandVariants = {
  acorn: accordionAcornVariants,
  'microbird-school': compose(
    accordionAcornVariants,
    accordionMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionAcornVariants,
    accordionMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionAcornVariants>;

export const accordionTriggerBrandVariants = {
  acorn: accordionTriggerAcornVariants,
  'microbird-school': compose(
    accordionTriggerAcornVariants,
    accordionTriggerMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionTriggerAcornVariants,
    accordionTriggerMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionTriggerAcornVariants>;

export const accordionHeadingBrandVariants = {
  acorn: accordionHeadingAcornVariants,
  'microbird-school': compose(
    accordionHeadingAcornVariants,
    accordionHeadingMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionHeadingAcornVariants,
    accordionHeadingMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionHeadingAcornVariants>;

export const accordionEyebrowBrandVariants = {
  acorn: accordionEyebrowAcornVariants,
  'microbird-school': compose(
    accordionEyebrowAcornVariants,
    accordionEyebrowMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionEyebrowAcornVariants,
    accordionEyebrowMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionEyebrowAcornVariants>;

export const accordionTitleBrandVariants = {
  acorn: accordionTitleAcornVariants,
  'microbird-school': compose(
    accordionTitleAcornVariants,
    accordionTitleMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionTitleAcornVariants,
    accordionTitleMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionTitleAcornVariants>;

export const accordionIconBrandVariants = {
  acorn: accordionIconAcornVariants,
  'microbird-school': compose(
    accordionIconAcornVariants,
    accordionIconMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionIconAcornVariants,
    accordionIconMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionIconAcornVariants>;

export const accordionIconBarBrandVariants = {
  acorn: accordionIconBarAcornVariants,
  'microbird-school': compose(
    accordionIconBarAcornVariants,
    accordionIconBarMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionIconBarAcornVariants,
    accordionIconBarMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionIconBarAcornVariants>;

export const accordionContentBrandVariants = {
  acorn: accordionContentAcornVariants,
  'microbird-school': compose(
    accordionContentAcornVariants,
    accordionContentMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionContentAcornVariants,
    accordionContentMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionContentAcornVariants>;

export const accordionContentInnerBrandVariants = {
  acorn: accordionContentInnerAcornVariants,
  'microbird-school': compose(
    accordionContentInnerAcornVariants,
    accordionContentInnerMicroBirdSchoolVariants
  ),
  'microbird-commercial': compose(
    accordionContentInnerAcornVariants,
    accordionContentInnerMicroBirdCommercialVariants
  )
} as const satisfies BrandVariants<typeof accordionContentInnerAcornVariants>;

export type AccordionVariantProps = VariantProps<typeof accordionAcornVariants>;
