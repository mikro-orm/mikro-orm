import { MetadataStorage } from '../metadata';
import { ReferenceKind } from '../enums';
import type { EntityKey, EntityProperty, AnyEntity } from '../typings';
import { Utils } from '../utils/Utils';
import type { PropertyOptions } from './Property';

export function Formula<T extends object>(formula: string | ((alias: string) => string), options: FormulaOptions<T> = {}) {
  return function (target: AnyEntity, propertyName: string) {
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
