import { AnyEntity, EntityProperty } from '../typings';
import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity/enums';
import { Utils } from '../utils';

export function Embedded(options: EmbeddedOptions | (() => AnyEntity) = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    options = options instanceof Function ? { entity: options } : options;
    Utils.defaultValue(options, 'prefix', true);
    const property = { name: propertyName, reference: ReferenceType.EMBEDDED } as EntityProperty;
    meta.properties[propertyName] = Object.assign(property, options);
  };
}

export type EmbeddedOptions = {
  entity?: string | (() => AnyEntity);
  type?: string;
  prefix?: string | boolean;
  nullable?: boolean;
};
