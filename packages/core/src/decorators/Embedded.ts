import type { AnyEntity, EntityProperty } from '../typings';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceKind } from '../enums';

export function Embedded(type: EmbeddedOptions | (() => AnyEntity) = {}, options: EmbeddedOptions = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.EMBEDDED);
    options = type instanceof Function ? { entity: type, ...options } : { ...type, ...options };
    Utils.defaultValue(options, 'prefix', true);
    const property = { name: propertyName, kind: ReferenceKind.EMBEDDED } as EntityProperty;
    meta.properties[propertyName] = Object.assign(property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export type EmbeddedOptions = {
  entity?: string | (() => AnyEntity | AnyEntity[]);
  type?: string;
  prefix?: string | boolean;
  nullable?: boolean;
  object?: boolean;
  array?: boolean;
  hidden?: boolean;
  serializer?: (value: any) => any;
  serializedName?: string;
};
