import { MetadataStorage, MetadataValidator } from '../metadata';
import { ReferenceKind } from '../enums';
import type { PropertyOptions } from './Property';
import type { AnyEntity, EntityKey, EntityProperty } from '../typings';
import { Utils } from '../utils/Utils';

function createDecorator<T extends object>(options: PrimaryKeyOptions<T> | SerializedPrimaryKeyOptions<T>, serialized: boolean) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.SCALAR);
    const k = serialized ? 'serializedPrimaryKey' as const : 'primary' as const;
    options[k] = true;
    meta.properties[propertyName as EntityKey<T>] = { name: propertyName, kind: ReferenceKind.SCALAR, ...options } as EntityProperty<T>;

    return Utils.propertyDecoratorReturnValue();
  };
}

export function PrimaryKey<T extends object>(options: PrimaryKeyOptions<T> = {}) {
  return createDecorator(options, false);
}

export function SerializedPrimaryKey<T extends object>(options: SerializedPrimaryKeyOptions<T> = {}) {
  return createDecorator(options, true);
}

export interface PrimaryKeyOptions<T> extends PropertyOptions<T> { }

export interface SerializedPrimaryKeyOptions<T> extends PropertyOptions<T> {
  type?: any;
}
