import { getBrandVariant } from '@/lib/brand-registry';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { type VariantProps } from 'cva';
import {
  imageCarouselControlsBrandVariants,
  imageCarouselNavButtonBrandVariants
} from './brands';

export type ImageCarouselControlsProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof imageCarouselControlsBrandVariants.acorn>;

export type ImageCarouselNavButtonProps = {
  direction: 'next' | 'prev';
  disabled?: boolean;
  onClick: () => void;
} & VariantProps<typeof imageCarouselNavButtonBrandVariants.acorn>;

/**
 * Container for navigation controls
 */
export const ImageCarouselControls: React.FC<ImageCarouselControlsProps> = ({
  children,
  className
}) => {
  const imageCarouselControlsVariants = getBrandVariant(
    imageCarouselControlsBrandVariants
  );

  return (
    <div className={imageCarouselControlsVariants({ className })}>
      {children}
    </div>
  );
};

/**
 * Navigation button (prev/next)
 */
export const ImageCarouselNavButton: React.FC<ImageCarouselNavButtonProps> = ({
  direction,
  disabled,
  onClick
}) => {
  const imageCarouselNavButtonVariants = getBrandVariant(
    imageCarouselNavButtonBrandVariants
  );

  return (
    <button
      aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
      className={imageCarouselNavButtonVariants()}
      disabled={disabled}
      onClick={onClick}
    >
      {direction === 'prev' ? (
        <ChevronLeftIcon className="pui:w-5 pui:h-5" />
      ) : (
        <ChevronRightIcon className="pui:w-5 pui:h-5" />
      )}
    </button>
  );
};
