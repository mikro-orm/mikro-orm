import {
  ReferenceKind,
  Utils,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type EmbeddedOptions,
} from '@mikro-orm/core';
import { prepareMetadataContext } from '../utils.js';

export function Embedded<Owner extends object, Target>(
  type: EmbeddedOptions<Owner, Target> | (() => EntityName<Target> | EntityName[]) = {},
  options: EmbeddedOptions<Owner, Target> = {},
) {
  return function (value: unknown, context: ClassFieldDecoratorContext<Owner>) {
    const meta = prepareMetadataContext(context, ReferenceKind.EMBEDDED);
    options = type instanceof Function ? { entity: type, ...options } : { ...type, ...options };
    Utils.defaultValue(options, 'prefix', true);
    meta.properties![context.name as EntityKey<Owner>] = {
      name: context.name,
      kind: ReferenceKind.EMBEDDED,
      ...options,
    } as EntityProperty<Owner, Target>;
  };
}
