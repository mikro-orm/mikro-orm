import {
  ReferenceKind,
  type PrimaryKeyOptions,
  type SerializedPrimaryKeyOptions,
  type EntityKey,
  type EntityProperty,
} from '@mikro-orm/core';
import { validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

function createDecorator<T extends object>(
  options: PrimaryKeyOptions<T> | SerializedPrimaryKeyOptions<T>,
  serialized: boolean,
) {
  return function (target: T, propertyName: string) {
    const meta = getMetadataFromDecorator(target.constructor as T);
    validateSingleDecorator(meta, propertyName, ReferenceKind.SCALAR);
    const k = serialized ? ('serializedPrimaryKey' as const) : ('primary' as const);
    options[k] = true;
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      ...options,
    } as EntityProperty<T>;
  };
}

/** Marks a property as the primary key of an entity (legacy TypeScript decorator). */
export function PrimaryKey<T extends object>(
  options: PrimaryKeyOptions<T> = {},
): (target: T, propertyName: string) => void {
  return createDecorator(options, false);
}

/** Marks a property as the serialized form of the primary key, e.g. for MongoDB ObjectId (legacy TypeScript decorator). */
export function SerializedPrimaryKey<T extends object>(
  options: SerializedPrimaryKeyOptions<T> = {},
): (target: T, propertyName: string) => void {
  return createDecorator(options, true);
}
