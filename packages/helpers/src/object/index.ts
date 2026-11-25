/**
 * Whether a value is a plain object whose keys can be read.
 * @param value The value to check
 * @returns Whether it is a non-null object that isn't an array
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Strips out from object keys that have `undefined` as value, at every depth.
 * It copies the object through JSON, so values JSON can't hold come back the
 * way JSON writes them: a `Date` becomes its ISO string.
 * @param obj The object you want to remove undefined keys from
 * @returns a new instance of the object, with undefined values removed
 */
export const stripUndefinedFromObject = <T extends Record<string, unknown>>(
  obj: T
): T =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- TypeScript can't express T without its undefined values; the JSON copy has T's shape otherwise, as documented above
  JSON.parse(JSON.stringify(obj)) as T;

/**
 * Strips out from object keys that have `null` as value, in nested objects too
 * @param obj The object you want to remove null keys from
 * @returns a new instance of the object, with null values removed
 */
export const stripNullFromObject = <T extends Record<string, unknown>>(
  obj: T
): T =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Object.fromEntries loses T's keys; the copy has T's shape without its null values, which TypeScript can't express
  Object.fromEntries(
    Object.entries(obj)
      .filter(([, value]) => value !== null)
      .map(([key, value]): [string, unknown] => [
        key,
        isRecord(value) ? stripNullFromObject(value) : value
      ])
  ) as T;

/**
 * Strips out from object keys that have `undefined` or `null` as value
 * @param obj The object you want to remove undefined and null keys from
 * @returns a new instance of the object, with undefined and null values removed
 */
export const stripUndefinedAndNullFromObject = <
  T extends Record<string, unknown>
>(
  obj: T
) => stripNullFromObject(stripUndefinedFromObject(obj));
