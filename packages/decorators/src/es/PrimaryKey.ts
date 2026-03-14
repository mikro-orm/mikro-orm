import {
  ReferenceKind,
  type PrimaryKeyOptions,
  type SerializedPrimaryKeyOptions,
  type EntityProperty,
  type EntityKey,
} from '@mikro-orm/core';
import { prepareMetadataContext } from '../utils.js';

function createDecorator<T extends object>(
  options: PrimaryKeyOptions<T> | SerializedPrimaryKeyOptions<T>,
  serialized: boolean,
) {
  return function (value: unknown, context: ClassFieldDecoratorContext<T>) {
    const meta = prepareMetadataContext(context, ReferenceKind.SCALAR);
    const key = serialized ? 'serializedPrimaryKey' : 'primary';
    options[key] = true;
    meta.properties[context.name as EntityKey<T>] = {
      name: context.name,
      kind: ReferenceKind.SCALAR,
      ...options,
    } as EntityProperty<T>;
  };
}

/** Marks a property as the primary key of an entity (TC39 decorator). */
export function PrimaryKey<T extends object>(
  options: PrimaryKeyOptions<T> = {},
): (value: unknown, context: ClassFieldDecoratorContext<T>) => void {
  return createDecorator(options, false);
}

/** Marks a property as the serialized form of the primary key, e.g. for MongoDB ObjectId (TC39 decorator). */
export function SerializedPrimaryKey<T extends object>(
  options: SerializedPrimaryKeyOptions<T> = {},
): (value: unknown, context: ClassFieldDecoratorContext<T>) => void {
  return createDecorator(options, true);
}
