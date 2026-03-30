import { getBrandVariant } from '@/lib/brand-registry';
import { cn } from '@perimetre/classnames';
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
> = ({ children, className, orientation, ...props }) => {
  const imageCarouselThumbnailsContainerVariants = getBrandVariant(
    imageCarouselThumbnailsContainerBrandVariants
  );

  return (
    <div
      className={imageCarouselThumbnailsContainerVariants({
        className,
        orientation
      })}
      {...props}
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
  renderThumbnail,
  ...props
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
      {...props}
    >
      <span
        className={cn(
          'pui:block pui:size-full pui:transition-opacity pui:duration-200',
          isSelected ? 'pui:opacity-100' : 'pui:opacity-60 hover:pui:opacity-80'
        )}
      >
        {renderThumbnail()}
      </span>
    </button>
  );
};
