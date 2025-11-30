import { type EntityKey, type EntityProperty, type PropertyOptions, ReferenceKind } from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Formula<T extends object>(formula: string | ((alias: string) => string), options: PropertyOptions<T> = {}) {
  return function (target: T, propertyName: string) {
    const meta = getMetadataFromDecorator(target.constructor as T);
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      formula,
      ...options,
    } as EntityProperty<T>;
  };
}
