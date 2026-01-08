import { cva } from '@/lib/cva';

/**
 * Acorn brand ImageCarouselNavButton variant
 */
export const imageCarouselNavButtonAcornVariants = cva({
  base: [
    'pui:pointer-events-auto',
    'pui:flex',
    'pui:items-center',
    'pui:justify-center',
    'pui:w-10',
    'pui:h-10',
    'pui:rounded-full',
    'pui:bg-white',
    'pui:text-gray-700',
    'pui:shadow-md',
    'pui:transition-all',
    'pui:duration-200',
    'pui:cursor-pointer',
    'hover:pui:bg-gray-50',
    'hover:pui:shadow-lg',
    'active:pui:scale-95',
    'disabled:pui:opacity-40',
    'disabled:pui:cursor-not-allowed',
    'disabled:hover:pui:bg-white',
    'disabled:hover:pui:shadow-md'
  ]
});
