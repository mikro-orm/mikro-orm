import {
  ReferenceKind,
  Utils,
  type AnyEntity,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type EmbeddedOptions,
} from '@mikro-orm/core';
import { validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

export function Embedded<Owner extends object, Target>(type: EmbeddedOptions<Owner, Target> | (() => EntityName<Target> | EntityName<Target>[]) = {}, options: EmbeddedOptions<Owner, Target> = {}) {
  return function (target: AnyEntity, propertyName: string) {
    const meta = getMetadataFromDecorator(target.constructor as Owner);
    validateSingleDecorator(meta, propertyName, ReferenceKind.EMBEDDED);
    options = type instanceof Function ? { entity: type, ...options } : { ...type, ...options };
    Utils.defaultValue(options, 'prefix', true);
    meta.properties[propertyName as EntityKey<Owner>] = {
      name: propertyName,
      kind: ReferenceKind.EMBEDDED,
      ...options,
    } as EntityProperty;
  };
}
