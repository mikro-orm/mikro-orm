import { MetadataStorage } from '../metadata';
import { ReferenceKind } from '../enums';
import type { EntityProperty, AnyEntity } from '../typings';
import { Utils } from '../utils/Utils';
import type { PropertyOptions } from './Property';

export function Formula<T>(formula: string | ((alias: string) => string), options: FormulaOptions<T> = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    meta.properties[propertyName] = Object.assign({ name: propertyName, kind: ReferenceKind.SCALAR, formula }, options) as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface FormulaOptions<T> extends PropertyOptions<T> { }
