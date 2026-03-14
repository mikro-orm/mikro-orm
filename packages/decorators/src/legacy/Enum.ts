import {
  type EnumOptions,
  ReferenceKind,
  type AnyEntity,
  type Dictionary,
  type EntityKey,
  type EntityProperty,
} from '@mikro-orm/core';
import { getMetadataFromDecorator } from '../utils.js';

/** Defines an enum property on an entity (legacy TypeScript decorator). */
export function Enum<T extends object>(
  options: EnumOptions<AnyEntity> | (() => Dictionary) = {},
): (target: T, propertyName: string) => void {
  return function (target: T, propertyName: string): void {
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
