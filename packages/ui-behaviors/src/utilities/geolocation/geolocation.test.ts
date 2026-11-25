import { afterEach, expect, test } from 'bun:test';
import { GeolocationError, requestGeolocation } from './index';

/**
 * Stands in for the browser's geolocation.
 * @param getCurrentPosition - What the browser would do
 */
const browser = (getCurrentPosition: Geolocation['getCurrentPosition']) => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition }
  });
};

/** A position the browser could report, in Montréal. */
const montreal = {
  coords: {
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: 45.5,
    longitude: -73.57,
    speed: null,
    /**
     * Unused by the code under test.
     * @returns An empty object
     */
    toJSON: () => ({})
  },
  timestamp: 0,
  /**
   * Unused by the code under test.
   * @returns An empty object
   */
  toJSON: () => ({})
} satisfies GeolocationPosition;

/** The error a browser reports when the user refuses. */
const refusal = {
  code: 1,
  message: 'User denied Geolocation',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3
} satisfies GeolocationPositionError;

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
});

test('requestGeolocation: a position comes back as a value', async () => {
  browser((success) => {
    success(montreal);
  });
  expect(await requestGeolocation()).toEqual({
    ok: true,
    position: { lat: 45.5, lng: -73.57 }
  });
});

test('requestGeolocation: a refusal and a missing browser API are errors as values, never a throw', async () => {
  browser((_success, failure) => {
    failure?.(refusal);
  });
  const denied = await requestGeolocation();
  expect(denied).toBeInstanceOf(GeolocationError);
  expect(denied).toMatchObject({ reason: 'denied' });

  Reflect.deleteProperty(navigator, 'geolocation');
  const unavailable = await requestGeolocation();
  expect(unavailable).toBeInstanceOf(GeolocationError);
  expect(unavailable).toMatchObject({ reason: 'unavailable' });
});
