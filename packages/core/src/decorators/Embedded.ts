import type { AnyEntity, EntityKey, EntityName, EntityProperty } from '../typings.js';
import { MetadataValidator } from '../metadata/MetadataValidator.js';
import { MetadataStorage } from '../metadata/MetadataStorage.js';
import { Utils } from '../utils/Utils.js';
import { ReferenceKind } from '../enums.js';
import type { PropertyOptions } from './Property.js';

export function Embedded<Owner extends object, Target>(type: EmbeddedOptions<Owner, Target> | (() => EntityName<Target> | EntityName<Target>[]) = {}, options: EmbeddedOptions<Owner, Target> = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as Owner);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.EMBEDDED);
    options = type instanceof Function ? { entity: type, ...options } : { ...type, ...options };
    Utils.defaultValue(options, 'prefix', true);
    meta.properties[propertyName as EntityKey<Owner>] = {
      name: propertyName,
      kind: ReferenceKind.EMBEDDED,
      ...options,
    } as EntityProperty;

    return Utils.propertyDecoratorReturnValue();
  };
}

/** With `absolute` the prefix is set at the root of the entity (regardless of the nesting level) */
export type EmbeddedPrefixMode = 'absolute' | 'relative';

export interface EmbeddedOptions<Owner, Target> extends PropertyOptions<Owner> {
  entity?: string | (() => EntityName<Target> | EntityName<Target>[]);
  prefix?: string | boolean;
  prefixMode?: EmbeddedPrefixMode;
  object?: boolean;
  array?: boolean;
}
