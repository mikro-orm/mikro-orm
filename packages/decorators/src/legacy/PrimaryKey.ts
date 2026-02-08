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

export function PrimaryKey<T extends object>(options: PrimaryKeyOptions<T> = {}) {
  return createDecorator(options, false);
}

export function SerializedPrimaryKey<T extends object>(options: SerializedPrimaryKeyOptions<T> = {}) {
  return createDecorator(options, true);
}
