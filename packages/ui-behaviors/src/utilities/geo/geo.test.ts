import { expect, test } from 'bun:test';
import { distanceBetween, isInBounds, sortByDistance } from './index';

const MONTREAL = { lat: 45.5019, lng: -73.5674 };
const OTTAWA = { lat: 45.4215, lng: -75.6972 };
const TORONTO = { lat: 43.6532, lng: -79.3832 };

test('distanceBetween: metres over the sphere', () => {
  expect(distanceBetween(MONTREAL, MONTREAL)).toBe(0);
  // Montréal to Toronto is about 504 km in a straight line.
  expect(distanceBetween(MONTREAL, TORONTO) / 1000).toBeGreaterThan(495);
  expect(distanceBetween(MONTREAL, TORONTO) / 1000).toBeLessThan(515);
});

test('isInBounds: edges count, and an area can cross the antimeridian', () => {
  const quebec = { east: -70, north: 47, south: 45, west: -77 };
  expect(isInBounds(MONTREAL, quebec)).toBe(true);
  expect(isInBounds(TORONTO, quebec)).toBe(false);
  expect(isInBounds({ lat: 45, lng: -77 }, quebec)).toBe(true);

  const pacific = { east: -170, north: 10, south: -10, west: 170 };
  expect(isInBounds({ lat: 0, lng: 179 }, pacific)).toBe(true);
  expect(isInBounds({ lat: 0, lng: -179 }, pacific)).toBe(true);
  expect(isInBounds({ lat: 0, lng: 0 }, pacific)).toBe(false);
});

test('sortByDistance: nearest first, and the list it was given is untouched', () => {
  const places = [TORONTO, MONTREAL, OTTAWA];
  const sorted = sortByDistance(places, MONTREAL, (place) => place);
  expect(sorted).toEqual([MONTREAL, OTTAWA, TORONTO]);
  expect(places).toEqual([TORONTO, MONTREAL, OTTAWA]);
});
