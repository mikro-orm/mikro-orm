import { Dictionary, IWrappedEntity, IWrappedEntityInternal } from '../typings';
import { ArrayCollection } from './ArrayCollection';
import { Utils } from '../utils';
import { WrappedEntity } from './WrappedEntity';
import { BaseEntity } from './BaseEntity';

/**
 * returns WrappedEntity instance associated with this entity. This includes all the internal properties like `__meta` or `__em`.
 */
export function wrap<T>(entity: T, preferHelper: true): IWrappedEntityInternal<T, keyof T>;

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 */
export function wrap<T>(entity: T, preferHelper?: false): IWrappedEntity<T, keyof T>;

/**
 * wraps entity type with WrappedEntity internal properties and helpers like init/isInitialized/populated/toJSON
 * use `preferHelper = true` to have access to the internal `__` properties like `__meta` or `__em`
 */
export function wrap<T>(entity: T, preferHelper = false): IWrappedEntity<T, keyof T> | IWrappedEntityInternal<T, keyof T> {
  if (entity instanceof BaseEntity && !preferHelper) {
    return entity as IWrappedEntity<T, keyof T>;
  }

  if (entity instanceof ArrayCollection) {
    return entity as unknown as WrappedEntity<T, keyof T>;
  }

  return (Utils.unwrapReference(entity) as Dictionary).__helper;
}
