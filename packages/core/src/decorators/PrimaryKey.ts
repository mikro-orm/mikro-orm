import { MetadataStorage, MetadataValidator } from '../metadata';
import { ReferenceType } from '../enums';
import type { PropertyOptions } from './Property';
import type { AnyEntity, EntityProperty } from '../typings';
import { Utils } from '../utils/Utils';

function createDecorator<T>(options: PrimaryKeyOptions<T> | SerializedPrimaryKeyOptions<T>, serialized: boolean) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceType.SCALAR);
    const k = serialized ? 'serializedPrimaryKey' as const : 'primary' as const;
    options[k] = true;
    meta.properties[propertyName] = Object.assign({ name: propertyName, reference: ReferenceType.SCALAR }, options) as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}

export function PrimaryKey<T>(options: PrimaryKeyOptions<T> = {}) {
  return createDecorator(options, false);
}

export function SerializedPrimaryKey<T>(options: SerializedPrimaryKeyOptions<T> = {}) {
  return createDecorator(options, true);
}

export interface PrimaryKeyOptions<T> extends PropertyOptions<T> { }

export interface SerializedPrimaryKeyOptions<T> extends PropertyOptions<T> {
  type?: any;
}
