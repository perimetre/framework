import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  imageCarouselDotBrandVariants,
  imageCarouselDotsContainerBrandVariants
} from './brands';

export type ImageCarouselDotProps = {
  index: number;
  isSelected: boolean;
  onClick: () => void;
} & VariantProps<typeof imageCarouselDotBrandVariants.acorn>;

export type ImageCarouselDotsContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselDotsContainerBrandVariants.acorn>;

/**
 * Container for dot indicators
 */
export const ImageCarouselDotsContainer: React.FC<
  ImageCarouselDotsContainerProps
> = ({ children, className, ...props }) => {
  const imageCarouselDotsContainerVariants = getBrandVariant(
    imageCarouselDotsContainerBrandVariants
  );

  return (
    <div
      className={imageCarouselDotsContainerVariants({ className })}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Individual dot indicator
 */
export const ImageCarouselDot: React.FC<ImageCarouselDotProps> = ({
  index,
  isSelected,
  onClick,
  ...props
}) => {
  const imageCarouselDotVariants = getBrandVariant(
    imageCarouselDotBrandVariants
  );

  return (
    <button
      aria-label={`Go to slide ${String(index + 1)}`}
      className={imageCarouselDotVariants({ selected: isSelected })}
      onClick={onClick}
      {...props}
    />
  );
};
