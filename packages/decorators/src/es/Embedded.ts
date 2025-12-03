import {
  ReferenceKind,
  Utils,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type EmbeddedOptions,
  type EntityMetadata,
} from '@mikro-orm/core';
import { validateSingleDecorator } from '../utils.js';

export function Embedded<Owner extends object, Target>(type: EmbeddedOptions<Owner, Target> | (() => EntityName<Target> | EntityName<Target>[]) = {}, options: EmbeddedOptions<Owner, Target> = {}) {
  return function (value: unknown, context: ClassFieldDecoratorContext<Owner>) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.properties ??= {} as any;
    validateSingleDecorator(meta as any, context.name as string, ReferenceKind.EMBEDDED);
    options = type instanceof Function ? { entity: type, ...options } : { ...type, ...options };
    Utils.defaultValue(options, 'prefix', true);
    meta.properties![context.name as EntityKey<Owner>] = {
      name: context.name,
      kind: ReferenceKind.EMBEDDED,
      ...options,
    } as EntityProperty<Owner, Target>;
  };
}
