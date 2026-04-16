import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  paginatedCarouselDotBrandVariants,
  paginatedCarouselDotsContainerBrandVariants
} from './brands';

export type PaginatedCarouselDotProps = {
  index: number;
  isSelected: boolean;
  onClick: () => void;
} & VariantProps<typeof paginatedCarouselDotBrandVariants.acorn>;

export type PaginatedCarouselDotsContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof paginatedCarouselDotsContainerBrandVariants.acorn>;

/**
 * Container for dot indicators
 */
export const PaginatedCarouselDotsContainer: React.FC<
  PaginatedCarouselDotsContainerProps
> = ({ children, className, ...props }) => {
  const paginatedCarouselDotsContainerVariants = getBrandVariant(
    paginatedCarouselDotsContainerBrandVariants
  );

  return (
    <div
      className={paginatedCarouselDotsContainerVariants({ className })}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Individual dot indicator
 */
export const PaginatedCarouselDot: React.FC<PaginatedCarouselDotProps> = ({
  index,
  isSelected,
  onClick,
  ...props
}) => {
  const paginatedCarouselDotVariants = getBrandVariant(
    paginatedCarouselDotBrandVariants
  );

  return (
    <button
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`Go to page ${String(index + 1)}`}
      className={paginatedCarouselDotVariants({ selected: isSelected })}
      onClick={onClick}
      {...props}
    />
  );
};
