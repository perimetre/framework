import type { GlobalProvider } from '@ladle/react';
import { useEffect } from 'react';

import '@/index.css';

/**
 * Global provider for Ladle that manages theme switching
 * Uses RSC-compatible theme registry (no React Context)
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const theme = (globalState.theme as string) || 'acorn';

  useEffect(() => {
    // Update the data-theme attribute on the root element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
};
