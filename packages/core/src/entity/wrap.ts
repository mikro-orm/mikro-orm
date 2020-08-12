import { AnyEntity, IWrappedEntity, IWrappedEntityInternal } from '../typings';
import { BaseEntity } from './BaseEntity';

/**
 * returns WrappedEntity instance associated with this entity. This includes all the internal properties like `__meta` or `__em`.
 */
export function wrap<T, PK extends keyof T>(entity: T, preferHelper: true): IWrappedEntityInternal<T, PK>;

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 */
export function wrap<T, PK extends keyof T>(entity: T, preferHelper?: false): IWrappedEntity<T, PK>;

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 * use `preferHelper = true` to have access to the internal `__` properties like `__meta` or `__em`
 */
export function wrap<T extends AnyEntity<T>, PK extends keyof T>(entity: T, preferHelper = false): IWrappedEntity<T, PK> | IWrappedEntityInternal<T, PK> {
  if (entity instanceof BaseEntity && !preferHelper) {
    return entity as unknown as IWrappedEntity<T, PK>;
  }

  if (entity) {
    return entity.__helper!;
  }

  return entity as unknown as IWrappedEntity<T, PK>;
}
