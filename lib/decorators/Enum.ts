import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { PropertyOptions } from '.';
import { EntityProperty, AnyEntity } from '../types';
import { Utils } from '../utils';

export function Enum(options: EnumOptions = {}): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options.name = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR, enum: true }, options) as EntityProperty;
    Utils.lookupPathFromDecorator(meta);
  };
}

export interface EnumOptions extends PropertyOptions {
  items?: (number | string)[];
}
