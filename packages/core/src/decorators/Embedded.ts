import type { AnyEntity, EntityKey, EntityProperty } from '../typings';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceKind } from '../enums';

export function Embedded<T extends object>(type: EmbeddedOptions | (() => AnyEntity) = {}, options: EmbeddedOptions = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.EMBEDDED);
    options = type instanceof Function ? { entity: type, ...options } : { ...type, ...options };
    Utils.defaultValue(options, 'prefix', true);
    meta.properties[propertyName as EntityKey<T>] = {
      name: propertyName,
      kind: ReferenceKind.EMBEDDED,
      ...options,
    } as EntityProperty;

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
