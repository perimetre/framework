import { type BrandVariants } from '@/lib/brand-registry';
import { paginatedCarouselRootAcornVariants } from './PaginatedCarouselRoot.acorn.brand';

export const paginatedCarouselRootBrandVariants = {
  acorn: paginatedCarouselRootAcornVariants
} as const satisfies BrandVariants<typeof paginatedCarouselRootAcornVariants>;
