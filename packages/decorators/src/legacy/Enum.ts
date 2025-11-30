import {
  type EnumOptions,
  ReferenceKind,
  type AnyEntity,
  type Dictionary,
  type EntityKey,
  type EntityProperty,
} from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

export function Enum<T extends object>(options: EnumOptions<AnyEntity> | (() => Dictionary) = {}) {
  return function (target: T, propertyName: string) {
    const meta = getMetadataFromDecorator(target.constructor as T);
    options = options instanceof Function ? { items: options } : options;
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      enum: true,
      ...options,
    } as EntityProperty;
  };
}
