/**
 * A helper type that will append a type(`AppendType`) only to the keys that contain another type(`KeyOfType`)
 */
export type AppendTypeToKeyOfType<TModel, AppendType, KeyOfType> = {
  // Ref: https://stackoverflow.com/questions/66747860/is-it-possible-to-have-an-augment-conditional-type-that-adds-undefined-only-t/66748010#66748010
  [key in keyof TModel]: KeyOfType extends TModel[key]
    ? AppendType | TModel[key]
    : TModel[key];
};

/**
 * A helper type that will append `undefined` only to keys that are `null`
 */
export type AppendUndefinedWhereItsNull<TModel> = AppendTypeToKeyOfType<
  TModel,
  undefined,
  null
>;

/**
 * Make keys K required without stripping `| undefined` from their value types.
 * This preserves explicit `undefined` unions (and any widened undefined) while
 * ensuring the properties themselves are required to be present.
 * Implementation detail:
 * - We enforce presence using a required `unknown` property, then intersect with `Pick<T, K>` to preserve the original value type exactly (including explicit `| undefined`).
 * - This avoids TypeScript's behavior that can drop undefined` when removing the optional modifier with `-?`.
 */
export type ForceRequiredProps<T, K extends keyof T> = Omit<T, K> &
  Pick<T, K> &
  Required<Record<K, unknown>>;

/**
 * A helper type that transforms selected fields in partial, and leave others intact. Oposite of `PickOtherwisePartial`
 */
export type PartialPick<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * A helper type that picks the provided properties, and make all other properties optional. Oposite of `PartialPick`
 */
export type PickOtherwisePartial<T, K extends keyof T> = Partial<Omit<T, K>> &
  Pick<T, K>;

/**
 * A helper type that will remove the `Promise<Type>` from a type and only return the innter `Type`
 * @deprecated Use `Awaited<Type>` instead
 */
export type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
