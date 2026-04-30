import { type BrandVariants } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  collapseAcornVariants,
  collapseContentAcornVariants,
  collapseContentInnerAcornVariants,
  collapseEyebrowAcornVariants,
  collapseHeadingAcornVariants,
  collapseIconAcornVariants,
  collapseTitleAcornVariants,
  collapseTriggerAcornVariants
} from './Collapse.acorn.brand';

export const collapseBrandVariants = {
  acorn: collapseAcornVariants
} as const satisfies BrandVariants<typeof collapseAcornVariants>;

export const collapseTriggerBrandVariants = {
  acorn: collapseTriggerAcornVariants
} as const satisfies BrandVariants<typeof collapseTriggerAcornVariants>;

export const collapseHeadingBrandVariants = {
  acorn: collapseHeadingAcornVariants
} as const satisfies BrandVariants<typeof collapseHeadingAcornVariants>;

export const collapseEyebrowBrandVariants = {
  acorn: collapseEyebrowAcornVariants
} as const satisfies BrandVariants<typeof collapseEyebrowAcornVariants>;

export const collapseTitleBrandVariants = {
  acorn: collapseTitleAcornVariants
} as const satisfies BrandVariants<typeof collapseTitleAcornVariants>;

export const collapseIconBrandVariants = {
  acorn: collapseIconAcornVariants
} as const satisfies BrandVariants<typeof collapseIconAcornVariants>;

export const collapseContentBrandVariants = {
  acorn: collapseContentAcornVariants
} as const satisfies BrandVariants<typeof collapseContentAcornVariants>;

export const collapseContentInnerBrandVariants = {
  acorn: collapseContentInnerAcornVariants
} as const satisfies BrandVariants<typeof collapseContentInnerAcornVariants>;

export type CollapseVariantProps = VariantProps<typeof collapseAcornVariants>;
