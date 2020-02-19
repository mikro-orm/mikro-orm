import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { PropertyOptions } from '.';
import { AnyEntity, EntityProperty } from '../typings';
import { Utils } from '../utils';

function createDecorator(options: PrimaryKeyOptions | SerializedPrimaryKeyOptions, serialized: boolean): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    const k = serialized ? 'serializedPrimaryKey' as const : 'primary' as const;
    options[k] = true;
    meta.properties[propertyName] = Object.assign({ name: propertyName, reference: ReferenceType.SCALAR }, options) as EntityProperty;
  };
}

export function PrimaryKey(options: PrimaryKeyOptions = {}): Function {
  return createDecorator(options, false);
}

export function SerializedPrimaryKey(options: SerializedPrimaryKeyOptions = {}): Function {
  return createDecorator(options, true);
}

export interface PrimaryKeyOptions extends PropertyOptions { }

export interface SerializedPrimaryKeyOptions extends PropertyOptions {
  type?: any;
}
