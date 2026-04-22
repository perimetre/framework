import { type BrandVariants } from '@/lib/brand-registry';
import { paginatedCarouselDotAcornVariants } from './PaginatedCarouselDot.acorn.brand';
import { paginatedCarouselDotsContainerAcornVariants } from './PaginatedCarouselDotsContainer.acorn.brand';

export const paginatedCarouselDotsContainerBrandVariants = {
  acorn: paginatedCarouselDotsContainerAcornVariants
} as const satisfies BrandVariants<
  typeof paginatedCarouselDotsContainerAcornVariants
>;

export const paginatedCarouselDotBrandVariants = {
  acorn: paginatedCarouselDotAcornVariants
} as const satisfies BrandVariants<typeof paginatedCarouselDotAcornVariants>;
