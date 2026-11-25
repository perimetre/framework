import type { GeoPosition } from '../geo/index.js';

/**
 * How a request for the user's position ended.
 *
 * - `denied`: the user or the browser's settings refused.
 * - `unavailable`: the browser has no geolocation, or could not find a
 *   position in time.
 */
export type GeolocationResult =
  | { ok: false; reason: 'denied' | 'unavailable' }
  | { ok: true; position: GeoPosition };

/**
 * Asks the browser for the user's position, as a value and never a throw.
 * Call it from a press, since browsers expect a permission prompt to follow a
 * user's action. Resolves `unavailable` on a server.
 * @param options - The browser's own options, like `enableHighAccuracy` and `timeout`
 */
export const requestGeolocation = (options?: PositionOptions) =>
  new Promise<GeolocationResult>((resolve) => {
    // Some browsers and embedded views have the property and leave it empty.
    const geolocation: Geolocation | null | undefined =
      typeof navigator === 'undefined' ? undefined : navigator.geolocation;
    if (!geolocation) {
      resolve({ ok: false, reason: 'unavailable' });
      return;
    }

    geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          ok: true,
          position: { lat: coords.latitude, lng: coords.longitude }
        });
      },
      (error) => {
        resolve({
          ok: false,
          reason:
            error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
        });
      },
      options
    );
  });
