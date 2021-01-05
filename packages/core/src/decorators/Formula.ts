import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../enums';
import { EntityProperty, AnyEntity } from '../typings';
import { Utils } from '../utils/Utils';
import { PropertyOptions } from './Property';

export function Formula<T>(formula: string | ((alias: string) => string), options: FormulaOptions<T> = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    meta.properties[propertyName] = Object.assign({ name: propertyName, reference: ReferenceType.SCALAR, persist: false, formula }, options) as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface FormulaOptions<T> extends PropertyOptions<T> { }
