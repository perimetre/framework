import { defineConfig } from 'cva';
import { extendTailwindMerge } from 'tailwind-merge';

const PUI_PREFIX = 'pui:';

const twMerge = extendTailwindMerge({
  /**
   * Strips the `pui:` prefix before parsing so twMerge can resolve all conflicts.
   * Tailwind v4 places variants before the prefix (e.g. `hover:pui:bg-white`).
   * tailwind-merge's built-in `prefix` option only checks the start of the class,
   * so variant-prefixed classes are not recognized without this custom parser.
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  experimentalParseClassName: ({ className, parseClassName }) => {
    const classNameWithoutPrefix = className.includes(PUI_PREFIX)
      ? className.replace(PUI_PREFIX, '')
      : className;
    return parseClassName(classNameWithoutPrefix);
  }
});

// Ref: https://beta.cva.style/getting-started/installation#handling-style-conflicts
export const { compose, cva, cx } = defineConfig({
  hooks: {
    /**
     * Use `twMerge` to merge Tailwind CSS class names and handle conflicts.
     */
    onComplete: (className) => twMerge(className)
  }
});
