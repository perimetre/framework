import { clsx as clsxx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsxx(inputs));

export const clsx = cn;
