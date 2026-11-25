/** A map's visible area, in degrees. `west` is greater than `east` when it crosses the antimeridian. */
export type GeoBounds = {
  east: number;
  north: number;
  south: number;
  west: number;
};

/** A point on the earth, in degrees. */
export type GeoPosition = {
  lat: number;
  lng: number;
};

/** The earth's mean radius, in metres. */
const EARTH_RADIUS = 6371008.8;

/**
 * Degrees to radians.
 * @param degrees - The angle in degrees
 */
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * The distance between two points along the earth's surface, in metres. A
 * straight line over a sphere (the haversine formula), not a route by road.
 * @param from - One point
 * @param to - The other
 */
export const distanceBetween = (from: GeoPosition, to: GeoPosition) => {
  const lat = radians(to.lat - from.lat);
  const lng = radians(to.lng - from.lng);
  const a =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(lng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(a)));
};

/**
 * Whether a point is inside a map's visible area, edges included.
 * @param position - The point
 * @param bounds - The visible area
 */
export const isInBounds = (position: GeoPosition, bounds: GeoBounds) => {
  if (position.lat < bounds.south || position.lat > bounds.north) return false;
  // An area that crosses the antimeridian runs from west, up to 180, then on
  // from -180 to east.
  return bounds.west <= bounds.east
    ? position.lng >= bounds.west && position.lng <= bounds.east
    : position.lng >= bounds.west || position.lng <= bounds.east;
};

/**
 * A copy of some places, nearest first. Runs anywhere, a Server Component
 * included: sort the data with it before rendering the list.
 * @param places - The places
 * @param origin - Where distances are measured from
 * @param positionOf - Reads a place's position, like `(store) => store.position`
 */
export const sortByDistance = <Place>(
  places: readonly Place[],
  origin: GeoPosition,
  positionOf: (place: Place) => GeoPosition
) =>
  places
    .map((place) => ({
      distance: distanceBetween(origin, positionOf(place)),
      place
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.place);
