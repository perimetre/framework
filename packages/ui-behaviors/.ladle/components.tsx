import type { GlobalProvider } from '@ladle/react';
import './ladle.css';

/**
 * Wraps every story. UI SDK needs no provider, so this only loads the styles
 * and gives the story some room.
 * @param props - Ladle's props
 * @param props.children - The story
 */
export const Provider: GlobalProvider = ({ children }) => (
  <div className="mx-auto max-w-3xl p-6 text-neutral-900">{children}</div>
);
