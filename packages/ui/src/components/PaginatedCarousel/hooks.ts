'use client';

import {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType
} from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { useCallback, useEffect, useState } from 'react';

export type UsePaginatedCarouselOptions = {
  /**
   * Embla carousel options to customize how the carousel works.
   */
  options?: EmblaOptionsType;
  /**
   * Embla carousel plugins that extend the carousel with additional features.
   */
  plugins?: EmblaPluginType[];
};

export type UsePaginatedCarouselReturn = {
  /**
   * The Embla carousel API instance.
   */
  emblaApi: EmblaCarouselType | undefined;
  /**
   * Ref callback to attach to the carousel viewport element.
   */
  emblaRef: (node: HTMLDivElement | null) => void;
  /**
   * Whether the next button should be disabled.
   */
  nextBtnDisabled: boolean;
  /**
   * Whether the previous button should be disabled.
   */
  prevBtnDisabled: boolean;
  /**
   * Scroll to the next snap point.
   */
  scrollNext: () => void;
  /**
   * Scroll to the previous snap point.
   */
  scrollPrev: () => void;
  /**
   * The array of scroll snap positions (one per page/group).
   */
  scrollSnaps: number[];
  /**
   * Scroll to a specific snap point by index.
   */
  scrollTo: (index: number) => void;
  /**
   * The index of the currently selected snap point.
   */
  selectedIndex: number;
};

/**
 * Hook that encapsulates paginated carousel logic using Embla Carousel.
 *
 * This hook provides all the state and controls needed to build a paginated
 * carousel UI, including navigation, dot indicators, and drag/touch support.
 *
 * Can be used independently of the PaginatedCarousel component for cases
 * where custom rendering or animations are needed.
 * @example
 * const { emblaRef, scrollPrev, scrollNext, selectedIndex, scrollSnaps, scrollTo } =
 *   usePaginatedCarousel({ options: { align: 'start' } });
 */
export function usePaginatedCarousel({
  options,
  plugins
}: UsePaginatedCarouselOptions = {}): UsePaginatedCarouselReturn {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: 'center', slidesToScroll: 'auto', ...options },
    [...(plugins ?? []), WheelGesturesPlugin()]
  );

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  const onInit = useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);

    emblaApi.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);

    return () => {
      emblaApi
        .off('reInit', onInit)
        .off('reInit', onSelect)
        .off('select', onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  return {
    emblaApi,
    emblaRef,
    nextBtnDisabled,
    prevBtnDisabled,
    scrollNext,
    scrollPrev,
    scrollSnaps,
    scrollTo,
    selectedIndex
  };
}
