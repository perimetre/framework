import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import { paginatedCarouselContainerBrandVariants } from './brands';

export type PaginatedCarouselContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof paginatedCarouselContainerBrandVariants.acorn>;

/**
 * Container for PaginatedCarousel slides
 */
const PaginatedCarouselContainer: React.FC<PaginatedCarouselContainerProps> = ({
  children,
  className,
  ...props
}) => {
  const paginatedCarouselContainerVariants = getBrandVariant(
    paginatedCarouselContainerBrandVariants
  );

  return (
    <div
      className={paginatedCarouselContainerVariants({ className })}
      {...props}
    >
      {children}
    </div>
  );
};

export default PaginatedCarouselContainer;
