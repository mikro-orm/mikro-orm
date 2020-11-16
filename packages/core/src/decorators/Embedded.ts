import { AnyEntity, EntityProperty } from '../typings';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType } from '../enums';

export function Embedded(options: EmbeddedOptions | (() => AnyEntity) = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceType.EMBEDDED);
    options = options instanceof Function ? { entity: options } : options;
    Utils.defaultValue(options, 'prefix', true);
    const property = { name: propertyName, reference: ReferenceType.EMBEDDED } as EntityProperty;
    meta.properties[propertyName] = Object.assign(property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export type EmbeddedOptions = {
  entity?: string | (() => AnyEntity);
  type?: string;
  prefix?: string | boolean;
  nullable?: boolean;
  object?: boolean;
};
