import { type BrandVariants } from '@/lib/brand-registry';
import { paginatedCarouselActionsAcornVariants } from './PaginatedCarouselActions.acorn.brand';

export const paginatedCarouselActionsBrandVariants = {
  acorn: paginatedCarouselActionsAcornVariants
} as const satisfies BrandVariants<
  typeof paginatedCarouselActionsAcornVariants
>;
