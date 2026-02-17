import type { ReactNode } from 'react';

/**
 * DocsLayout is a simple wrapper component that applies consistent styling to documentation pages. It uses Tailwind CSS classes to set typography and layout. The container class centers the content and sets a max width, while the prose class applies typographic styles to the content. The max-w-none class allows the content to take up the full width of the container, overriding any default max-width set by the prose class.
 */
export const DocsLayout = ({ children }: { children: ReactNode }) => (
  <div className="pui:prose pui:prose-code:text-red-600 pui:prose-code:bg-red-50 pui:prose-code:rounded pui:prose-code:px-1.5 pui:prose-code:py-0.5 pui:prose-code:text-sm pui:prose-code:before:content-none pui:prose-code:after:content-none">
    {children}
  </div>
);
