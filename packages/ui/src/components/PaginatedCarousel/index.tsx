'use client';

import { cn } from '@perimetre/classnames';
import { type EmblaOptionsType, type EmblaPluginType } from 'embla-carousel';
import CarouselButton from '../CarouselButton';
import { usePaginatedCarousel } from './hooks';
import { PaginatedCarouselActions } from './PaginatedCarouselActions';
import PaginatedCarouselContainer from './PaginatedCarouselContainer';
import {
  PaginatedCarouselDot,
  PaginatedCarouselDotsContainer
} from './PaginatedCarouselDots';
import PaginatedCarouselRoot from './PaginatedCarouselRoot';
import PaginatedCarouselSlide from './PaginatedCarouselSlide';
import PaginatedCarouselViewport from './PaginatedCarouselViewport';

export type PaginatedCarouselItem = {
  /**
   * The content to render inside the carousel slide.
   */
  content: React.ReactNode;
  /**
   * Unique key for the carousel item.
   */
  key: string;
};

export type PaginatedCarouselProps = {
  /**
   * Optional className appended to the div wrapping dots and buttons.
   * Use this to control alignment (e.g. justify-start, justify-center, justify-end).
   */
  actionsClassName?: string;
  /**
   * Additional className for the root element.
   */
  className?: string;
  /**
   * Array of items to display in the carousel.
   */
  items: PaginatedCarouselItem[];
  /**
   * Embla carousel options to customize how the carousel works.
   */
  options?: EmblaOptionsType;
  /**
   * Embla carousel plugins that extend the carousel with additional features.
   */
  plugins?: EmblaPluginType[];
  /**
   * Whether to show the arrow navigation buttons. Defaults to true.
   */
  showButtons?: boolean;
  /**
   * Whether to show dot indicators. Defaults to true.
   */
  showDots?: boolean;
  /**
   * Additional className for the viewport element.
   */
  viewportClassName?: string;
};

/**
 * Paginated carousel component for displaying arbitrary content in a scrollable,
 * paginated layout with optional dots and navigation buttons.
 *
 * Unlike ImageCarousel, this component does not include lazy loading and its
 * slides are content-agnostic — each item's `content` can be any React node.
 *
 * The carousel supports mouse drag, touchpad scroll, and touch gestures.
 *
 * Features:
 * - Content-agnostic slides (cards, divs, any React node)
 * - Navigation arrows (optional)
 * - Dot indicators per page/snap point (optional)
 * - Wheel gesture support
 * - Touch/drag support
 * - Brand-aware styling
 */
const PaginatedCarousel: React.FC<PaginatedCarouselProps> = ({
  actionsClassName,
  className,
  items,
  options,
  plugins,
  showButtons = true,
  showDots = true,
  viewportClassName
}) => {
  const {
    emblaRef,
    nextBtnDisabled,
    prevBtnDisabled,
    scrollNext,
    scrollPrev,
    scrollSnaps,
    scrollTo,
    selectedIndex
  } = usePaginatedCarousel({ options, plugins });

  const hasActions = showDots || showButtons;

  return (
    <PaginatedCarouselRoot
      className={className}
      data-pui-component="PaginatedCarousel"
    >
      <PaginatedCarouselViewport
        ref={emblaRef}
        className={cn(viewportClassName)}
      >
        <PaginatedCarouselContainer data-pui-component="Container">
          {items.map((item) => (
            <PaginatedCarouselSlide key={item.key} data-pui-component="Slide">
              {item.content}
            </PaginatedCarouselSlide>
          ))}
        </PaginatedCarouselContainer>
      </PaginatedCarouselViewport>

      {hasActions && (
        <PaginatedCarouselActions
          actionsClassName={actionsClassName}
          data-pui-component="Actions"
        >
          {showButtons && (
            <CarouselButton
              aria-label="Previous page"
              className="pui:bg-transparent pui:shadow-none pui:border pui:border-pui-overlay-7 pui:text-pui-overlay-11 hover:pui:bg-pui-overlay-2 hover:pui:shadow-none disabled:hover:pui:bg-transparent"
              data-pui-component="NavButton"
              direction="prev"
              disabled={prevBtnDisabled}
              onClick={scrollPrev}
            />
          )}

          {showDots && (
            <PaginatedCarouselDotsContainer data-pui-component="DotsContainer">
              {scrollSnaps.map((_, index) => (
                <PaginatedCarouselDot
                  key={index}
                  data-pui-component="CarouselDot"
                  data-pui-isselected={index === selectedIndex}
                  index={index}
                  isSelected={index === selectedIndex}
                  onClick={() => {
                    scrollTo(index);
                  }}
                />
              ))}
            </PaginatedCarouselDotsContainer>
          )}

          {showButtons && (
            <CarouselButton
              aria-label="Next page"
              className="pui:bg-transparent pui:shadow-none pui:border pui:border-pui-overlay-7 pui:text-pui-overlay-11 hover:pui:bg-pui-overlay-2 hover:pui:shadow-none disabled:hover:pui:bg-transparent"
              data-pui-component="NavButton"
              direction="next"
              disabled={nextBtnDisabled}
              onClick={scrollNext}
            />
          )}
        </PaginatedCarouselActions>
      )}
    </PaginatedCarouselRoot>
  );
};

export default PaginatedCarousel;

export {
  usePaginatedCarousel,
  type UsePaginatedCarouselOptions,
  type UsePaginatedCarouselReturn
} from './hooks';
