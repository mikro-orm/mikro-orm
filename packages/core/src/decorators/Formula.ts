import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { ReferenceKind } from '../enums.js';
import type { EntityKey, EntityProperty } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import type { PropertyOptions } from './Property.js';

export function Formula<T extends object>(formula: string | ((alias: string) => string), options: FormulaOptions<T> = {}) {
  return function (target: T, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.SCALAR,
      formula,
      ...options,
    } as EntityProperty<T>;

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface FormulaOptions<T> extends PropertyOptions<T> { }
