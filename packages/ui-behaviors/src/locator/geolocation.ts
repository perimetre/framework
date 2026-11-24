'use client';

import { useCallback, useState } from 'react';
import type { LocatorPosition } from './geo';

/**
 * Where a request for the user's position stands.
 *
 * - `idle`: not asked yet.
 * - `loading`: asked, waiting for the browser or the user.
 * - `success`: `position` holds it.
 * - `denied`: the user or the browser's settings refused.
 * - `unavailable`: the browser has no geolocation, or could not find a
 *   position in time.
 */
export type GeolocationStatus =
  | 'denied'
  | 'idle'
  | 'loading'
  | 'success'
  | 'unavailable';

/**
 * Asks the browser for the user's position, to use as a locator's `origin`.
 * Nothing is asked until `request` is called: call it from a button press,
 * since browsers expect a permission prompt to follow a user's action.
 * @param options - The browser's own options, like `enableHighAccuracy` and `timeout`
 */
export const useGeolocation = (options?: PositionOptions) => {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [position, setPosition] = useState<LocatorPosition | null>(null);

  const { enableHighAccuracy, maximumAge, timeout } = options ?? {};

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude });
        setStatus('success');
      },
      (error) => {
        setStatus(
          error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
        );
      },
      { enableHighAccuracy, maximumAge, timeout }
    );
  }, [enableHighAccuracy, maximumAge, timeout]);

  return {
    /** The user's position, once `status` is `success`. */
    position,
    /** Asks the browser for the user's position. */
    request,
    /** Where the request stands. */
    status
  };
};
