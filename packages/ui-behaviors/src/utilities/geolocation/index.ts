import type { GeoPosition } from '../geo/index.js';

/**
 * How a request for the user's position ended: the position, or a
 * `GeolocationError`. Narrow with `'ok' in result`.
 */
export type GeolocationResult =
  | { ok: true; position: GeoPosition }
  | GeolocationError;

/**
 * Why a request for the user's position failed.
 *
 * - `denied`: the user or the browser's settings refused.
 * - `unavailable`: the browser has no geolocation, or could not find a
 *   position in time.
 */
export class GeolocationError extends Error {
  override name = 'GeolocationError';
  readonly reason: 'denied' | 'unavailable';

  /**
   * Records why no position came back.
   * @param reason - `denied` or `unavailable`
   */
  constructor(reason: 'denied' | 'unavailable') {
    super(
      reason === 'denied'
        ? 'The user or the browser refused to share the position'
        : 'The browser could not give a position'
    );
    this.reason = reason;
  }
}

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
      resolve(new GeolocationError('unavailable'));
      return;
    }

    geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          ok: true as const,
          position: { lat: coords.latitude, lng: coords.longitude }
        });
      },
      (error) => {
        resolve(
          new GeolocationError(
            error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
          )
        );
      },
      options
    );
  });
