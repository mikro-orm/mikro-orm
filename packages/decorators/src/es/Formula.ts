import {
  type EntityKey,
  type EntityProperty,
  type PropertyOptions,
  MetadataStorage,
  ReferenceKind,
} from '@mikro-orm/core';

export function Formula<T extends object>(formula: string | ((alias: string) => string), options: FormulaOptions<T> = {}) {
  return function (target: T, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      formula,
      ...options,
    } as EntityProperty<T>;
  };
}

export interface FormulaOptions<T> extends PropertyOptions<T> { }
