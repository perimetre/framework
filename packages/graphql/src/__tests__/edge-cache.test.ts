import { describe, expect, test } from 'bun:test';
import {
  applyEdgeCacheParam,
  EDGE_CACHE_MAX_TTL,
  EDGE_WINDOW_PARAM
} from '../apq.js';

const ENDPOINT =
  'https://cms.example.test/graphql?queryId=abc&operationName=GetPosts';

/** 2026-11-19T15:25:00Z — the start of a 5-minute window. */
const T_1525 = Date.UTC(2026, 10, 19, 15, 25, 0);

/**
 * A clock frozen at `ms`.
 * @param ms - The time it always returns, in milliseconds since the epoch.
 * @returns The clock.
 */
const at = (ms: number) => () => ms;

/**
 * The URL `applyEdgeCacheParam` produces for a TTL at a given time.
 * @param edgeCache - The requested TTL.
 * @param now - The clock.
 * @returns The resulting URL.
 */
const urlFor = (edgeCache: number | undefined, now: () => number) => {
  const url = new URL(ENDPOINT);
  applyEdgeCacheParam(url, edgeCache, now);
  return url;
};

describe('applyEdgeCacheParam', () => {
  test('adds edgeCache and the window floor(now / ttl)', () => {
    const url = urlFor(300, at(T_1525));

    expect(url.searchParams.get('edgeCache')).toBe('300');
    expect(url.searchParams.get(EDGE_WINDOW_PARAM)).toBe(
      String(Math.floor(T_1525 / 1000 / 300))
    );
  });

  test('keeps one URL for the whole window, so requests share a copy', () => {
    expect(urlFor(300, at(T_1525 + 299_999)).href).toBe(
      urlFor(300, at(T_1525)).href
    );
  });

  test('moves to a new URL when the window ends, so the next read is fresh', () => {
    const before = urlFor(300, at(T_1525));
    const after = urlFor(300, at(T_1525 + 300_000));

    expect(after.href).not.toBe(before.href);
    expect(Number(after.searchParams.get(EDGE_WINDOW_PARAM))).toBe(
      Number(before.searchParams.get(EDGE_WINDOW_PARAM)) + 1
    );
  });

  test('follows the TTL the server honours, capped at EDGE_CACHE_MAX_TTL', () => {
    const url = urlFor(86_400, at(T_1525));

    expect(url.searchParams.get('edgeCache')).toBe('86400');
    expect(url.searchParams.get(EDGE_WINDOW_PARAM)).toBe(
      String(Math.floor(T_1525 / 1000 / EDGE_CACHE_MAX_TTL))
    );
  });

  test('adds no window, and never reads the clock, without a positive TTL', () => {
    /**
     * A clock that must never be read.
     * @throws {Error} Always: reading it fails the test.
     */
    const never = () => {
      throw new Error('the clock is read only when a window is added');
    };

    expect(urlFor(undefined, never).href).toBe(ENDPOINT);
    expect(urlFor(1.5, never).href).toBe(ENDPOINT);
    expect(urlFor(-1, never).href).toBe(ENDPOINT);

    const zero = urlFor(0, never);
    expect(zero.searchParams.get('edgeCache')).toBe('0');
    expect(zero.searchParams.has(EDGE_WINDOW_PARAM)).toBe(false);
  });
});
