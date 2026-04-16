import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { paginatedCarouselRootBrandVariants } from './brands';

export type PaginatedCarouselRootProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof paginatedCarouselRootBrandVariants.acorn>;

/**
 * Root container for PaginatedCarousel
 */
const PaginatedCarouselRoot: React.FC<PaginatedCarouselRootProps> = ({
  children,
  className,
  ...props
}) => {
  const paginatedCarouselRootVariants = getBrandVariant(
    paginatedCarouselRootBrandVariants
  );

  return (
    <div className={paginatedCarouselRootVariants({ className })} {...props}>
      {children}
    </div>
  );
};

export default PaginatedCarouselRoot;
