import { defineConfig } from 'cva';
import { twMerge } from 'tailwind-merge';

// Ref: https://beta.cva.style/getting-started/installation#handling-style-conflicts
export const { compose, cva, cx } = defineConfig({
  hooks: {
    /**
     * Use `twMerge` to merge Tailwind CSS class names and handle conflicts.
     */
    onComplete: (className) => twMerge(className)
  }
});
