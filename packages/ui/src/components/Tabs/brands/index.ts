import { type BrandVariants } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  tabsListAcornVariants,
  tabsTriggerAcornVariants
} from './Tabs.acorn.brand';

export const tabsListBrandVariants = {
  acorn: tabsListAcornVariants
} as const satisfies BrandVariants<typeof tabsListAcornVariants>;

export const tabsTriggerBrandVariants = {
  acorn: tabsTriggerAcornVariants
} as const satisfies BrandVariants<typeof tabsTriggerAcornVariants>;

export type TabsListVariantProps = VariantProps<typeof tabsListAcornVariants>;

export type TabsTriggerVariantProps = VariantProps<
  typeof tabsTriggerAcornVariants
>;
