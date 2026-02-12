'use client';

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren
} from 'react';

export type GoogleContextValue = {
  apiKey: string;
  language?: string;
  region?: string;
};

const GoogleContext = createContext<GoogleContextValue | null>(null);

export type GoogleProviderProps = PropsWithChildren<{
  /** Google Maps Platform API key */
  apiKey: string;
  /** Language for Google services (e.g., 'en', 'fr') */
  language?: string;
  /** Region bias for Google services (e.g., 'ca', 'us') */
  region?: string;
}>;

/**
 * Provides Google API configuration to descendant components.
 * Wrap your app (or a subtree) with this provider to enable Google-powered
 * components like FieldGooglePlacesAutocomplete.
 *
 * This provider stores configuration only — no scripts are loaded until a
 * consumer component mounts and requests a specific Google library.
 * @example
 * // layout.tsx
 * import { GoogleProvider } from '@perimetre/ui/components/GoogleProvider';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <GoogleProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
 *       {children}
 *     </GoogleProvider>
 *   );
 * }
 */
export const GoogleProvider: React.FC<GoogleProviderProps> = ({
  apiKey,
  children,
  language,
  region
}) => {
  const value = useMemo(
    () => ({ apiKey, language, region }),
    [apiKey, language, region]
  );

  return (
    <GoogleContext.Provider value={value}>{children}</GoogleContext.Provider>
  );
};

/**
 * Access Google API configuration from the nearest GoogleProvider.
 * Throws if used outside of a GoogleProvider.
 */
export function useGoogleContext(): GoogleContextValue {
  const context = useContext(GoogleContext);
  if (!context) {
    throw new Error(
      'useGoogleContext must be used within a <GoogleProvider>. ' +
        'Wrap your app with <GoogleProvider apiKey="..."> to use Google-powered components.'
    );
  }
  return context;
}
