import { clsx as clsxx, type ClassValue } from 'clsx';
import { extendTailwindMerge, twMerge } from 'tailwind-merge';

export type { ClassValue };

export type TailwindMergeConfig = Parameters<typeof extendTailwindMerge>[0];

/**
 * Creates a `cn` function with custom tailwind-merge configuration.
 * Call once at module level, not inside components.
 * @param config - tailwind-merge extension config for custom class groups
 * @returns A `cn` function that merges classes with the extended config
 * @example
 * ```ts
 * // src/lib/cn.ts
 * import { createCn } from '@perimetre/classnames';
 *
 * export const cn = createCn({
 *   extend: {
 *     classGroups: {
 *       typography: [
 *         'typo-heading-1',
 *         'typo-heading-2',
 *         'typo-small',
 *         // ... other custom typography classes
 *       ]
 *     }
 *   }
 * });
 *
 * // Now typo classes merge correctly
 * cn('typo-small', 'typo-heading-1'); // => 'typo-heading-1'
 * ```
 */
export const createCn = (config?: TailwindMergeConfig) => {
  const merge = config ? extendTailwindMerge(config) : twMerge;
  return (...inputs: ClassValue[]) => merge(clsxx(inputs));
};

/**
 * Utility function to merge class names.
 * Uses clsx for conditional class handling and tailwind-merge for deduplication.
 */
export const cn = createCn();

export const clsx = cn;
