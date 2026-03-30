import { getBrandVariant } from '@/lib/brand-registry';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import {
  carouselButtonBrandVariants,
  type CarouselButtonVariantProps
} from './brands';

export type CarouselButtonProps = {
  'aria-label': string;
  direction: 'next' | 'prev';
} & CarouselButtonVariantProps &
  Omit<React.ComponentProps<'button'>, 'aria-label'>;

/**
 * Brand-aware circular button for carousel navigation.
 * Renders a chevron icon based on the `direction` prop.
 */
const CarouselButton: React.FC<CarouselButtonProps> = ({
  className,
  direction,
  ...props
}) => {
  const carouselButtonVariants = getBrandVariant(carouselButtonBrandVariants);
  const Icon = direction === 'prev' ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <button className={carouselButtonVariants({ className })} {...props}>
      <Icon className="pui:h-5 pui:w-5" />
    </button>
  );
};

export default CarouselButton;
