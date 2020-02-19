import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { PropertyOptions } from '.';
import { EntityProperty, AnyEntity, Dictionary } from '../typings';
import { Utils } from '../utils';

export function Enum(options: EnumOptions | (() => Dictionary) = {}): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options = options instanceof Function ? { items: options } : options;
    meta.properties[propertyName] = Object.assign({ name: propertyName, reference: ReferenceType.SCALAR, enum: true }, options) as EntityProperty;
    Utils.lookupPathFromDecorator(meta);
  };
}

export interface EnumOptions extends PropertyOptions {
  items?: (number | string)[] | (() => Dictionary);
}
