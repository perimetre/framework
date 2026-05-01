import { type BrandVariants } from '@/lib/brand-registry';
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

export const accordionBrandVariants = {
  acorn: accordionAcornVariants
} as const satisfies BrandVariants<typeof accordionAcornVariants>;

export const accordionTriggerBrandVariants = {
  acorn: accordionTriggerAcornVariants
} as const satisfies BrandVariants<typeof accordionTriggerAcornVariants>;

export const accordionHeadingBrandVariants = {
  acorn: accordionHeadingAcornVariants
} as const satisfies BrandVariants<typeof accordionHeadingAcornVariants>;

export const accordionEyebrowBrandVariants = {
  acorn: accordionEyebrowAcornVariants
} as const satisfies BrandVariants<typeof accordionEyebrowAcornVariants>;

export const accordionTitleBrandVariants = {
  acorn: accordionTitleAcornVariants
} as const satisfies BrandVariants<typeof accordionTitleAcornVariants>;

export const accordionIconBrandVariants = {
  acorn: accordionIconAcornVariants
} as const satisfies BrandVariants<typeof accordionIconAcornVariants>;

export const accordionIconBarBrandVariants = {
  acorn: accordionIconBarAcornVariants
} as const satisfies BrandVariants<typeof accordionIconBarAcornVariants>;

export const accordionContentBrandVariants = {
  acorn: accordionContentAcornVariants
} as const satisfies BrandVariants<typeof accordionContentAcornVariants>;

export const accordionContentInnerBrandVariants = {
  acorn: accordionContentInnerAcornVariants
} as const satisfies BrandVariants<typeof accordionContentInnerAcornVariants>;

export type AccordionVariantProps = VariantProps<typeof accordionAcornVariants>;
