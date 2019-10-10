import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { EntityProperty, AnyEntity, PropertyOptions } from '.';
import { Utils } from '../utils';

export function SerializedPrimaryKey(options: SerializedPrimaryKeyOptions = {}): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options.name = propertyName;
    meta.serializedPrimaryKey = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
    Utils.lookupPathFromDecorator(meta);
  };
}

export interface SerializedPrimaryKeyOptions extends PropertyOptions {
  type?: any;
}
