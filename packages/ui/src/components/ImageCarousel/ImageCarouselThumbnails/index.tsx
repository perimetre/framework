import { getBrandVariant } from '@/lib/brand-registry';
import { type VariantProps } from 'cva';
import {
  imageCarouselThumbnailBrandVariants,
  imageCarouselThumbnailsContainerBrandVariants
} from './brands';

export type ImageCarouselThumbnailProps = {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  renderThumbnail: () => React.ReactNode;
} & VariantProps<typeof imageCarouselThumbnailBrandVariants.acorn>;

export type ImageCarouselThumbnailsContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselThumbnailsContainerBrandVariants.acorn>;

/**
 * Container for thumbnail navigation
 */
export const ImageCarouselThumbnailsContainer: React.FC<
  ImageCarouselThumbnailsContainerProps
> = ({ children, className, orientation }) => {
  const imageCarouselThumbnailsContainerVariants = getBrandVariant(
    imageCarouselThumbnailsContainerBrandVariants
  );

  return (
    <div
      className={imageCarouselThumbnailsContainerVariants({
        className,
        orientation
      })}
    >
      {children}
    </div>
  );
};

/**
 * Individual thumbnail button
 */
export const ImageCarouselThumbnail: React.FC<ImageCarouselThumbnailProps> = ({
  index,
  isSelected,
  onClick,
  orientation,
  renderThumbnail
}) => {
  const imageCarouselThumbnailVariants = getBrandVariant(
    imageCarouselThumbnailBrandVariants
  );

  return (
    <button
      aria-label={`Go to slide ${String(index + 1)}`}
      type="button"
      className={imageCarouselThumbnailVariants({
        selected: isSelected,
        orientation
      })}
      onClick={onClick}
    >
      {renderThumbnail()}
    </button>
  );
};
