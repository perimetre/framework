import { type BrandVariants } from '@/lib/brand-registry';
import { compose } from '@/lib/cva';
import {
  statItemContentAcornVariants,
  statItemContentRowAcornVariants,
  statItemExtraAcornVariants,
  statItemEyebrowAcornVariants,
  statItemPrependAcornVariants,
  statItemWrapperAcornVariants
} from './StatItem.acorn.brand';
import { statItemContentMicrobirdVariants } from './StatItem.microbird.brand';

export const statItemWrapperBrandVariants = {
  acorn: statItemWrapperAcornVariants
} as const satisfies BrandVariants<typeof statItemWrapperAcornVariants>;

export const statItemEyebrowBrandVariants = {
  acorn: statItemEyebrowAcornVariants
} as const satisfies BrandVariants<typeof statItemEyebrowAcornVariants>;

export const statItemContentRowBrandVariants = {
  acorn: statItemContentRowAcornVariants
} as const satisfies BrandVariants<typeof statItemContentRowAcornVariants>;

export const statItemContentBrandVariants = {
  acorn: statItemContentAcornVariants,
  'microbird-commercial': compose(
    statItemContentAcornVariants,
    statItemContentMicrobirdVariants
  ),
  'microbird-school': compose(
    statItemContentAcornVariants,
    statItemContentMicrobirdVariants
  )
} as const satisfies BrandVariants<typeof statItemContentAcornVariants>;

export const statItemPrependBrandVariants = {
  acorn: statItemPrependAcornVariants
} as const satisfies BrandVariants<typeof statItemPrependAcornVariants>;

export const statItemExtraBrandVariants = {
  acorn: statItemExtraAcornVariants
} as const satisfies BrandVariants<typeof statItemExtraAcornVariants>;
