import { type BrandVariants } from '@/lib/brand-registry';
import { paginatedCarouselContainerAcornVariants } from './PaginatedCarouselContainer.acorn.brand';

export const paginatedCarouselContainerBrandVariants = {
  acorn: paginatedCarouselContainerAcornVariants
} as const satisfies BrandVariants<
  typeof paginatedCarouselContainerAcornVariants
>;
