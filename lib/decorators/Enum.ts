import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { PropertyOptions } from '.';
import { EntityProperty, AnyEntity, Dictionary } from '../types';
import { Utils } from '../utils';

export function Enum(options: EnumOptions | (() => Dictionary) = {}): Function {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options = options instanceof Function ? { items: options } : options;
    options.name = propertyName;

    if (options.items instanceof Function) {
      const type = options.items();
      const keys = Object.keys(type);
      options.items = Object.values<string>(type).filter(val => !keys.includes(val));
    }

    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR, enum: true }, options) as EntityProperty;
    Utils.lookupPathFromDecorator(meta);
  };
}

export interface EnumOptions extends PropertyOptions {
  items?: (number | string)[] | (() => Dictionary);
}
