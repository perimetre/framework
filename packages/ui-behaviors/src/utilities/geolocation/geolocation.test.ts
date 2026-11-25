import { afterEach, expect, test } from 'bun:test';
import { requestGeolocation } from './index';

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

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
});

test('requestGeolocation: a position comes back as a value', async () => {
  browser((success) => {
    success({
      coords: { latitude: 45.5, longitude: -73.57 }
    } as GeolocationPosition);
  });
  expect(await requestGeolocation()).toEqual({
    ok: true,
    position: { lat: 45.5, lng: -73.57 }
  });
});

test('requestGeolocation: a refusal and a missing browser API are values too, never a throw', async () => {
  browser((_success, failure) => {
    failure?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError);
  });
  expect(await requestGeolocation()).toEqual({ ok: false, reason: 'denied' });

  Reflect.deleteProperty(navigator, 'geolocation');
  expect(await requestGeolocation()).toEqual({
    ok: false,
    reason: 'unavailable'
  });
});
