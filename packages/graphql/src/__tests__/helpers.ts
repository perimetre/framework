import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { isRecord } from '../utils.js';

/**
 * Shared fixtures for the executor tests. `src/__tests__/` is excluded from
 * the build and from the typecheck of the published surface.
 */

/** A function shaped like `fetch`, as a test double writes it. */
export type FetchLike = (
  input: Parameters<typeof fetch>[0],
  init?: RequestInit
) => Promise<Response>;

/**
 * Types a fetch double as `fetch`. Bun's `fetch` type also carries a
 * `preconnect` method, which a double gets as a no-op.
 * @param fn - The double
 */
export const asFetch = (fn: FetchLike): typeof fetch =>
  Object.assign(fn, {
    /** Not used by the code under test. */
    preconnect: () => undefined
  });

/**
 * Narrows a thrown or returned value to a class, failing the test when it
 * isn't an instance of it.
 * @param value - What the call threw or returned
 * @param type - The class it should be an instance of
 */
export const expectInstance = <T>(
  value: unknown,
  type: abstract new (...args: never[]) => T
): T => {
  if (value instanceof type) return value;
  throw new Error(`Expected an instance of ${type.name}`);
};

/**
 * Reads a recorded call's body as a JSON object, failing the test when it
 * isn't one.
 * @param call - The recorded call
 */
export const jsonBody = (
  call: RecordedCall | undefined
): Record<string, unknown> => {
  const body = call?.init?.body;
  if (typeof body !== 'string') throw new Error('Expected a string body');
  const parsed: unknown = JSON.parse(body);
  if (!isRecord(parsed)) throw new Error('Expected a JSON object body');
  return parsed;
};

/**
 * A script that answers a GET with `get` and anything else with `post`, for
 * tests of what follows a failed GET.
 * @param get - The GET's answer
 * @param post - The POST's answer
 */
export const getThenPost =
  (
    get: () => Promise<Response> | Response,
    post: () => Promise<Response> | Response
  ): FetchScript =>
  (call) =>
    call.init?.method === 'GET' ? get() : post();

/** A scripted fetch: decides each response from the method + URL. */
export type FetchScript = (
  call: RecordedCall,
  index: number
) => Promise<Response> | Response;

/** A recorded fetch call: the final URL string and the init bun saw. */
export type RecordedCall = { init: RequestInit | undefined; url: string };

/**
 * Builds a `fetch` double that records every call and answers from `script`.
 * graphql-request passes a `URL` object; the executors pass strings — both
 * are normalized to `url`.
 */
export const createFetchMock = (
  script: FetchScript
): { calls: RecordedCall[]; fetch: typeof fetch } => {
  const calls: RecordedCall[] = [];
  /** Normalizes the input to a URL string. */
  const toUrl = (input: Parameters<typeof fetch>[0]): string =>
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  /** Records the call, then answers from the script. */
  const fetchImpl = asFetch(async (input, init) => {
    const call: RecordedCall = { init, url: toUrl(input) };
    calls.push(call);
    return script(call, calls.length - 1);
  });
  return { calls, fetch: fetchImpl };
};

/**
 * A JSON `Response` carrying a GraphQL body and arbitrary headers.
 * `Content-Type: application/json` is what graphql-request keys its parsing on.
 */
export const jsonResponse = (
  body: unknown,
  {
    headers = {},
    status = 200
  }: { headers?: Record<string, string>; status?: number } = {}
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

/** Reads the `X-GraphQL-Keys` header a test response was scripted with. */
export const keysOf = (headers: Headers | undefined): null | string =>
  headers?.get('x-graphql-keys') ?? null;

/**
 * Parses a document and (optionally) attaches the codegen-style persisted
 * query hash under `__meta__.hash`, exactly like
 * `@graphql-codegen/client-preset` with `embedHashInDocument` does.
 */
export const documentWithHash = <
  TResult = unknown,
  TVariables = Record<string, never>
>(
  source: string,
  hash?: string
): TypedDocumentNode<TResult, TVariables> => {
  const doc = parse(source) as {
    __meta__?: { hash: string };
  } & TypedDocumentNode<TResult, TVariables>;
  if (hash) doc.__meta__ = { hash };
  return doc;
};

export const GET_POSTS_SOURCE = 'query GetPosts { posts { nodes { id } } }';
export const GET_POSTS_HASH = 'a'.repeat(64);
export const GET_POSTS_DATA = { posts: { nodes: [{ id: 'cG9zdDox' }] } };
export const GET_POSTS_KEYS = `${GET_POSTS_HASH} graphql:Query GetPosts list:post cG9zdDox`;

export const UPDATE_POST_SOURCE =
  'mutation UpdatePost($id: ID!) { updatePost(input: { id: $id }) { post { id } } }';
