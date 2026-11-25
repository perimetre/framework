import type { PrimitiveContext } from '@ui-sdk/core';

/** How `createLinkedHighlight` reads and changes the highlighted item. */
export type LinkedHighlightOptions<
  State extends object,
  Reason extends string
> = {
  /**
   * Asks to highlight an item, or none, and returns whether it went through.
   * Pass the primitive's change:
   * `set: (value, details) => change("highlighted", value, details)`.
   */
  set: (
    value: null | string,
    details: { event?: Event; reason: Reason }
  ) => boolean;
  /** Reads the highlighted item's key from state, like `(state) => state.highlighted`. */
  value: (state: State) => null | string;
};

/**
 * One highlighted item, shared by every part that shows it. Hovering or
 * focusing an item in one place highlights it everywhere it appears: a place
 * in a list and its marker on a map, a legend entry and its bar in a chart, a
 * row and its point on a timeline.
 *
 * A highlight is not a selection: it follows the pointer and the focus, and
 * goes when they go.
 *
 * Call it once in `api`, keep it on the api, and wire each slot that shows an
 * item. The highlight changes often, so keep its key in the primitive's
 * `live` and write its attribute with `live()`:
 *
 * ```ts
 * item: slot<{ value: string }>({
 *   props: { value: "string" },
 *   live: live((state, part) => ({
 *     "data-highlighted": state.highlighted === part.key ? "" : undefined,
 *   })),
 *   on: {
 *     pointerenter: (event, { api, key }) =>
 *       api.highlight.enter(key, { reason: "item-hover", event }),
 *     pointerleave: (event, { api, key }) =>
 *       api.highlight.leave(key, { reason: "item-hover", event }),
 *   },
 * }),
 * ```
 *
 * Story: `src/behaviors/linked-highlight/linked-highlight.stories.tsx`, shipped with the package, shows
 * a chart and its legend.
 * @param context - The primitive's context, from `api`
 * @param options - How to read and change the highlighted item
 */
export const createLinkedHighlight = <
  Options,
  State extends object,
  Slot extends string,
  Reason extends string
>(
  context: Pick<PrimitiveContext<Options, State, Slot>, 'store'>,
  options: LinkedHighlightOptions<State, Reason>
) => {
  /** The highlighted item's key now. */
  const current = () => options.value(context.store.get());

  /**
   * Asks to highlight an item, or none.
   * @param value - The item's key, or `null`
   * @param details - The reason and event for the change callback
   * @param details.event - The DOM event behind it
   * @param details.reason - Why
   */
  const set = (
    value: null | string,
    details: { event?: Event; reason: Reason }
  ) => (current() === value ? false : options.set(value, details));

  return {
    /**
     * A pointer or the focus reached an item.
     * @param key - The item's key
     * @param details - The reason and event for the change callback
     * @param details.event - The DOM event behind it
     * @param details.reason - Why
     */
    enter: (key: string, details: { event?: Event; reason: Reason }) =>
      set(key, details),
    /**
     * Whether an item is the highlighted one.
     * @param state - The primitive's state
     * @param key - The item's key
     */
    is: (state: State, key: string) => options.value(state) === key,
    /**
     * A pointer or the focus left an item. Does nothing when another item
     * took the highlight already.
     * @param key - The item's key
     * @param details - The reason and event for the change callback
     * @param details.event - The DOM event behind it
     * @param details.reason - Why
     */
    leave: (key: string, details: { event?: Event; reason: Reason }) =>
      current() === key ? set(null, details) : false,
    set
  };
};

/** What `createLinkedHighlight` returns. */
export type LinkedHighlightBehavior = ReturnType<typeof createLinkedHighlight>;
