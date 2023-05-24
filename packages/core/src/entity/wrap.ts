import type { Dictionary, IWrappedEntity, IWrappedEntityInternal } from '../typings';

/**
 * returns WrappedEntity instance associated with this entity. This includes all the internal properties like `__meta` or `__em`.
 */
export function wrap<T extends object>(entity: T, preferHelper: true): IWrappedEntityInternal<T>;

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 */
export function wrap<T extends object>(entity: T, preferHelper?: false): IWrappedEntity<T>;

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 * use `preferHelper = true` to have access to the internal `__` properties like `__meta` or `__em`
 */
export function wrap<T extends object>(entity: T & Dictionary, preferHelper = false): IWrappedEntity<T> | IWrappedEntityInternal<T> {
  if (!entity) {
    return entity;
  }

  if (entity.__baseEntity && !preferHelper) {
    return entity as unknown as IWrappedEntity<T>;
  }

  return entity.__helper ?? entity;
}

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 * use `preferHelper = true` to have access to the internal `__` properties like `__meta` or `__em`
 * @internal
 */
export function helper<T>(entity: T): IWrappedEntityInternal<T> {
  return (entity as Dictionary).__helper;
}
